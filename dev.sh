#!/bin/bash

# Warna untuk output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Memulai environment Development...${NC}"

# Fungsi untuk mematikan semua background jobs ketika script dihentikan (Ctrl+C)
cleanup() {
    echo -e "\n${BLUE}🛑 Mematikan server FastAPI dan Vite...${NC}"
    # Membunuh semua child process dari script ini
    pkill -P $$
    wait
    echo -e "${GREEN}✅ Server berhasil dimatikan.${NC}"
    exit 0
}

# Tangkap sinyal SIGINT (Ctrl+C) dan SIGTERM
trap cleanup SIGINT SIGTERM

# 1. Jalankan FastAPI Backend
echo -e "${BLUE}📦 Starting FastAPI Backend (Port 8000)...${NC}"
cd backend
# Menggunakan 'uv run' untuk memastikan dependensi terisolasi berjalan dengan baik
uv run fastapi dev main.py --port 8000 &
cd ..

# 2. Jalankan Vite Frontend
echo -e "${BLUE}🎨 Starting Vite Frontend...${NC}"
cd frontend
npm run dev &
cd ..

echo -e "${GREEN}✨ Kedua server sedang berjalan. Tekan Ctrl+C untuk berhenti.${NC}"

# Tunggu proses yang ada di background
wait
