# 🚀 运动组队系统云服务器部署指南

## 📋 部署前准备

### 1. 云服务器选择
- **推荐配置**: 2核4GB内存，40GB存储，5Mbps带宽
- **操作系统**: Ubuntu 20.04 LTS
- **云服务商**: 阿里云、腾讯云、华为云等

### 2. 域名准备（可选）
- 购买域名（如：your-domain.com）
- 配置DNS解析指向服务器IP

## 🔧 服务器环境配置

### 1. 连接服务器
```bash
ssh root@your-server-ip
```

### 2. 运行自动化配置脚本
```bash
# 上传并运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

### 3. 配置数据库
```bash
# 配置PostgreSQL
sudo -u postgres psql

# 在PostgreSQL中执行：
CREATE DATABASE sport_team_up;
CREATE USER sport_team_up_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE sport_team_up TO sport_team_up_user;
\q
```

## 📦 代码部署

### 1. 克隆代码
```bash
cd /var/www
git clone https://github.com/Ldawn-Yxw/Short_Team_UP.git sport_team_up
cd sport_team_up
```

### 2. 创建虚拟环境
```bash
python3.9 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. 环境变量配置
```bash
# 创建环境变量文件
nano .env
```

在`.env`文件中添加：
```
DEBUG=False
SECRET_KEY=your-very-secret-key-here
DB_NAME=sport_team_up
DB_USER=sport_team_up_user
DB_PASSWORD=your_strong_password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,your-server-ip
```

### 4. Django配置
```bash
# 设置生产环境
export DJANGO_SETTINGS_MODULE=sport_team_up.settings_production

# 数据库迁移
python manage.py makemigrations
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 收集静态文件
python manage.py collectstatic --noinput
```

## 🌐 Web服务器配置

### 1. 配置Nginx
```bash
# 复制Nginx配置
sudo cp deploy/nginx.conf /etc/nginx/sites-available/sport_team_up

# 修改配置文件中的域名
sudo nano /etc/nginx/sites-available/sport_team_up

# 启用站点
sudo ln -s /etc/nginx/sites-available/sport_team_up /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. 配置Supervisor
```bash
# 复制Supervisor配置
sudo cp deploy/supervisor.conf /etc/supervisor/conf.d/sport_team_up.conf

# 更新并启动
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start sport_team_up
```

### 3. 设置权限
```bash
# 设置文件权限
sudo chown -R www-data:www-data /var/www/sport_team_up
sudo chmod -R 755 /var/www/sport_team_up
```

## 🔒 SSL证书配置（可选但推荐）

### 使用Let's Encrypt免费SSL
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚀 启动服务

```bash
# 启动所有服务
sudo systemctl start nginx
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo supervisorctl start sport_team_up

# 设置开机自启
sudo systemctl enable nginx
sudo systemctl enable postgresql
sudo systemctl enable redis-server
sudo systemctl enable supervisor
```

## 📊 监控和维护

### 1. 查看日志
```bash
# Django应用日志
sudo tail -f /var/log/sport_team_up.log

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 系统日志
sudo journalctl -f
```

### 2. 服务状态检查
```bash
# 检查服务状态
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo supervisorctl status
```

### 3. 更新代码
```bash
cd /var/www/sport_team_up
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo supervisorctl restart sport_team_up
```

## 🔍 故障排除

### 常见问题：

1. **502 Bad Gateway**
   - 检查Django进程：`sudo supervisorctl status`
   - 查看错误日志：`sudo tail -f /var/log/sport_team_up.log`

2. **静态文件404**
   - 重新收集静态文件：`python manage.py collectstatic --noinput`
   - 检查Nginx配置

3. **数据库连接错误**
   - 检查PostgreSQL状态：`sudo systemctl status postgresql`
   - 验证数据库配置和密码

4. **权限问题**
   - 重新设置权限：`sudo chown -R www-data:www-data /var/www/sport_team_up`

## 📞 技术支持

如果遇到问题，可以：
1. 检查相关日志文件
2. 查看GitHub Issues
3. 联系技术支持

## 🎉 部署完成

部署完成后，可以通过以下方式访问：
- HTTP: `http://your-domain.com` 或 `http://your-server-ip`
- HTTPS: `https://your-domain.com`（如果配置了SSL）
- 管理后台: `http://your-domain.com/admin/`

现在你的运动组队系统已经可以被全世界访问了！ 🌍 