module.exports = {
  apps: [
    {
      name: 'xhblogs',
      cwd: __dirname,
      script: '/usr/bin/npm',
      args: 'start -- --hostname 127.0.0.1 --port 3000',
      interpreter: '/usr/bin/node',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: false,
    },
  ],
};
