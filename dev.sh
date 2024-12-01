#!/bin/bash

(cd server &&
    pip3 install -r requirements.txt &&
    flask --debug run --port=5757) &

(cd client &&
    bun install &&
    bun run dev) &

wait
