#!/bin/bash

set -euo pipefail

if [ -f .env ]; then
    export "$(cat .env | xargs)"
fi

# set default model if not provided to u2net
MODEL_NAME=${MODEL_NAME:-"u2net"}

python3 -c "
from rembg import new_session, remove
from PIL import Image
import numpy as np
import os

model = os.getenv('MODEL_NAME')
session = new_session(model_name=model)
img = Image.new('RGB', (100, 100), color='red')
remove(np.array(img), session=session)
print(f'rembg preloaded successfully with model: {session.model_name}')
"
