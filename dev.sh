#!/bin/bash

(cd server &&
    pip3 install -r requirements.txt &&
    flask --debug run) &

(cd client &&
    bun install &&
    bun run dev) &

wait
