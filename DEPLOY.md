# Docker deploy

Recommended production layout:

- frontend: `http://your-domain.com`
- backend API: `http://your-domain.com/api`
- backend container is not published directly; frontend Nginx proxies `/api` to it.

## 1. Configure domains

Copy the example env file:

```bash
cp .env.example .env
```

Example `.env` for `uch.greathan.ru` behind host Nginx:

```env
FRONTEND_DOMAIN=uch.greathan.ru
FRONTEND_BIND=127.0.0.1
FRONTEND_PORT=8080
VITE_API_URL=/api
CORS_ORIGINS=https://uch.greathan.ru,http://uch.greathan.ru
```

For HTTPS setup with host Nginx and Certbot, see `DEPLOY_NGINX_SSL.md`.

## 2. Start

```bash
docker compose up -d --build
```

Open:

```text
http://your-domain.com
```

Health check:

```bash
curl http://your-domain.com/api/health
```

Expected response:

```json
{"status":"ok"}
```

## 3. Update

```bash
git pull
docker compose up -d --build
```

The SQLite database is stored in the Docker volume `uchi_backend_data`.
