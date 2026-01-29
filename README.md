# Multimodality Labeling System

A comprehensive, production-ready labeling system for images, videos, and audio files.

Using Spec: [link](https://docs.google.com/presentation/d/17MY-66WslM2Vqcy8W5Yto14dULNM7I9k3YAoQWpzBeU/edit?usp=sharing)

## Quick Start

See the main documentation in [`labeling-system/README.md`](./labeling-system/README.md).

```bash
cd labeling-system

# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add Supabase credentials
python main.py

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env  # Add API URL
npm start
```

## Project Structure

```
.
└── labeling-system/
    ├── README.md        # Main documentation
    ├── backend/         # FastAPI backend
    │   └── README.md    # Backend documentation
    └── frontend/        # React frontend
        └── README.md    # Frontend documentation
```

## Documentation

- [Main Documentation](./labeling-system/README.md) - Setup, architecture, deployment
- [Backend Documentation](./labeling-system/backend/README.md) - API reference, database schema
- [Frontend Documentation](./labeling-system/frontend/README.md) - Components, state management


