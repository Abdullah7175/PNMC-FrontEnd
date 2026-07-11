module.exports = {
  apps: [
    {
      name: 'pnmc-frontend',
      cwd: './',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      time: true,
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
