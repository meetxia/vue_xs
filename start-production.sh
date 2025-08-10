#!/bin/bash

echo "正在启动小红书风格小说网站（生产环境）..."

# 设置生产环境变量
export NODE_ENV=production

# 检查.env文件是否存在
if [ ! -f .env ]; then
    echo "错误：未找到.env文件，请先配置环境变量"
    echo "请复制.env.example为.env并填入正确的配置"
    exit 1
fi

# 检查node_modules是否存在
if [ ! -d node_modules ]; then
    echo "正在安装依赖..."
    npm install
fi

# 启动服务器
echo "启动生产环境服务器..."
npm start
