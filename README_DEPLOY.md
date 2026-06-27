# 部署指南 - ayuu.fun

## 前置要求

- 服务器: Linux (Ubuntu 20.04+)
- Docker & Docker Compose
- 域名: ayuu.fun 已解析到服务器 IP
- SSL 证书 (Let's Encrypt)

## 部署步骤

### 1. 克隆项目

```bash
git clone https://github.com/your-username/stock-ayuu.git
cd stock-ayuu
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库等信息：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=stock_user
DB_PASSWORD=your_secure_password
DB_DATABASE=stock_ayuu
SECRET_KEY=your_random_secret_key
```

### 3. 启动服务

```bash
docker-compose -f deploy/docker-compose.yml up -d
```

### 4. 配置 Nginx

将 `deploy/nginx.conf` 复制到 Nginx 配置目录：

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/stock-ayuu
sudo ln -s /etc/nginx/sites-available/stock-ayuu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 配置 HTTPS

```bash
sudo certbot --nginx -d ayuu.fun
```

### 6. 验证部署

```bash
# 检查服务状态
docker-compose -f deploy/docker-compose.yml ps

# 检查后端健康
curl http://localhost:9988/api/health

# 检查前端
curl -I https://ayuu.fun
```

## 常见问题

### 数据库连接失败

检查 `.env` 中的数据库配置是否正确，确保 MySQL 服务正在运行。

### 端口冲突

如果 9988 端口被占用，修改 `docker-compose.yml` 中的端口映射。

### SSL 证书过期

```bash
sudo certbot renew
sudo systemctl reload nginx
```
