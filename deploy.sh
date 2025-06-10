#!/bin/bash

# 运动组队系统云服务器部署脚本
# 适用于 Ubuntu 20.04 LTS

echo "🚀 开始部署运动组队系统..."

# 更新系统
echo "📦 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装必要软件
echo "🔧 安装基础软件..."
sudo apt install -y curl wget git unzip software-properties-common

# 安装 Python 3.9
echo "🐍 安装 Python 3.9..."
sudo apt install -y python3.9 python3.9-pip python3.9-dev python3.9-venv

# 安装 Node.js (用于前端构建)
echo "📱 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL
echo "🗄️ 安装 PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# 安装 Nginx
echo "🌐 安装 Nginx..."
sudo apt install -y nginx

# 安装 Redis (用于缓存)
echo "⚡ 安装 Redis..."
sudo apt install -y redis-server

# 安装 Supervisor (用于进程管理)
echo "👮 安装 Supervisor..."
sudo apt install -y supervisor

# 创建项目目录
echo "📁 创建项目目录..."
sudo mkdir -p /var/www/sport_team_up
sudo chown $USER:$USER /var/www/sport_team_up

# 配置防火墙
echo "🔒 配置防火墙..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "✅ 基础环境配置完成！"
echo "�� 接下来需要手动配置数据库和部署代码" 