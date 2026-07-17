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

# Wait briefly for Vite to output its startup logs so our summary stays at the bottom
sleep 2

echo -e ""
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}✨ LoreForge Development Environment is Live!${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "${BLUE}▶ Frontend (UI):${NC}    http://localhost:5173"
echo -e "${BLUE}▶ Backend (API):${NC}    http://localhost:8000/docs"
echo -e "${GREEN}======================================================${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers gracefully.${NC}"
# Wait briefly for Vite to output its startup logs so our summary stays at the bottom
sleep 2

echo -e ""

# Wait for background processes
wait
