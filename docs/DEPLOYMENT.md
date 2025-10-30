# EmpireQuest Deployment Guide

This guide covers deploying the EmpireQuest backend to staging and production environments.

## 🏗 Prerequisites

### Staging Server Requirements

-   **OS**: Ubuntu 20.04+ or CentOS 8+
-   **RAM**: 4GB minimum, 8GB recommended
-   **Storage**: 50GB minimum
-   **CPU**: 2 cores minimum, 4 cores recommended

### Required Software

-   PHP 8.3+ with extensions: `pgsql`, `pdo_pgsql`, `redis`, `mbstring`, `xml`, `curl`, `zip`, `bcmath`, `opcache`, `intl`
-   PostgreSQL 15+
-   Redis 6+
-   Nginx 1.18+
-   Node.js 18+ (for Reverb WebSocket server)
-   Supervisor (for queue workers)
-   Composer 2.0+
-   Git

## 🚀 Staging Server Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx postgresql postgresql-contrib redis-server \
    php8.3 php8.3-fpm php8.3-pgsql php8.3-redis php8.3-mbstring \
    php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath php8.3-opcache \
    php8.3-intl supervisor git curl unzip

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE empirequest;
CREATE USER empirequest_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE empirequest TO empirequest_user;
\q

# Configure PostgreSQL for remote connections (if needed)
sudo nano /etc/postgresql/15/main/postgresql.conf
# Uncomment and set: listen_addresses = '*'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

### 3. Redis Configuration

```bash
# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: requirepass your_redis_password_here
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

sudo systemctl restart redis-server
```

### 4. Nginx Configuration

```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/empirequest

# Add the following configuration:
server {
    listen 80;
    server_name api.empirequest.com;
    root /var/www/agos/current/public;
    index index.php;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Client settings
    client_max_body_size 100M;

    # PHP handling
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Laravel routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security
    location ~ /\. {
        deny all;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/empirequest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.empirequest.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6. Firewall Configuration

```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 8080  # Reverb WebSocket port
sudo ufw --force enable
```

### 7. Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/agos
sudo chown -R www-data:www-data /var/www/agos
sudo chmod -R 755 /var/www/agos
```

## 🚀 Production Deployment

### 1. Deployer Configuration

The `deploy.php` file is already configured for deployment. Update the server details:

```php
// Update server IP and credentials
host('production')
    ->set('hostname', 'your-production-server-ip')
    ->set('remote_user', 'root')
    ->set('deploy_path', '/var/www/agos')
    ->set('branch', 'main');
```

### 2. Environment Configuration

Create production environment file:

```bash
# On production server
sudo nano /var/www/agos/shared/.env

# Add production configuration:
APP_NAME="EmpireQuest"
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://api.empirequest.com

DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=empirequest
DB_USERNAME=empirequest_user
DB_PASSWORD=secure_password_here

REDIS_HOST=localhost
REDIS_PASSWORD=your_redis_password_here
REDIS_PORT=6379

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=empirequest
REVERB_APP_KEY=empirequest-key
REVERB_APP_SECRET=empirequest-secret
REVERB_HOST=0.0.0.0
REVERB_PORT=8080
REVERB_SCHEME=https

QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
SESSION_DRIVER=redis

# Game configuration
TICK_INTERVAL_MINUTES=5
GAME_SERVER_SALT=your-secure-random-salt
```

### 3. Deploy Application

```bash
# Deploy to production
lando deployer deploy production

# Or manually:
php vendor/bin/dep deploy production
```

### 4. Supervisor Configuration

Create supervisor configuration for queue workers:

```bash
# Create supervisor config
sudo nano /etc/supervisor/conf.d/empirequest.conf

# Add the following:
[program:empirequest-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/agos/current/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/agos/current/storage/logs/worker.log
stopwaitsecs=3600

[program:empirequest-tick-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/agos/current/artisan queue:work redis --queue=tick --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/agos/current/storage/logs/tick-worker.log
stopwaitsecs=3600

[program:empirequest-reverb]
process_name=%(program_name)s
command=php /var/www/agos/current/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/agos/current/storage/logs/reverb.log

# Reload supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

### 5. Cron Jobs

Set up cron jobs for scheduled tasks:

```bash
# Edit crontab
sudo crontab -e

# Add the following:
* * * * * cd /var/www/agos/current && php artisan schedule:run >> /dev/null 2>&1
```

## 🔧 Post-Deployment

### 1. Verify Deployment

```bash
# Check application status
sudo supervisorctl status

# Check logs
tail -f /var/www/agos/current/storage/logs/laravel.log
tail -f /var/www/agos/current/storage/logs/worker.log

# Test API endpoints
curl -X GET https://api.empirequest.com/api/v1/empires
```

### 2. Performance Optimization

```bash
# Optimize Composer autoloader
cd /var/www/agos/current
composer install --optimize-autoloader --no-dev

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize database
php artisan migrate --force
```

### 3. Monitoring Setup

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Set up log rotation
sudo nano /etc/logrotate.d/empirequest

# Add:
/var/www/agos/current/storage/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

## 🔄 Maintenance

### 1. Regular Updates

```bash
# Update application
lando deployer deploy production

# Update dependencies
composer update --no-dev --optimize-autoloader

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### 2. Database Maintenance

```bash
# Backup database
pg_dump -h localhost -U empirequest_user empirequest > backup_$(date +%Y%m%d_%H%M%S).sql

# Optimize database
sudo -u postgres psql -d empirequest -c "VACUUM ANALYZE;"
```

### 3. Log Management

```bash
# Clean old logs
find /var/www/agos/current/storage/logs -name "*.log" -mtime +30 -delete

# Monitor disk usage
df -h
du -sh /var/www/agos/current/storage/logs/*
```

## 🚨 Troubleshooting

### Common Issues

1. **502 Bad Gateway**

    - Check PHP-FPM status: `sudo systemctl status php8.3-fpm`
    - Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

2. **Database Connection Issues**

    - Verify PostgreSQL is running: `sudo systemctl status postgresql`
    - Check connection string in `.env`

3. **Redis Connection Issues**

    - Verify Redis is running: `sudo systemctl status redis-server`
    - Check Redis password in `.env`

4. **Queue Workers Not Processing**

    - Check supervisor status: `sudo supervisorctl status`
    - Restart workers: `sudo supervisorctl restart empirequest-worker:*`

5. **WebSocket Not Working**
    - Check Reverb process: `sudo supervisorctl status empirequest-reverb`
    - Verify port 8080 is open: `sudo ufw status`

### Log Locations

-   Application logs: `/var/www/agos/current/storage/logs/laravel.log`
-   Worker logs: `/var/www/agos/current/storage/logs/worker.log`
-   Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
-   Supervisor logs: `/var/log/supervisor/supervisord.log`

## 📊 Performance Monitoring

### Key Metrics to Monitor

1. **Server Resources**

    - CPU usage
    - Memory usage
    - Disk space
    - Network I/O

2. **Application Metrics**

    - Response times
    - Queue processing times
    - Database query performance
    - WebSocket connections

3. **Game Metrics**
    - Tick processing duration
    - Combat resolution times
    - Resource production rates
    - Player activity levels

### Monitoring Tools

-   **htop**: Real-time system monitoring
-   **iotop**: Disk I/O monitoring
-   **nethogs**: Network usage monitoring
-   **Laravel Telescope**: Application debugging (development only)
-   **Laravel Horizon**: Queue monitoring (optional)

---

For additional support, check the main README.md or create an issue on GitHub.
