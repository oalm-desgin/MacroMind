# Meal Planner Service

FastAPI-based meal planning and generation microservice with OpenAI integration.

## Features

- AI-powered weekly meal plan generation
- Personalized meals based on user goals and preferences
- Individual meal swapping/regeneration
- Macro calculation and tracking
- Support for dietary preferences (halal, vegan, vegetarian)

## Tech Stack

- Python 3.11+
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- OpenAI API

## API Endpoints

- `POST /api/meals/generate-weekly` - Generate 7-day meal plan
- `GET /api/meals/week` - Get current week's meal plan
- `GET /api/meals/today` - Get today's meals
- `PUT /api/meals/{meal_id}/swap` - Regenerate a single meal
- `DELETE /api/meals/plan/{plan_id}` - Delete meal plan

## Setup

```bash
cd services/meal-planner-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## AI Meal Generation

Uses OpenAI GPT-4o-mini with structured prompts:
- Considers user's fitness goal (cut/bulk/maintain)
- Respects dietary preferences
- Generates meals with accurate macro breakdown
- Returns structured JSON with ingredients

## Database Models

- Meal (id, user_id, day, meal_type, name, calories, protein, carbs, fats, ingredients)
- MealPlan (id, user_id, week_start, generated_at)

