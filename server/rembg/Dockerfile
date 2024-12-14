FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir rembg[cpu]==2.0.60 flask==3.0.2 gunicorn==21.2.0

COPY . .

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--timeout", "120", "--preload", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-", "app:app"]