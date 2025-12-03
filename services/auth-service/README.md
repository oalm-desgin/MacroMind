# Auth Service

FastAPI-based authentication and user management microservice.

## Features

- User registration with email validation
- JWT-based authentication (access + refresh tokens)
- Password hashing with BCrypt
- User profile and fitness goals management
- Role-based access control (RBAC)

## Tech Stack

- Python 3.11+
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- python-jose (JWT)
- passlib (password hashing)

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile and goals
- `POST /api/auth/logout` - Logout (invalidate token)

## Setup

```bash
cd services/auth-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment Variables

See root `.env.example`

## Database Models

- User (id, email, password_hash, created_at, updated_at)
- UserProfile (user_id, fitness_goal, daily_calories, dietary_preference)

