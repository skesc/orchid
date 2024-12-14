@echo off
wt -d "%~dp0server" cmd /k "pip install -r requirements.txt && flask --debug run" ; ^
split-pane -V -d "%~dp0client" cmd /k "bun install && bun run dev"