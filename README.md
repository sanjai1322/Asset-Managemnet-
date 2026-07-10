# Asset Management System MVP

A full-stack Asset Management System MVP built with **FastAPI** (Python) and **React** (Vite + TypeScript + Tailwind + MUI).  
Database: **PostgreSQL** (migrated from SQLite — managed via Alembic).

## Requirements

- Python 3.9+
- Node.js 18+
- **Docker & Docker Compose** (recommended, for running PostgreSQL)
- _Or_ a local PostgreSQL 14+ instance

---

## Setup & Run Instructions

### Option A — Docker Compose (recommended)

This spins up both PostgreSQL and the FastAPI backend automatically.

```bash
# 1. Clone and enter the project
git clone <repo-url> && cd asset-management-system

# 2. Copy and fill in the env file
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL and any API keys

# 3. Start PostgreSQL + backend
docker-compose up -d

# 4. Run migrations (first time only)
docker-compose exec backend alembic upgrade head

# 5. Seed the database
docker-compose exec backend python seed.py
```

Frontend still runs locally:

```bash
cd frontend
npm install
npm run dev
```

---

### Option B — Local PostgreSQL

#### 1. Backend

```bash
# Create and activate virtual environment
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies (includes psycopg2-binary, alembic)
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL to your local postgres instance:
#   DATABASE_URL=postgresql://your_user:your_password@localhost:5432/assetflow

# Run database migrations
alembic upgrade head

# Seed the database with mock data
python seed.py

# Start the server (http://localhost:8000)
uvicorn main:app --reload
```

#### 2. Frontend

```bash
cd frontend
npm install
# Start the dev server (http://localhost:5173)
npm run dev
```

---

## Database Migrations (Alembic)

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration after changing models.py
alembic revision --autogenerate -m "describe_your_change"

# Roll back the last migration
alembic downgrade -1

# View migration history
alembic history
```

---

## Usage

- Go to `http://localhost:5173`
- Use any email and password to log in (Mock Auth)
- Explore: Dashboard, Inventory, Allocations, Maintenance, AI Predictive Maintenance, Audit pages

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in all values.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `JWT_SECRET` | Secret for JWT signing |
| `EMAIL_MODE` | `live` or `demo` |
| `RESEND_API_KEY` | Resend email API key |
| `GEMINI_API_KEY` | Google Gemini AI key |
| `GROQ_API_KEY` | Groq AI key |
