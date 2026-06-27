/**
 * PM2 Ecosystem Configuration
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 *   pm2 delete ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'xhblogs',
      script: 'node_modules/.bin/next',
      args: 'start --hostname 127.0.0.1',
      cwd: '/opt/xhblogs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/home/ubuntu/.pm2/logs/xhblogs-error.log',
      out_file: '/home/ubuntu/.pm2/logs/xhblogs-out.log',
      merge_logs: true,
      // 优雅重启
      kill_timeout: 5000,
      listen_timeout: 10000,
      // 崩溃重启策略
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
