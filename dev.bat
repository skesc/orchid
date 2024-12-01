@echo off
start cmd /k "cd server && pip install -r requirements.txt && flask --debug run"
start cmd /k "cd client && bun install && bun run dev"