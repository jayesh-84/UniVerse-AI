# Production Deployment Guide

This document describes how to deploy the **UniVerse AI Student Helpdesk Portal** in a production environment.

## 1. Prerequisites

Ensure the following are installed on your production server:
* Python 3.9+
* SQLite (for simple workloads) or PostgreSQL (recommended for production scale)
* Nginx (Reverse proxy and SSL termination)
* Systemd (Process monitoring and supervisor)

---

## 2. Server Configuration

### 1. Clone & Setup Directory
```bash
git clone <repository_url> /var/www/universe-ai
cd /var/www/universe-ai
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment variables
Copy the `.env.example` file and configure production keys:
```bash
cp .env.example .env
nano .env
```
Ensure `FLASK_ENV=production` and `FLASK_DEBUG=0` are set, and generate secure random secrets for `JWT_SECRET_KEY` and `CSRF_SECRET_KEY`.

---

## 3. Database Migration & Initialization

Run the initialization script to seed initial tables, admin credentials, and default universities:
```bash
python init_db.py
```

---

## 4. Run with Gunicorn

Use **Gunicorn** to run the Flask application with multiple worker processes:
```bash
venv/bin/gunicorn --workers 4 --bind 127.0.0.1:5000 app:app
```

### Systemd Service Configuration
Create a service file at `/etc/systemd/system/universe.service`:
```ini
[Unit]
Description=UniVerse AI Flask Application Daemon
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/universe-ai
EnvironmentFile=/var/www/universe-ai/.env
ExecStart=/var/www/universe-ai/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
systemctl daemon-reload
systemctl start universe
systemctl enable universe
```

---

## 5. Nginx Reverse Proxy & SSL Setup

Configure Nginx to act as a reverse proxy, serving static assets directly (leveraging browser caching) and proxying requests to Gunicorn:

Create an Nginx configuration file:
```nginx
server {
    listen 80;
    server_name portal.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name portal.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/portal.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.yourdomain.com/privkey.pem;

    # Performance: Serve static files directly
    location /static/ {
        alias /var/www/universe-ai/static/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Proxy Flask/Gunicorn
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable Nginx site and restart:
```bash
ln -s /etc/nginx/sites-available/universe /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```
