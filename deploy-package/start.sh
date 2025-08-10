#!/bin/bash

# xs.momofx.cn 小说网站启动脚本

echo "🚀 启动 xs.momofx.cn 小说网站..."

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，请先安装 PM2"
    echo "安装命令: npm install -g pm2"
    exit 1
fi

# 创建必要目录
mkdir -p logs
mkdir -p uploads

# 设置目录权限
chmod 755 logs
chmod 755 uploads
chmod 755 data

# 安装依赖
echo "📦 安装依赖包..."
npm install

# 启动应用
echo "🔄 启动PM2进程..."
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 显示状态
pm2 list

echo "✅ 启动完成！"
echo "🌐 网站地址: https://xs.momofx.cn"
echo "🔧 管理后台: https://xs.momofx.cn/admin-login.html"
echo "📊 查看日志: pm2 logs xs-novel-site"
echo "🔄 重启应用: pm2 restart xs-novel-site"
