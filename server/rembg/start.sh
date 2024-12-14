#!/bin/bash

set -euo pipefail

if [ -f .env ]; then
    export "$(cat .env | xargs)"
else
    echo "Error: .env file not found"
    exit 1
fi

python3 -c "
from rembg import new_session, remove
from PIL import Image
import numpy as np

session = new_session(model_name='${MODEL_NAME}')
img = Image.new('RGB', (100, 100), color='red')
remove(np.array(img), session=session)
print(f'rembg preloaded successfully with model: {session.model_name}')
"

# start flask server
gunicorn --bind 0.0.0.0:5001 --workers 2 --timeout 120 --preload --log-level info --access-logfile - --error-logfile - app:app
