+++
title = "实战：为现有 Elasticsearch 8.4.3 Docker 集群启用安全认证"
slug = "enable-security-for-existing-elasticsearch-8-docker-cluster"
description = "本文提供一个详细、可执行的方案，指导您如何为一个已运行并存有数据的 Elasticsearch 8.4.3 Docker 集群安全地启用 TLS 加密和用户密码认证，并配置 Kibana 和 Logstash 接入。内容涵盖证书生成、滚动更新、密码重置、Kibana 服务账号配置等关键步骤。"
date = "2024-05-24"
updated = "2024-05-24"
draft = false

[taxonomies]
categories = ["技术", "运维"]
tags = ["Elasticsearch", "Docker", "安全", "Kibana", "Logstash", "TLS"]

[extra]
author = "Yanbo"
cover = "images/default-cover.jpg"
toc = true
reading_time = true
series = "Elasticsearch 运维实战"
featured = true
keywords = ["Elasticsearch 8", "Docker Compose", "启用安全", "TLS证书", "Kibana认证", "Logstash配置"]
lang = "zh"
canonical_url = "https://example.com/posts/enable-security-for-existing-elasticsearch-8-docker-cluster"
robots = "index, follow"
+++

本文是一篇详尽的实战笔记，记录了为一个正在运行且包含业务数据的 Elasticsearch 8.4.3 Docker 集群启用安全认证（TLS + 用户密码）的全过程。我们将跟随一个真实的排错历程，看如何从最初的规划开始，一步步解决遇到的证书配置、集群RED状态、磁盘空间危机、Kibana认证失败、Logstash接入等一系列连锁问题，最终成功为集群构建起安全防线。

<!--more-->

## 一、初始规划与环境勘察

我们的目标是为一个已有的3节点ES集群（es04, es05, es06）和Kibana实例增加安全认证。

**集群初始信息：**

* **es04:** `192.168.8.156`
* **es05:** `192.168.8.163`
* **es06:** `192.168.8.155`
* **版本:** Elasticsearch 8.4.3
* **部署方式:** Docker Compose
* **现状:** `xpack.security.enabled=false`，安全功能被显式关闭。

**关键第一步：确认当前主节点**

虽然配置中 `cluster.initial_master_nodes` 可能指定了初始主节点，但集群运行后会选举一个实际的主节点。安全初始化操作必须在当前主节点上进行。

```bash
curl http://192.168.8.155:9200/_cat/nodes?v
```

查询结果显示，当前主节点（带 `*` 标记）是 **es04**，而不是最初设想的es06。

```
ip            heap.percent ram.percent cpu load_1m load_5m load_15m node.role   master name
192.168.8.163           58          99   2    4.53    3.59     3.41 cdfhilmrstw -      es05
192.168.8.156           69          99   7    5.82    6.21     6.18 cdfhilmrstw *      es04
192.168.8.155           25          99   6    0.52    0.64     0.84 cdfhilmrstw -      es06
```

> **结论：** 所有安全引导操作都必须从 **es04** (`192.168.8.156`) 开始。

> 需要提前关闭 **Logstash** 防止数据丢失。

## 二、核心难题：为已有集群手动配置TLS

虽然ES 8.x宣称“开箱即用”的安全功能，但这通常适用于首次启动的全新集群。对于已有数据的集群，ES不会自动生成证书，而是要求我们手动提供。

当我们尝试直接在 `es04` 上启用安全并重启时，遇到了第一个致命错误：

```json
{"@timestamp":"2025-09-29T08:15:45.843Z", "log.level":"ERROR", "message":"fatal exception while booting Elasticsearch", "error.type":"org.elasticsearch.ElasticsearchSecurityException","error.message":"invalid SSL configuration for xpack.security.transport.ssl - server ssl configuration requires a key and certificate, but these have not been configured..."}
```

**解决方案：手动生成统一的TLS证书**

为了简化管理，我们决定生成一个包含所有节点IP的统一证书，供整个集群共用。

```markdown
多证书 vs. 单证书

多证书方案：为每个节点（es04, es05, es06）分别生成独立的证书。
	优点：符合常规 PKI 体系。
	缺点：管理三套证书文件，配置繁琐，容易出错。

单证书方案：生成一个“通配符”证书，其“主题备用名称 (SAN)”中包含所有节点的 IP 地址。
	优点：只需管理一套证书，所有节点的安全配置完全一致，极大简化了部署和维护。
	缺点：无明显缺点，尤其适用于内部集群。
```

1. **规划统一证书目录**

   在所有节点服务器上创建统一目录，并赋予权限：

   ```bash
   # 例如，在所有节点上创建
   mkdir -p /data/elasticsearch/certs
   chown -R 1000:1000 /data/elasticsearch/certs
   ```
2. **使用 `elasticsearch-certutil` 生成证书**

   在任意一台服务器上（如es04），启动一个临时ES容器来执行命令：

   ```bash
   # 启动临时容器
   docker run -it --rm \
     -v /data/elasticsearch/certs:/usr/share/elasticsearch/config/certs \
     elasticsearch:8.4.3 \
     /bin/bash

   # 在容器内执行
   # 1. 生成CA
   bin/elasticsearch-certutil ca --silent --pem --out config/certs/ca.zip
   unzip config/certs/ca.zip -d config/certs/

   # 2. 创建包含所有节点IP的配置文件
   cat > config/certs/instances.yml <<EOF
   instances:
     - name: "es-cluster"
       ip:
         - 192.168.8.155   # es06
         - 192.168.8.156   # es04
         - 192.168.8.163   # es05
   EOF

   # 3. 生成统一证书
   bin/elasticsearch-certutil cert \
     --silent --pem \
     --ca-cert config/certs/ca/ca.crt \
     --ca-key config/certs/ca/ca.key \
     --in config/certs/instances.yml \
     --out config/certs/es-cluster.zip
   unzip config/certs/es-cluster.zip -d config/certs/
   exit
   ```
3. **分发证书到所有节点**

   将生成好的 `/data/elasticsearch/certs` 目录完整复制到其他所有节点服务器的相同路径下，并确保权限正确。
4. **更新所有节点的 `docker-compose.yml`**

   为每个ES节点添加安全配置和证书挂载，以下为 `es04` 的示例，其他节点类似（只需修改 `network.publish_host` 和数据卷路径）：

   ```yaml
   version: "2.2"
   services:
     es04:
       image: elasticsearch:8.4.3
       container_name: es04
       volumes:
         # 原有数据和备份目录保持不变
         - /data_extend/elasticsearch/data/esdata04:/usr/share/elasticsearch/data
         - /data/elasticsearch/data/backup:/etc/elasticsearch/path.repo
         # --- 新增：挂载证书 ---
         - /data/elasticsearch/certs/ca:/usr/share/elasticsearch/config/certs/ca
         - /data/elasticsearch/certs/es-cluster:/usr/share/elasticsearch/config/certs/node
       ports:
         - 9200:9200
         - 9300:9300
       environment:
         # 原有配置保持不变
         - node.name=es04
         - cluster.name=docker-cluster
         - network.host=0.0.0.0
         - network.publish_host=192.168.8.156
         - cluster.initial_master_nodes=es06,es04,es05
         - discovery.seed_hosts=192.168.8.155,192.168.8.163
         - bootstrap.memory_lock=true
         # --- 关键：修改安全配置 ---
         - xpack.security.enabled=true
         - xpack.security.http.ssl.enabled=true
         - xpack.security.http.ssl.key=/usr/share/elasticsearch/config/certs/node/es-cluster.key
         - xpack.security.http.ssl.certificate=/usr/share/elasticsearch/config/certs/node/es-cluster.crt
         - xpack.security.http.ssl.certificate_authorities=/usr/share/elasticsearch/config/certs/ca/ca.crt
         - xpack.security.transport.ssl.enabled=true
         - xpack.security.transport.ssl.key=/usr/share/elasticsearch/config/certs/node/es-cluster.key
         - xpack.security.transport.ssl.certificate=/usr/share/elasticsearch/config/certs/node/es-cluster.crt
         - xpack.security.transport.ssl.certificate_authorities=/usr/share/elasticsearch/config/certs/ca/ca.crt
         # --- 删除以下旧配置 ---
         # - xpack.security.enabled=false
         # - xpack.security.http.ssl.enabled=false
         # - xpack.security.transport.ssl.enabled=false
       # ... 其他配置 ...
   ```

## 三、连锁反应：集群RED与磁盘危机

按照“先主后从”的顺序，我们重启了 `es04`。但当尝试重置 `elastic` 用户密码时，遇到了新的问题：集群健康状态为 **RED**。

```bash
docker exec es04 /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic
```

```
ERROR: Failed to determine the health of the cluster. Cluster health is currently RED.
```

**原因分析：**

1. **集群RED：** 因为只有 `es04` 启动了，而 `es05` 和 `es06` 尚未加入，导致部分索引的主分片（primary shards）无法分配。
2. **根本原因：** 进一步排查发现，**集群磁盘空间不足**，触发了ES的 **洪水水位（flood stage）**，导致所有索引被强制设为只读，分片无法分配，集群陷入RED状态。

**解决方案：**

1. **紧急解除只读状态**

   进入 `es04` 容器，通过 `localhost` 免密访问API，解除所有索引的只读锁定。

   ```bash
   docker exec es04 curl -XPUT "http://localhost:9200/_all/_settings" \
     -H "Content-Type: application/json" \
     -d '{"index.blocks.read_only_allow_delete": null}'
   ```
2. **清理磁盘空间**

   在宿主机上执行清理操作，例如：

   * 删除无用的Docker镜像/容器：`docker system prune -a -f`
   * 清理ES日志文件
   * 通过API删除不再需要的旧索引

## 四、攻克难关：重置密码与Kibana接入

在解决了磁盘危机和只读问题后，我们再次尝试重置密码，又遇到了两个小插曲：

1. **交互式确认失败：** `docker exec` 默认非交互式，无法响应 `[y/N]` 确认。
   ```
   ERROR: unable to read from standard input; is standard input open and a tty attached?
   ```
2. **密码重置失败：** 即使加上强制参数 `-f`，如果 `.security` 索引仍因磁盘问题不可写，命令依然会失败。

**最终解决方案：**

使用 `--batch` 参数跳过交互，并确保在执行前已解除只读状态。

```bash
docker exec es04 /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic -f --batch
```

成功获取 `elastic` 用户密码后，我们开始配置Kibana。

```
Password for the [elastic] user successfully reset.
New value: Mb1aKiqN=5X9M=ZZDLRF
```

## 五、终极排错：Kibana的“深坑”之旅

Kibana的接入过程远比预想的曲折，我们遇到了以下一系列问题：

**问题1：禁止使用 `elastic` 用户**

Kibana 8.x 出于安全考虑，禁止使用 `elastic` 超级用户进行后台连接。

```
[FATAL][root] Error: [config validation of [elasticsearch].username]: value of "elastic" is forbidden.
```

**方案A（推荐）：使用服务账号令牌（Service Account Token）**

1. 在 `es04` 上为Kibana创建服务令牌：
   ```bash
   docker exec -it es04 /usr/share/elasticsearch/bin/elasticsearch-service-tokens create elastic/kibana kibana
   ```
2. 在Kibana的 `docker-compose.yml` 中配置令牌环境变量：
   ```yaml
   - ELASTICSEARCH_SERVICEACCOUNT_TOKEN=AAEAAWVsYXN0aWMva2liYW5hL2tpYmFuYTo2YnBuc0JjOFJWLUQwS2ZLMENfMFdB
   ```

**方案B（备选）：使用 `kibana_system` 内置用户**

1. 为 `kibana_system` 用户设置密码：
   ```bash
   docker exec es04 /usr/share/elasticsearch/bin/elasticsearch-reset-password -u kibana_system -f --batch
   ```
2. 在Kibana的 `docker-compose.yml` 中配置用户名和密码：
   ```yaml
   - ELASTICSEARCH_USERNAME=kibana_system
   - ELASTICSEARCH_PASSWORD=your_new_password
   ```

**问题2：持续的“missing authentication credentials”错误**

尽管我们正确配置了服务令牌，Kibana日志仍然反复报认证失败。在逐一排查了令牌有效性、环境变量加载、CA证书路径后，我们发现了最终的“元凶”。

**根本原因：Kibana镜像版本不匹配且非官方**

通过 `docker images` 命令发现，正在使用的 `kibana:8.4.3` 镜像是一个三年前的非官方镜像。

```
REPOSITORY                                      TAG       IMAGE ID       CREATED         SIZE
kibana                                          8.4.3     b14d91e49f3f   3 years ago     800MB
```

这个镜像与官方的 `elasticsearch:8.4.3` 内部认证逻辑不兼容，导致服务令牌无法被正确使用。

**最终解决方案：**

1. 拉取官方Kibana镜像：

   ```bash
   docker pull docker.elastic.co/kibana/kibana:8.4.3
   ```
2. 在 `docker-compose.yml` 中明确使用官方镜像：

   ```yaml

     kibana:
       image: docker.elastic.co/kibana/kibana:8.4.3  
       container_name: kibana
       volumes:
         - /projects/mid/es_kibana/kibana_data:/usr/share/kibana/data
         - /data/elasticsearch/certs/ca/ca.crt:/usr/share/kibana/config/certs/ca.crt
       ports:
         - 5601:5601
       environment:
         - SERVER_NAME=kibana
         - SERVER_HOST="0.0.0.0"
         - ELASTICSEARCH_HOSTS=["https://192.168.8.156:9200"]

         - ELASTICSEARCH_USERNAME=kibana_system
         - ELASTICSEARCH_PASSWORD="w7_XjojjD6BMPhSEo2LK"
         #- ELASTICSEARCH_SERVICEACCOUNT_TOKEN='AAEAAWVsYXN0aWMva2liYW5hL2tpYmFuYTo2YnBuc0JjOFJWLUQwS2ZLMENfMFdB'
         - ELASTICSEARCH_SSL_CERTIFICATEAUTHORITIES=/usr/share/kibana/config/certs/ca.crt

         # Kibana 加密密钥
         - XPACK_SECURITY_ENCRYPTIONKEY="fB+M6UNimm4yRC82555FS6ZI1wxYIr9qDTjNqyWGADY="
         - XPACK_ENCRYPTEDSAVEDOBJECTS_ENCRYPTIONKEY="fB+M6UNimm4yRC82555FS6ZI1wxYIr9qDTjNqyWGADY="

         # Reporting
         - XPACK_REPORTING_KIBANASERVER_HOSTNAME=localhost
         # 关键：延迟健康检查，给 ES 充足启动时间
         - ELASTICSEARCH_HEALTHCHECKDELAY=60000
         - ELASTICSEARCH_REQUESTTIMEOUT=120000
         - xpack.reporting.csv.maxSizeBytes=2097152000
         - xpack.reporting.queue.timeout=1800000

   ```
3. （可选但推荐）为了彻底解决环境变量在启动时序上的不确定性，最终我们放弃了环境变量，改为挂载 `kibana.yml` 配置文件。

   ```yaml
   # /path/to/kibana.yml
   server.name: kibana
   server.host: "0.0.0.0"
   elasticsearch.hosts: ["https://192.168.8.156:9200"]
   elasticsearch.serviceAccountToken: "AAEAAWVsYXN0aWMva2liYW5hL2tpYmFuYTo2YnBuc0JjOFJWLUQwS2ZLMENfMFdB"
   elasticsearch.ssl.certificateAuthorities: ["/usr/share/kibana/config/certs/ca.crt"]
   ```

   并在 `docker-compose.yml` 中挂载此文件，同时删除所有 `ELASTICSEARCH_*` 环境变量。

## 六、收尾工作：更新Logstash

最后，所有向ES写入数据的客户端都必须更新配置。以Logstash为例：

1. **更新 `output` 配置**

   在 `logstash.conf` 的 `elasticsearch` output 插件中，添加HTTPS、用户认证和SSL证书验证。

   ```ruby
   output {
     elasticsearch {
       hosts => ["https://192.168.8.155:9200","https://192.168.8.156:9200","https://192.168.8.163:9200"]
       user => "elastic"
       password => "Mb1aKiqN=5X9M=ZZDLRF"
       ssl => true
       ssl_certificate_authorities => ["/usr/share/logstash/config/certs/ca.crt"]
       # ...
     }
   }
   ```
2. **更新 `logstash.yml` 监控配置**

   ```yaml
   xpack.monitoring.elasticsearch.hosts: ["https://192.168.8.155:9200"]
   xpack.monitoring.elasticsearch.username: "elastic"
   xpack.monitoring.elasticsearch.password: "Mb1aKiqN=5X9M=ZZDLRF"
   xpack.monitoring.elasticsearch.ssl.certificate_authority: "/usr/share/logstash/config/certs/ca.crt"
   ```
3. **挂载CA证书**

   在Logstash的 `docker-compose.yml` 中挂载CA证书。

   ```yml
   version: "3.3"

   services:
     logstash:
       image: docker.elastic.co/logstash/logstash:8.8.2
       container_name: logstash
       restart: unless-stopped
       network_mode: "host"  # 使用宿主机网络，端口直接映射
       volumes:
         - /projects/mid/logstash:/usr/share/logstash/config
         - /projects/mid/logstash:/usr/share/logstash/pipeline
         - /data/elasticsearch/certs/ca/ca.crt:/usr/share/logstash/config/certs/ca.crt:ro
       environment:
         PATH: /usr/share/logstash/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
         ELASTIC_CONTAINER: "true"
         LANG: en_US.UTF-8
         LC_ALL: en_US.UTF-8

   ```

## 总结

为已有数据的ES 8.x集群启用安全认证是一项系统工程，充满了挑战。通过这次实战，我们总结出以下关键经验：

* **确认主节点：** 永远不要想当然，务必通过 `_cat/nodes` 确认当前主节点。
* **手动配置TLS：** 对已有数据的集群，必须手动生成并配置TLS证书。
* **磁盘空间是生命线：** 密切监控磁盘使用率，避免因“洪水水位”导致集群只读和RED状态。
* **Kibana认证：** 优先使用服务账号令牌，备选方案是 `kibana_system` 用户，绝不能用 `elastic` 用户。
* **官方镜像至关重要：** 必须使用与ES版本完全匹配的官方Elastic Stack镜像，否则会遇到各种兼容性“玄学”问题。
* **配置文件优于环境变量：** 对于复杂的或有启动时序依赖的配置，使用 `kibana.yml` 或 `logstash.yml` 比环境变量更稳健。
