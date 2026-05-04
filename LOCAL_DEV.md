# Local development

Use this mode to test frontend and backend on your PC.

## Option 1: without Docker

Install Python deps once:

```powershell
cd backend
python -m pip install -r requirements.txt
cd ..
```

Start both servers:

```powershell
npm run dev:full
```

Open:

```text
http://127.0.0.1:5173
```

Health check:

```text
http://127.0.0.1:8000/api/health
```

In local Vite mode the frontend uses:

```env
VITE_API_URL=/api
VITE_DEV_API_PROXY=http://127.0.0.1:8000
```

So browser requests go to `http://127.0.0.1:5173/api/...`, and Vite proxies them to the backend.

## Option 2: with Docker

```powershell
docker compose up -d --build
```

Open:

```text
http://127.0.0.1:18080
```

Health check:

```text
http://127.0.0.1:18080/api/health
```

Stop:

```powershell
docker compose down
```
