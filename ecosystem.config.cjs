// PM2 Ecosystem Configuration for AV Traders Backend
// Usage: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: 'avtraders-backend',
      script: 'server.js',
      cwd: '/home/app/avtraders/backend',
      instances: 1,  // Use 1 for Socket.io compatibility
      exec_mode: 'fork',  // Use 'fork' for Socket.io, not 'cluster'
      
      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 5100,
        HOST: '127.0.0.1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5100,
        HOST: '127.0.0.1'
      },

      // Logging
      log_file: '/home/app/logs/avtraders-combined.log',
      out_file: '/home/app/logs/avtraders-out.log',
      error_file: '/home/app/logs/avtraders-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto-restart settings
      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'uploads_private', 'logs', '.git'],
      max_memory_restart: '500M',
      
      // Restart policy
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      
      // Health check
      health_check: {
        interval: 30000,
        timeout: 5000,
        path: '/health',
        max_consecutive_failures: 3
      }
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'app',
      host: '10.160.0.5',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/avtraders.git',
      path: '/home/app/avtraders',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install --production && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
      ssh_options: 'StrictHostKeyChecking=no'
    }
  }
};
