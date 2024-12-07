#!/bin/bash
set -e

if [ -f .env ]; then
    export "$(grep -v '^#' .env | xargs)"
fi

mkdir -p /app/instance

if litestream restore -if-replica-exists -config /app/litestream.yml /app/instance/app.db; then
    echo "Database restored successfully"
else
    echo "No existing database to restore"
fi

litestream replicate -config /app/litestream.yml &

exec gunicorn --bind 0.0.0.0:5000 \
    --workers 4 \
    --timeout 120 \
    --preload \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    app:app
