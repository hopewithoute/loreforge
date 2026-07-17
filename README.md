<div align="center">
  <img src="frontend/public/favicon.svg" alt="LoreForge Logo" width="256" />
</div>

# LoreForge

LoreForge is an game concept image generator built with FastAPI, Vite, React, and Cloudflare Workers AI.

## Quick Start (Under 15 Minutes)

### 1. Prerequisites
Ensure you have the following installed before starting:

- **uv** (Ultra-fast Python package manager):
  - macOS / Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
  - Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`
  - Or see [official docs](https://github.com/astral-sh/uv).
- **Node.js**: v24 LTS and `npm` (Download from [nodejs.org](https://nodejs.org/)).

### 2. Environment Setup & Cloudflare Credentials
LoreForge uses Cloudflare's free Workers AI tier for image generation.
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com) and find your **Account ID** (in the URL or right sidebar of the dashboard).
2. Go to **My Profile > API Tokens** and create a token using the **Workers AI** template.

Create a `.env` file in the `backend` directory based on `.env.example`:

```bash
cd backend
cp .env.example .env
```
Edit `backend/.env` and insert your Cloudflare credentials:
```env
CLOUDFLARE_ACCOUNT_ID="your_account_id_here"
CLOUDFLARE_API_TOKEN="your_api_token_here"
```

### 3. Backend Setup & Database Initialization
LoreForge uses SQLite and Alembic for migrations. From the project root:
```bash
cd backend
uv sync                     # Install backend dependencies
uv run alembic upgrade head # Run database migrations
cd ..
```

### 4. Frontend Setup
Install the necessary React/Vite dependencies:
```bash
cd frontend
npm install                 # Install frontend dependencies
cd ..
```

### 5. Run Development Servers
Use the provided script to start both the FastAPI backend and Vite frontend simultaneously:
```bash
bash dev.sh
```

- **Frontend:** http://localhost:5173
- **Backend API Docs:** http://localhost:8000/docs

---

## Testing & Quality Assurance
LoreForge is strictly tested 
To verify system integrity locally:

**Frontend Tests (Vitest + JSDom):**
```bash
cd frontend
npm run test
```

**Backend Tests (Pytest):**
```bash
cd backend
uv run pytest
```

---

## Production Deployment (Under 5 Minutes)

LoreForge is optimized for a single-node deployment

1. Ensure you have Docker and Docker Compose installed on your server.
2. Clone the repository and navigate to the project root.
3. Ensure your `.env` file is ready inside the `backend` directory:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your Cloudflare API Token
   ```
4. Build and start the container in detached mode:
   ```bash
   docker compose up -d --build
   ```

The application will be available on **port 8000**. The SQLite database and generated images are safely persisted using Docker Named Volumes (`loreforge_data` and `loreforge_media`), so your data survives container restarts and rebuilds.
