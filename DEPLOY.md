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

Example `.env`:

```env
FRONTEND_DOMAIN=game.example.com
FRONTEND_PORT=80
VITE_API_URL=/api
CORS_ORIGINS=http://game.example.com,https://game.example.com
```

For your current server IP without a domain:

```env
FRONTEND_DOMAIN=_
FRONTEND_PORT=80
VITE_API_URL=/api
CORS_ORIGINS=http://152.53.251.64,http://152.53.251.64:80
```

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
