# LoreForge

LoreForge is an assessment-ready game concept image generator built with FastAPI, Vite, React, and Cloudflare Workers AI.

## Quick Start (Under 15 Minutes)

### 1. Prerequisites
- [uv](https://github.com/astral-sh/uv) (for fast Python package management)
- Node.js & npm (for the frontend)

### 2. Environment Setup
Create a `.env` file in the `backend` directory based on `.env.example`:

```bash
cd backend
cp .env.example .env
```
Edit `backend/.env` and replace `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` with your real Cloudflare credentials.

### 3. Initialize the Database
LoreForge uses SQLite and Alembic for migrations.
```bash
uv sync
uv run alembic upgrade head
```

### 4. Run Development Servers
Use the provided script to start both the FastAPI backend and Vite frontend simultaneously:
```bash
cd ..
./dev.sh
```

- **Frontend:** http://localhost:5173
- **Backend API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/api/health

## Architecture
- **Backend:** FastAPI, SQLAlchemy (SQLite), Pydantic, Pillow, httpx. Background tasks are used for asynchronous AI generation to prevent blocking the main event loop.
- **Frontend:** React, Vite, TypeScript, Tailwind CSS.

## Limitations & Design Decisions
- **In-Process Jobs:** The backend uses `FastAPI.BackgroundTasks` for asynchronous image generation. This is an intentional MVP design choice to minimize dependencies. However, if the server restarts while an asset is `pending`, the job will be lost. To mitigate this, stale pending assets are automatically reconciled and marked as `failed` upon startup.
- **Anonymous Ownership:** The application relies on an anonymous `user_id` stored in the browser's LocalStorage to scope assets. This is not secure authentication, but it fulfills the assessment's isolation requirement.
- **Media Serving:** Generated images in `/media` are currently publicly accessible to anyone who knows the exact filename.
