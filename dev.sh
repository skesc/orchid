#!/bin/bash

# Start the backend
(cd server &&
    pip3 install -r requirements.txt &&
    python3 app.py) &

# Start the frontend
(cd client &&
    bun install &&
    bun run dev) &

# Wait for both processes
wait
