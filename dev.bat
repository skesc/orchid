@echo off
start cmd /k "cd server && pip install -r requirements.txt && flask --debug run --port=5757"
start cmd /k "cd client && bun install && bun run dev"