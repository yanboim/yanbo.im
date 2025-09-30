+++
weight = 0
title = "docker install n8n"
description=""
toc=true
[extra]
section = 1
+++

# 🚀 n8n 部署文档（Docker + Nginx Proxy Manager）

本文提供三种部署方案：

- **SQLite**（默认，轻量，单文件存储）
    
- **PostgreSQL**（生产推荐，稳定可靠）
    
- **MySQL**（兼容性方案，可替代 PostgreSQL）
    
---

## 1. 初始化环境

### 1.1 创建目录

```bash
mkdir -p /data/n8n/{n8n,local-files,n8n-db,mysql-db}
cd /data/n8n
```

### 1.2 设置权限

- `n8n` 容器以 `node` 用户（1000:1000）运行
    
- `postgres` 容器以 `postgres` 用户（999:999）运行
    
- `mysql` 容器以 `mysql` 用户（999:999）运行
    

```bash
# n8n 数据目录
chown -R 1000:1000 n8n local-files
chmod -R 755 n8n local-files

# PostgreSQL 数据目录
chown -R 999:999 n8n-db
chmod -R 700 n8n-db

# MySQL 数据目录
chown -R 999:999 mysql-db
chmod -R 700 mysql-db
```

---

## 2. SQLite 版本（最简单）

`docker-compose.yml`

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    user: "1000:1000"
    ports:
      - "127.0.0.1:5678:5678" # 本机代理
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin@n8n
      - N8N_HOST=n8n.xxx.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.xxx.com/
      - NODE_ENV=production
      - TZ=Asia/Shanghai
      - DB_TYPE=sqlite
      - DB_SQLITE_POOL_SIZE=5
      - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
    volumes:
      - ./n8n:/home/node/.n8n
      - ./local-files:/files
    networks:
      - n8n-network

networks:
  n8n-network:
    external: true
```

👉 适合 **个人/小型项目**，数据保存在 `n8n/` 文件夹。

## 3. PostgreSQL 版本（生产推荐）

### 3.1 数据库配置 `docker-compose.db.yml`

```yaml
services:
  n8n-db:
    image: postgres:16
    container_name: n8n-db
    restart: always
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=strongpassword
      - POSTGRES_DB=n8n
      - TZ=Asia/Shanghai
    volumes:
      - ./n8n-db:/var/lib/postgresql/data
    networks:
      - n8n-network

networks:
  n8n-network:
    external: true
```

启动数据库：

```bash
docker-compose -f docker-compose.db.yml up -d
```
### 3.2 n8n 配置 `docker-compose.yml`

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    user: "1000:1000"
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin@n8n
      - N8N_HOST=n8n.xxx.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.xxx.com/
      - NODE_ENV=production
      - TZ=Asia/Shanghai
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=n8n-db
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=strongpassword
      - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
    volumes:
      - ./n8n:/home/node/.n8n
      - ./local-files:/files
    networks:
      - n8n-network

networks:
  n8n-network:
    external: true
```

👉 适合 **生产环境**，支持高并发、数据安全。

## 4. MySQL 版本（可选）

### 4.1 数据库配置 `docker-compose.mysql.yml`

```yaml
services:
  n8n-mysql:
    image: mysql:8.4
    container_name: n8n-mysql
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=n8n
      - MYSQL_USER=n8n
      - MYSQL_PASSWORD=strongpassword
      - TZ=Asia/Shanghai
    command: --default-authentication-plugin=mysql_native_password
    volumes:
      - ./mysql-db:/var/lib/mysql
    networks:
      - n8n-network

networks:
  n8n-network:
    external: true
```

启动数据库：

```bash
docker-compose -f docker-compose.mysql.yml up -d
```

### 4.2 n8n 配置 `docker-compose.yml`

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    user: "1000:1000"
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin@n8n
      - N8N_HOST=n8n.xxx.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.xxx.com/
      - NODE_ENV=production
      - TZ=Asia/Shanghai
      - DB_TYPE=mariadb
      - DB_MYSQLDB_HOST=n8n-mysql
      - DB_MYSQLDB_PORT=3306
      - DB_MYSQLDB_DATABASE=n8n
      - DB_MYSQLDB_USER=n8n
      - DB_MYSQLDB_PASSWORD=strongpassword
      - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
    volumes:
      - ./n8n:/home/node/.n8n
      - ./local-files:/files
    networks:
      - n8n-network

networks:
  n8n-network:
    external: true
```

👉 适合 **已有 MySQL 环境** 的场景。

## 5. Nginx Proxy Manager 配置

1. **Domain Names**: `n8n.xxx.com`
2. **Scheme**: `http`
3. **Forward Hostname/IP**: `n8n`
4. **Forward Port**: `5678`
5. ✅ 勾选 `Websockets Support`
6. SSL：申请 Let’s Encrypt 证书，勾选 `Force SSL` + `HTTP/2`
---

## 6. 登录 n8n

浏览器打开 👉 [https://n8n.xxx.com](https://n8n.xxx.com/)

- 用户名：`admin`
- 密码：`admin@n8n`

---
## 一键安装脚本
**n8n 一键部署脚本**，支持 SQLite / PostgreSQL / MySQL 三种数据库，自动创建目录、设置权限、生成 docker-compose 文件，并启动容器。

# 🛠️ n8n 一键部署脚本

保存为 `deploy_n8n.sh`，可执行：

```bash
#!/bin/bash
# n8n 一键部署脚本
# 使用前请修改 DOMAIN、DB_TYPE 和密码等配置

set -e

# ====== 配置区域 ======
DOMAIN="n8n.xxx.com"
DB_TYPE="sqlite"  # sqlite / postgres / mysql
N8N_USER="admin"
N8N_PASSWORD="admin@n8n"
TZ="Asia/Shanghai"

# PostgreSQL/MySQL 相关（仅在 DB_TYPE 为 postgres/mysql 时使用）
DB_HOST="n8n-db"           # 容器名
DB_PORT=""                  # postgres:5432 / mysql:3306
DB_NAME="n8n"
DB_USER="n8n"
DB_PASSWORD="strongpassword"

# 部署目录
BASE_DIR="/data/n8n"
N8N_DIR="$BASE_DIR/n8n"
FILES_DIR="$BASE_DIR/local-files"
POSTGRES_DIR="$BASE_DIR/n8n-db"
MYSQL_DIR="$BASE_DIR/mysql-db"

# ====== 初始化目录 ======
mkdir -p "$N8N_DIR" "$FILES_DIR" "$POSTGRES_DIR" "$MYSQL_DIR"

# 设置权限
chown -R 1000:1000 "$N8N_DIR" "$FILES_DIR"
chmod -R 755 "$N8N_DIR" "$FILES_DIR"

chown -R 999:999 "$POSTGRES_DIR" "$MYSQL_DIR"
chmod -R 700 "$POSTGRES_DIR" "$MYSQL_DIR"

# ====== 生成 docker-compose.yml ======
COMPOSE_FILE="$BASE_DIR/docker-compose.yml"
cat > $COMPOSE_FILE <<EOF
version: "3.8"
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    user: "1000:1000"
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=$N8N_USER
      - N8N_BASIC_AUTH_PASSWORD=$N8N_PASSWORD
      - N8N_HOST=$DOMAIN
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://$DOMAIN/
      - NODE_ENV=production
      - TZ=$TZ
      - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
EOF

if [ "$DB_TYPE" = "sqlite" ]; then
  cat >> $COMPOSE_FILE <<EOF
      - DB_TYPE=sqlite
      - DB_SQLITE_POOL_SIZE=5
EOF
elif [ "$DB_TYPE" = "postgres" ]; then
  DB_PORT=5432
  cat >> $COMPOSE_FILE <<EOF
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=$DB_HOST
      - DB_POSTGRESDB_PORT=$DB_PORT
      - DB_POSTGRESDB_DATABASE=$DB_NAME
      - DB_POSTGRESDB_USER=$DB_USER
      - DB_POSTGRESDB_PASSWORD=$DB_PASSWORD
EOF
elif [ "$DB_TYPE" = "mysql" ]; then
  DB_PORT=3306
  cat >> $COMPOSE_FILE <<EOF
      - DB_TYPE=mariadb
      - DB_MYSQLDB_HOST=$DB_HOST
      - DB_MYSQLDB_PORT=$DB_PORT
      - DB_MYSQLDB_DATABASE=$DB_NAME
      - DB_MYSQLDB_USER=$DB_USER
      - DB_MYSQLDB_PASSWORD=$DB_PASSWORD
EOF
else
  echo "错误：不支持的 DB_TYPE: $DB_TYPE"
  exit 1
fi

cat >> $COMPOSE_FILE <<EOF
    volumes:
      - ./n8n:/home/node/.n8n
      - ./local-files:/files
    networks:
      - n8n-network

networks:
  n8n-network:
    external: true
EOF

# ====== 启动容器 ======
docker network create n8n-network 2>/dev/null || true
docker-compose -f $COMPOSE_FILE up -d

echo "=============================="
echo "n8n 部署完成！"
echo "访问地址: https://$DOMAIN"
echo "用户名: $N8N_USER"
echo "密码: $N8N_PASSWORD"
echo "=============================="
```
## 使用方法

1. 上传脚本到服务器：
```bash
scp deploy_n8n.sh root@your_server:/root/
```
2. 赋予可执行权限：
```bash
chmod +x deploy_n8n.sh
```
3. 编辑脚本，设置：
- `DOMAIN` → 你的域名
- `DB_TYPE` → sqlite / postgres / mysql
- 数据库用户名和密码
- 时区 `TZ`
4. 执行部署：
```bash
./deploy_n8n.sh
```
5. 打开浏览器访问：
```
https://n8n.xxx.com
```
---

# 🛠 n8n-deploy CLI 工具（Python）

保存为 `n8n_deploy.py`，执行 `python3 n8n_deploy.py --help` 查看使用说明。

```python
#!/usr/bin/env python3
import os
import subprocess
import argparse
import sys

def check_docker():
    try:
        subprocess.run(["docker", "version"], check=True, stdout=subprocess.DEVNULL)
        subprocess.run(["docker-compose", "version"], check=True, stdout=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        print("Docker 或 Docker Compose 未安装，请先安装。")
        sys.exit(1)

def create_dirs(base_dir, db_type):
    dirs = [os.path.join(base_dir, "n8n"), os.path.join(base_dir, "local-files")]
    if db_type == "postgres":
        dirs.append(os.path.join(base_dir, "n8n-db"))
    elif db_type == "mysql":
        dirs.append(os.path.join(base_dir, "mysql-db"))
    
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    
    # 设置权限
    os.chown(os.path.join(base_dir, "n8n"), 1000, 1000)
    os.chmod(os.path.join(base_dir, "n8n"), 0o755)
    os.chown(os.path.join(base_dir, "local-files"), 1000, 1000)
    os.chmod(os.path.join(base_dir, "local-files"), 0o755)
    if db_type == "postgres":
        os.chown(os.path.join(base_dir, "n8n-db"), 999, 999)
        os.chmod(os.path.join(base_dir, "n8n-db"), 0o700)
    if db_type == "mysql":
        os.chown(os.path.join(base_dir, "mysql-db"), 999, 999)
        os.chmod(os.path.join(base_dir, "mysql-db"), 0o700)

def generate_compose(base_dir, domain, db_type, db_user, db_password, db_name):
    compose_file = os.path.join(base_dir, "docker-compose.yml")
    with open(compose_file, "w") as f:
        f.write(f"""version: "3.8"
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    user: "1000:1000"
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD={db_password}
      - N8N_HOST={domain}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://{domain}/
      - NODE_ENV=production
      - TZ=Asia/Shanghai
      - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
""")
        if db_type == "sqlite":
            f.write("      - DB_TYPE=sqlite\n      - DB_SQLITE_POOL_SIZE=5\n")
        elif db_type == "postgres":
            f.write(f"""      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=n8n-db
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE={db_name}
      - DB_POSTGRESDB_USER={db_user}
      - DB_POSTGRESDB_PASSWORD={db_password}\n""")
        elif db_type == "mysql":
            f.write(f"""      - DB_TYPE=mariadb
      - DB_MYSQLDB_HOST=n8n-mysql
      - DB_MYSQLDB_PORT=3306
      - DB_MYSQLDB_DATABASE={db_name}
      - DB_MYSQLDB_USER={db_user}
      - DB_MYSQLDB_PASSWORD={db_password}\n""")
        
        f.write("""    volumes:
      - ./n8n:/home/node/.n8n
      - ./local-files:/files
    networks:
      - n8n-network

networks:
  n8n-network:
    external: true
""")
    return compose_file

def start_compose(compose_file):
    subprocess.run(["docker", "network", "create", "n8n-network"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(["docker-compose", "-f", compose_file, "up", "-d"], check=True)

def main():
    parser = argparse.ArgumentParser(description="n8n 部署 CLI 工具")
    parser.add_argument("--domain", required=True, help="n8n 域名，例如 n8n.1218.fun")
    parser.add_argument("--db", choices=["sqlite","postgres","mysql"], default="sqlite", help="数据库类型")
    parser.add_argument("--db-user", default="n8n", help="数据库用户名")
    parser.add_argument("--db-password", default="ipuu@n8n", help="数据库密码")
    parser.add_argument("--db-name", default="n8n", help="数据库名")
    parser.add_argument("--base-dir", default="/data/n8n", help="部署目录")
    args = parser.parse_args()

    check_docker()
    create_dirs(args.base_dir, args.db)
    compose_file = generate_compose(args.base_dir, args.domain, args.db, args.db_user, args.db_password, args.db_name)
    start_compose(compose_file)

    print("\n==============================")
    print(f"n8n 部署完成！访问 https://{args.domain}")
    print(f"用户名: admin")
    print(f"密码: {args.db_password}")
    print("==============================\n")

if __name__ == "__main__":
    main()
```

## 使用方法

1. 上传脚本到服务器并赋权：
```bash
scp n8n_deploy.py root@your_server:/root/
chmod +x n8n_deploy.py
```

2. 查看帮助：
```bash
python3 n8n_deploy.py --help
```

3. 部署 SQLite：
```bash
python3 n8n_deploy.py --domain n8n.1218.fun --db sqlite
```

4. 部署 PostgreSQL：
```bash
python3 n8n_deploy.py --domain n8n.1218.fun --db postgres --db-user n8n --db-password strongpassword --db-name n8n
```

5. 部署 MySQL：
```bash
python3 n8n_deploy.py --domain n8n.1218.fun --db mysql --db-user n8n --db-password strongpassword --db-name n8n
```
---

✅ 优点：

- 可选数据库类型，灵活部署
- 自动创建目录、设置权限
- 自动生成 docker-compose.yml
- 自动启动容器
- 支持命令行参数，方便脚本化或自动化