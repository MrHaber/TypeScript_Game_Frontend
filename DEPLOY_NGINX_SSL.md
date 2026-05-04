# Deploy with host Nginx and HTTPS

Domain:

```text
uch.greathan.ru
```

Server IP:

```text
152.53.251.64
```

Recommended layout:

- host Nginx listens on ports `80` and `443`;
- Docker frontend listens only on `127.0.0.1:8080`;
- frontend calls `/api`;
- frontend container proxies `/api` to backend container.

## 1. DNS

Make sure the domain has an `A` record:

```text
uch.greathan.ru -> 152.53.251.64
```

On your local machine:

```bash
nslookup uch.greathan.ru
```

It should return `152.53.251.64`.

## 2. Server packages

On the VPS:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Open firewall ports if UFW is enabled:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw status
```

## 3. Project env

In the project folder on the server:

```bash
cp .env.example .env
nano .env
```

Use:

```env
FRONTEND_DOMAIN=uch.greathan.ru
FRONTEND_BIND=127.0.0.1
FRONTEND_PORT=8080
VITE_API_URL=/api
CORS_ORIGINS=https://uch.greathan.ru,http://uch.greathan.ru,http://127.0.0.1:5173,http://localhost:5173
```

## 4. Start Docker app

```bash
docker compose up -d --build
```

Check local container frontend:

```bash
curl http://127.0.0.1:8080
curl http://127.0.0.1:8080/api/health
```

The health endpoint should return:

```json
{"status":"ok"}
```

## 5. Install host Nginx config

Copy the prepared config:

```bash
sudo cp deploy/nginx/uch.greathan.ru.conf /etc/nginx/sites-available/uch.greathan.ru.conf
sudo ln -sf /etc/nginx/sites-available/uch.greathan.ru.conf /etc/nginx/sites-enabled/uch.greathan.ru.conf
```

Disable the default site if it exists:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

Check and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Now HTTP should work:

```bash
curl http://uch.greathan.ru/api/health
```

## 6. Get HTTPS certificate

```bash
sudo certbot --nginx -d uch.greathan.ru
```

Choose redirect HTTP to HTTPS when Certbot asks.

Check renewal:

```bash
sudo certbot renew --dry-run
```

## 7. Final checks

Open:

```text
https://uch.greathan.ru
```

Check API:

```bash
curl https://uch.greathan.ru/api/health
```

Expected:

```json
{"status":"ok"}
```

## 8. Update deploy

```bash
git pull
docker compose up -d --build
sudo nginx -t
sudo systemctl reload nginx
```
