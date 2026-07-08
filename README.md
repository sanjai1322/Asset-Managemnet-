# Asset Management System MVP

This is a full-stack Asset Management System MVP built with FastAPI (Python) and React (Vite + TypeScript + Tailwind + MUI).

## Requirements
- Python 3.9+
- Node.js 18+

## Setup & Run Instructions

### 1. Backend

Open a terminal and navigate to the `backend` folder:
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt

# Seed the database
python seed.py

# Run the server (starts on http://localhost:8000)
uvicorn main:app --reload
```

### 2. Frontend

Open another terminal and navigate to the `frontend` folder:
```bash
cd frontend
npm install
# Run the development server (starts on http://localhost:5173)
npm run dev
```

### 3. Usage
- Go to `http://localhost:5173`
- Use any email and password to log in (Mock Auth)
- Explore the Dashboard, Inventory, Allocations, Maintenance, and AI Predictive Maintenance pages.
