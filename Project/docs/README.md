# UW Lost-and-Found App

Full-stack web application for managing lost-and-found items at the University of Waterloo.

## Project Structure

```
Project/
├── frontend/          # React frontend application
├── src/               # Flask backend application
├── tests/             # Test suites
├── docs/              # Documentation
└── requirements.txt   # Python dependencies
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- pip

### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the backend
cd src
python app.py
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
# Install Node dependencies
cd frontend
npm install

# Run the frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

### Running Tests

```bash
# Backend tests
pytest tests/test_auth.py -v

# Frontend tests (when implemented)
cd frontend
npm test
```

## API Endpoints

### Authentication

- `POST /auth/login` - Login (student/visitor/staff)
- `POST /auth/register` - Register visitor account
- `POST /auth/logout` - Logout
- `GET /auth/verify-session` - Verify session
- `GET /auth/me` - Get current user

### Health

- `GET /health` - Health check
- `GET /` - API information

## Default Test Account

- **Email:** admin@uwaterloo.ca
- **Password:** admin123
- **Role:** staff

⚠️ **Change this in production!**

## Frontend Routes

- `/` - Home page
- `/lost-items` - Browse lost items
- `/login` - Login page
- `/signup` - Sign up page

## Documentation

- `docs/sprint1_authentication.md` - Authentication implementation
- `docs/sprint1_project_structure.md` - Project structure and navigation

## Development

### Running Both Servers

**Terminal 1 - Backend:**
```bash
cd src
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Build for Production

### Frontend
```bash
cd frontend
npm run build
```

### Backend
Configure production environment variables and deploy Flask app.

## Team

Ruhani, Sheehan, Aidan, Neng, Theni

