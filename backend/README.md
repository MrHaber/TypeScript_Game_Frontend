# Backend

FastAPI backend для прототипа игры. Данные хранятся в SQLite-файле `uchi_game.sqlite3`.

## Запуск всего проекта одной командой

Из корня проекта:

```bash
npm run dev:full
```

Эта команда поднимает frontend и backend в одном окне терминала.

## Запуск только backend

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

После запуска:

- Healthcheck: `http://127.0.0.1:8000/api/health`
- OpenAPI: `http://127.0.0.1:8000/docs`

Демо-профиль создается автоматически:

- имя ребенка: `Миша`
- PIN родителя: `1234`
