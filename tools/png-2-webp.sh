#!/bin/bash

# 检查是否安装了必要的软件
if ! command -v cwebp &> /dev/null; then
    echo "需要安装 libwebp 工具."
    echo "使用以下命令安装它们:"
    echo "sudo apt-get install webp"
    exit 1
fi

echo "开始使用默认值处理图片..."
echo "使用方法: $0 <目录：默认当前目录> <宽度：默认200> <高度：默认120> <质量：默认75>"

# 参数赋值，支持默认值
directory=${1:-.} # 默认值为当前目录
width=${2:-200} # 默认宽度为800像素
height=${3:-200} # 默认高度为600像素
quality=${4:-60} # 默认质量为75

# 遍历目录下的所有 PNG 文件并转换
for file in "$directory"/*.png; do
    # 检查文件是否存在
    if [ -e "$file" ]; then
        # 获取文件名不含扩展名
        filename=$(basename "$file" .png)
        
        # 检查 WebP 文件是否存在
        if [ ! -e "$directory"/"$filename".webp ]; then
            # 转换为 WebP 格式
            cwebp -resize "$width" "$height" -q "$quality" "$file" -o "$directory"/"$filename".webp
            if [ $? -eq 0 ]; then
                echo "转换成功: $filename.webp"
                # rm -f "$file"
                # echo "删除原始文件: $file"
            else
                echo "转换失败: $filename.webp"
            fi
        else
            echo "WebP文件已存在: $filename.webp"
        fi        
    else
        echo "找不到文件: $file"
    fi
done
