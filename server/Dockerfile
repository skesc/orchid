FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

COPY . .

# this is to preload the rembg library, or server will be slow to start
# TODO: refactor the rembg server to be a separate service
RUN echo "from PIL import Image; \
    import numpy as np; \
    from rembg import remove; \
    img = Image.new('RGB', (100, 100), color='red'); \
    img_array = np.array(img); \
    remove(img_array); \
    print('rembg preloaded successfully')" > preload_rembg.py \
    && python preload_rembg.py \
    && rm preload_rembg.py

RUN mkdir -p uploads/marketplace uploads/marketplace_compressed uploads/nobg

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "--preload", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-", "app:app"]