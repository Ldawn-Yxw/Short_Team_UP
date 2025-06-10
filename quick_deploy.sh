#!/bin/bash

# 快速部署脚本 - 运动组队系统
# 使用方法: ./quick_deploy.sh your-domain.com your-server-ip

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印彩色信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ $# -lt 2 ]; then
    print_error "使用方法: $0 <域名> <服务器IP>"
    print_info "例如: $0 example.com 192.168.1.100"
    exit 1
fi

DOMAIN=$1
SERVER_IP=$2

print_info "开始部署运动组队系统到 $DOMAIN ($SERVER_IP)"

# 1. 系统更新
print_info "更新系统包..."
sudo apt update && sudo apt upgrade -y

# 2. 安装基础软件
print_info "安装基础软件..."
sudo apt install -y curl wget git unzip software-properties-common

# 3. 安装Python 3.9
print_info "安装Python 3.9..."
sudo apt install -y python3.9 python3.9-pip python3.9-dev python3.9-venv

# 4. 安装PostgreSQL
print_info "安装PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# 5. 安装Nginx
print_info "安装Nginx..."
sudo apt install -y nginx

# 6. 安装Redis
print_info "安装Redis..."
sudo apt install -y redis-server

# 7. 安装Supervisor
print_info "安装Supervisor..."
sudo apt install -y supervisor

# 8. 配置防火墙
print_info "配置防火墙..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# 9. 创建数据库
print_info "配置数据库..."
DB_PASSWORD=$(openssl rand -base64 32)
sudo -u postgres psql -c "CREATE DATABASE sport_team_up;"
sudo -u postgres psql -c "CREATE USER sport_team_up_user WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sport_team_up TO sport_team_up_user;"

# 10. 克隆代码
print_info "下载项目代码..."
sudo mkdir -p /var/www
cd /var/www
if [ -d "sport_team_up" ]; then
    sudo rm -rf sport_team_up
fi
sudo git clone https://github.com/Ldawn-Yxw/Short_Team_UP.git sport_team_up
cd sport_team_up

# 11. 创建虚拟环境
print_info "创建Python虚拟环境..."
python3.9 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 12. 创建环境变量文件
print_info "配置环境变量..."
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
cat > .env << EOF
DEBUG=False
SECRET_KEY=$SECRET_KEY
DB_NAME=sport_team_up
DB_USER=sport_team_up_user
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,$SERVER_IP
EOF

# 13. Django配置
print_info "配置Django..."
export DJANGO_SETTINGS_MODULE=sport_team_up.settings_production
python manage.py makemigrations
python manage.py migrate
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@$DOMAIN', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell
python manage.py collectstatic --noinput

# 14. 配置Nginx
print_info "配置Nginx..."
sudo sed "s/your-domain.com/$DOMAIN/g; s/your-server-ip/$SERVER_IP/g" deploy/nginx.conf > /tmp/nginx_sport_team_up.conf
sudo mv /tmp/nginx_sport_team_up.conf /etc/nginx/sites-available/sport_team_up
sudo ln -sf /etc/nginx/sites-available/sport_team_up /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# 15. 配置Supervisor
print_info "配置Supervisor..."
sudo cp deploy/supervisor.conf /etc/supervisor/conf.d/sport_team_up.conf

# 16. 设置权限
print_info "设置文件权限..."
sudo chown -R www-data:www-data /var/www/sport_team_up
sudo chmod -R 755 /var/www/sport_team_up

# 17. 启动服务
print_info "启动服务..."
sudo systemctl enable nginx postgresql redis-server supervisor
sudo systemctl start nginx postgresql redis-server supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start sport_team_up

# 18. 检查服务状态
print_info "检查服务状态..."
sleep 5
NGINX_STATUS=$(sudo systemctl is-active nginx)
POSTGRESQL_STATUS=$(sudo systemctl is-active postgresql)
REDIS_STATUS=$(sudo systemctl is-active redis-server)
APP_STATUS=$(sudo supervisorctl status sport_team_up | awk '{print $2}')

print_info "服务状态检查:"
echo "  - Nginx: $NGINX_STATUS"
echo "  - PostgreSQL: $POSTGRESQL_STATUS"
echo "  - Redis: $REDIS_STATUS"
echo "  - Django App: $APP_STATUS"

# 19. 安装SSL证书（可选）
read -p "是否安装免费SSL证书? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "安装SSL证书..."
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # 设置自动续期
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
fi

# 20. 部署完成
print_success "=========================================="
print_success "🎉 部署完成！"
print_success "=========================================="
echo
print_info "访问信息:"
echo "  - 网站地址: http://$DOMAIN 或 http://$SERVER_IP"
echo "  - 管理后台: http://$DOMAIN/admin/"
echo "  - 管理员账号: admin"
echo "  - 管理员密码: admin123"
echo
print_info "数据库信息:"
echo "  - 数据库名: sport_team_up"
echo "  - 用户名: sport_team_up_user"
echo "  - 密码: $DB_PASSWORD"
echo
print_warning "重要提醒:"
echo "  1. 请立即修改管理员密码！"
echo "  2. 请保存好数据库密码！"
echo "  3. 如果有域名，请配置DNS解析指向 $SERVER_IP"
echo
print_info "查看日志命令:"
echo "  - sudo tail -f /var/log/sport_team_up.log"
echo "  - sudo supervisorctl status"
echo
print_success "现在你的运动组队系统已经可以被全世界访问了！ 🌍" 