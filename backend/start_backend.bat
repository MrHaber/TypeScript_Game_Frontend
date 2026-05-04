@echo off
cd /d "%~dp0"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level debug > "..\logs\backend.task.log" 2>&1
