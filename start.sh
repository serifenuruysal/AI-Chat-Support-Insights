#!/bin/sh

# Kill anything on ports 4000 and 5173
echo "Clearing ports..."
lsof -ti :4000 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null
sleep 1

echo "Starting backend..."
cd "$(dirname "$0")/backend" && npm run dev &
BACKEND_PID=$!

echo "Starting frontend..."
cd "$(dirname "$0")/frontend" && npm run dev &
FRONTEND_PID=$!

# Kill both on Ctrl+C
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; lsof -ti :4000 | xargs kill -9 2>/dev/null; exit" INT TERM

wait
