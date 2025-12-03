# Database Schema

PostgreSQL database schema for MacroMind platform.

## Schema Files

- `schema.sql` - Initial database schema
- `migrations/` - Database migrations (future)

## Tables (MVP)

### users
- id (UUID, primary key)
- email (VARCHAR, unique, not null)
- password_hash (VARCHAR, not null)
- created_at (TIMESTAMP, default now())
- updated_at (TIMESTAMP, default now())

### user_profiles
- id (UUID, primary key)
- user_id (UUID, foreign key -> users.id)
- fitness_goal (VARCHAR) - 'cut', 'bulk', 'maintain'
- daily_calories (INTEGER)
- dietary_preference (VARCHAR) - 'none', 'halal', 'vegan', 'vegetarian'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### meal_plans
- id (UUID, primary key)
- user_id (UUID, foreign key -> users.id)
- week_start (DATE)
- generated_at (TIMESTAMP)

### meals
- id (UUID, primary key)
- meal_plan_id (UUID, foreign key -> meal_plans.id)
- user_id (UUID, foreign key -> users.id)
- day (VARCHAR) - 'monday', 'tuesday', etc.
- meal_type (VARCHAR) - 'breakfast', 'lunch', 'dinner'
- name (VARCHAR)
- calories (INTEGER)
- protein (FLOAT)
- carbs (FLOAT)
- fats (FLOAT)
- ingredients (JSONB)
- created_at (TIMESTAMP)

### chat_messages
- id (UUID, primary key)
- user_id (UUID, foreign key -> users.id)
- message (TEXT)
- response (TEXT)
- timestamp (TIMESTAMP)

## Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE macromind;

# Run schema
\c macromind
\i schema.sql
```

## Indexes

Indexes on:
- users.email (unique)
- meals.user_id, meals.day
- chat_messages.user_id
- user_profiles.user_id

