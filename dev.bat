@echo off
wt --title "orchid // server" -d "%~dp0server" cmd /k "pip install -r requirements.txt && flask --debug run" ; ^
split-pane --title "orchid // client" -V -d "%~dp0client" cmd /k "bun install && bun run dev"