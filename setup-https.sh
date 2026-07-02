#!/bin/bash

# Ensure the script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (or use sudo)"
  exit 1
fi

DOMAIN="jobdozo.com"
WWW_DOMAIN="www.jobdozo.com"
EMAIL="admin@jobdozo.com"
PORT=8123

echo "========================================"
echo " Starting Nginx & HTTPS Setup"
echo "========================================"

# 1. Update and install Nginx and Certbot
echo "Installing Nginx and Certbot..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# 2. Create Nginx Configuration
echo "Configuring Nginx as a reverse proxy for port $PORT..."
cat > /etc/nginx/sites-available/jobdozo <<EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 3. Enable the site
echo "Enabling site and removing default..."
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/jobdozo /etc/nginx/sites-enabled/jobdozo

# 4. Test Nginx Configuration and Reload
nginx -t
if [ $? -ne 0 ]; then
    echo "Nginx configuration failed. Aborting."
    exit 1
fi
systemctl reload nginx

# 5. Run Certbot for SSL
echo "Requesting SSL certificate from Let's Encrypt..."
certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

echo "========================================"
echo " Setup Complete! Your site is now secure."
echo " Visit: https://www.jobdozo.com"
echo "========================================"
