#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Development Environment...${NC}"

# Function to kill all background jobs when the script is terminated (Ctrl+C)
cleanup() {
    echo -e "\n${BLUE}🛑 Shutting down FastAPI and Vite servers...${NC}"
    # Kill all child processes of this script
    pkill -P $$
    wait
    echo -e "${GREEN}✅ Servers shut down successfully.${NC}"
    exit 0
}

# Catch SIGINT (Ctrl+C) and SIGTERM signals
trap cleanup SIGINT SIGTERM

# 1. Start FastAPI Backend
echo -e "${BLUE}📦 Starting FastAPI Backend (Port 8000)...${NC}"
cd backend
uv run fastapi dev main.py --port 8000 &
cd ..

# Wait for backend to be ready to avoid Vite proxy race conditions
echo -e "${YELLOW}⏳ Waiting for backend to initialize...${NC}"
while ! curl -s http://localhost:8000/api/health > /dev/null; do
    sleep 1
done
echo -e "${GREEN}✅ Backend is up and running!${NC}"

# 2. Start Vite Frontend
echo -e "${BLUE}🎨 Starting Vite Frontend...${NC}"
cd frontend
npm run dev &
cd ..

echo -e "${GREEN}✨ Both servers are running. Press Ctrl+C to stop.${NC}"

# Wait for background processes
wait
