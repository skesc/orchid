FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir rembg[cpu]==2.0.60 flask==3.0.2 gunicorn==21.2.0

COPY . .

# preload rembg model
RUN python -c "from rembg import remove; from PIL import Image; import numpy as np; img = Image.new('RGB', (100, 100), color='red'); remove(np.array(img)); print('rembg preloaded successfully')"

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--timeout", "120", "--preload", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-", "app:app"]