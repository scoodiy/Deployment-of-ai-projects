# ayuu.fun 部署文档

## 项目结构

```
/opt/xhblogs/
├── app/                    # Next.js App Router (页面 + API)
├── components/             # React 组件
├── lib/                    # 工具库 (db, auth, email, rate-limit)
├── data/                   # SQLite 数据库
│   └── ayuu.db
├── public/                 # 静态资源
├── ops/                    # 运维配置 (本目录)
│   ├── nginx/              # Nginx 配置
│   ├── backup.sh           # 数据库备份脚本
│   └── backups/            # 备份文件存储
├── ecosystem.config.js     # PM2 配置
├── middleware.ts            # Next.js 中间件 (JWT验证)
├── siteConfig.ts            # 全站配置
└── DEPLOY.md               # 本文档
```

## 环境要求

- Node.js >= 18
- npm >= 9
- Nginx >= 1.18
- PM2 >= 5

## 环境变量

在 `/opt/xhblogs/.env` 中配置：

```bash
# 必填
JWT_SECRET=你的密钥           # 管理员JWT签名密钥
ADMIN_USERNAME=admin          # 管理员用户名
ADMIN_PASSWORD=你的密码        # 管理员密码
NODE_ENV=production

# 可选 (邮箱验证码功能)
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=你的QQ邮箱@qq.com
SMTP_PASS=你的QQ邮箱授权码
```

## 首次部署

```bash
# 1. 安装依赖
cd /opt/xhblogs
npm install --production

# 2. 配置环境变量
cp .env.example .env
vim .env  # 填入实际值

# 3. 构建
npm run build

# 4. 配置 Nginx
sudo ln -sf /opt/xhblogs/ops/nginx/ayuu.fun.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 5. 启动 PM2
pm2 start ecosystem.config.js
pm2 save

# 6. 设置开机自启
pm2 startup
# 按提示执行输出的命令

# 7. 设置备份定时任务
chmod +x ops/backup.sh
crontab -e
# 添加: 0 3 * * * /opt/xhblogs/ops/backup.sh 7
```

## 日常运维

### 更新部署

```bash
cd /opt/xhblogs
git pull origin main
npm install --production
npm run build
pm2 restart xhblogs
```

### 查看日志

```bash
# 实时日志
pm2 logs xhblogs

# 错误日志
pm2 logs xhblogs --err

# 最近100行
pm2 logs xhblogs --lines 100
```

### PM2 命令

```bash
pm2 list                    # 查看所有进程
pm2 show xhblogs            # 详细信息
pm2 restart xhblogs         # 重启
pm2 stop xhblogs            # 停止
pm2 delete xhblogs          # 删除进程
pm2 monit                   # 实时监控面板
```

### 数据库备份

```bash
# 手动备份
./ops/backup.sh

# 查看备份
ls -lh ops/backups/

# 恢复备份
gunzip ops/backups/ayuu_XXXXXX.db.gz
cp ops/backups/ayuu_XXXXXX.db data/ayuu.db
pm2 restart xhblogs
```

### Nginx 配置

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 查看日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### SSL 证书续期

```bash
# Certbot 自动续期 (通常已配置 cron)
sudo certbot renew --dry-run

# 手动续期
sudo certbot renew
sudo systemctl reload nginx
```

## 故障排查

### 服务无法启动

```bash
# 检查 PM2 状态
pm2 list

# 查看错误日志
pm2 logs xhblogs --err --lines 50

# 检查端口占用
ss -tlnp | grep :3000

# 手动启动测试
cd /opt/xhblogs
npm start
```

### 502 Bad Gateway

```bash
# 1. 检查 Next.js 是否运行
curl http://localhost:3000

# 2. 检查 PM2 进程
pm2 list

# 3. 重启服务
pm2 restart xhblogs

# 4. 检查 Nginx 配置
sudo nginx -t
```

### 数据库锁定

```bash
# 检查是否有进程占用
fuser data/ayuu.db

# 检查 WAL 文件
ls -la data/ayuu.db*

# 如果 WAL 过大，手动 checkpoint
cd /opt/xhblogs && node -e "
const Database = require('better-sqlite3');
const db = new Database('data/ayuu.db');
db.pragma('wal_checkpoint(TRUNCATE)');
console.log('WAL checkpoint done');
"
```

## 监控

### 健康检查

```bash
# 站点状态
curl -sI https://ayuu.fun | head -5

# API 状态
curl -s http://localhost:3000/api/admin/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### 资源监控

```bash
# PM2 监控面板
pm2 monit

# 磁盘使用
df -h /opt/xhblogs
du -sh /opt/xhblogs/data/
du -sh /opt/xhblogs/ops/backups/

# 进程资源
ps aux | grep next
```

## 安全注意事项

- `.env` 文件不要提交到 Git (已在 .gitignore)
- 定期更新 `JWT_SECRET`
- 备份文件包含敏感数据，妥善保管
- 管理员密码使用强密码
- 已配置: IP限流、账号锁定、JWT验证、HttpOnly Cookie
