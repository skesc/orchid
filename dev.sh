#!/bin/bash

(cd server &&
    pip3 install -r requirements.txt &&
    python3 app.py) &

(cd client &&
    bun install &&
    bun run dev) &

wait
