/**
 * PM2 Ecosystem Configuration (Local Development)
 *
 * This file configures PM2 process manager to run:
 * 1. The main API server
 * 2. The cron job scheduler
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 start ecosystem.config.cjs --only kitvas-scheduler
 *   pm2 logs kitvas-scheduler
 *   pm2 restart all
 */

module.exports = {
  apps: [
    {
      name: 'kitvas-api',
      script: 'npx',
      args: 'tsx src/index.ts',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'kitvas-scheduler',
      script: 'npm',
      args: 'run scheduler',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
      },
      error_file: './logs/scheduler-error.log',
      out_file: './logs/scheduler-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
