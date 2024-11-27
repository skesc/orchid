@echo off
start cmd /k "cd server && pip install -r requirements.txt && python app.py"
start cmd /k "cd client && bun install && bun run dev"