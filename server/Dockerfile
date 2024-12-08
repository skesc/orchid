FROM python:3.11-slim

RUN apt-get update && apt-get install -y wget \
    && wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.deb \
    && dpkg -i litestream-v0.3.13-linux-amd64.deb \
    && rm litestream-v0.3.13-linux-amd64.deb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/cache && chmod 777 /app/cache

EXPOSE 5000
COPY start.sh /start.sh
RUN chmod +x /start.sh

VOLUME ["/app/cache"]
ENTRYPOINT ["/start.sh"]