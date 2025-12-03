"""
FastAPI Meal Planner Service - Main application.
Handles AI-powered meal plan generation and management.
"""
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import os
from dotenv import load_dotenv
import uuid
from datetime import date, timedelta
from jose import jwt, JWTError

from database import get_db, init_db, check_db_connection
from models import Meal, MealPlan, MealType, DayOfWeek
from schemas import (
    GenerateWeeklyMealPlanRequest,
    MealPlanResponse,
    MealResponse,
    DailyMealsResponse,
    ErrorResponse,
    UserProfileData,
    FitnessGoalEnum,
    DietaryPreferenceEnum
)
from meal_generator import (
    generate_weekly_meals,
    generate_meal_with_ai,
    get_meal_calorie_target,
    get_default_calories_for_goal
)

load_dotenv()

app = FastAPI(title="MacroMind Meal Planner Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:5174"
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# -------------------- STARTUP --------------------

@app.on_event("startup")
async def startup_event():
    print("Starting Meal Planner Service...")
    if check_db_connection():
        init_db()
        print("✓ Database ready")
    else:
        print("✗ Database connection failed")

# -------------------- HEALTH --------------------

@app.get("/health")
async def health():
    db_ok = check_db_connection()
    return {
        "status": "healthy" if db_ok else "unhealthy",
        "service": "meal-planner-service",
        "database": "connected" if db_ok else "disconnected"
    }

# -------------------- AUTH --------------------

def get_user_id_from_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        scheme, token = authorization.split()
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except (ValueError, JWTError):
        raise HTTPException(status_code=401, detail="Invalid token")

# -------------------- UTILS --------------------

def get_monday(input_date: Optional[date] = None):
    if input_date is None:
        input_date = date.today()
    return input_date - timedelta(days=input_date.weekday())

def day_name(input_date: date):
    return input_date.strftime("%A").lower()

async def get_user_profile(user_id: str):
    return UserProfileData(
        fitness_goal=FitnessGoalEnum.MAINTAIN,
        daily_calories=2200,
        dietary_preference=DietaryPreferenceEnum.NONE
    )

# -------------------- FRONTEND COMPATIBLE ROUTES --------------------

@app.post("/api/meal-planner/generate", response_model=MealPlanResponse)
async def frontend_generate_weekly(
    request: GenerateWeeklyMealPlanRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    return await generate_weekly_internal(request, user_id, db)

@app.get("/api/meal-planner/weekly", response_model=MealPlanResponse)
async def frontend_get_weekly(
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    return await get_weekly_internal(None, user_id, db)

@app.get("/api/meal-planner/today", response_model=DailyMealsResponse)
async def frontend_today(
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    return await get_today_internal(user_id, db)

@app.put("/api/meal-planner/{meal_id}/swap", response_model=MealResponse)
async def frontend_swap(
    meal_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    return await swap_internal(meal_id, user_id, db)

# -------------------- INTERNAL LOGIC --------------------

async def generate_weekly_internal(request, user_id, db):
    try:
        week_start = get_monday(request.week_start)
        profile = await get_user_profile(user_id)

        meals_data = generate_weekly_meals(
            profile.fitness_goal.value,
            profile.dietary_preference.value,
            profile.daily_calories
        )

        meal_plan = MealPlan(
            id=uuid.uuid4(),
            user_id=uuid.UUID(user_id),
            week_start=week_start
        )

        db.add(meal_plan)
        db.flush()

        meals = []
        for m in meals_data:
            meal = Meal(
                id=uuid.uuid4(),
                meal_plan_id=meal_plan.id,
                user_id=uuid.UUID(user_id),
                day=DayOfWeek[m["day"].upper()],
                meal_type=MealType[m["meal_type"].upper()],
                name=m["name"],
                calories=m["calories"],
                protein=m["protein"],
                carbs=m["carbs"],
                fats=m["fats"],
                ingredients=m["ingredients"]
            )
            db.add(meal)
            meals.append(MealResponse(**m, id=str(meal.id)))

        db.commit()

        return MealPlanResponse(
            plan_id=str(meal_plan.id),
            week_start=str(week_start),
            meals=meals,
            generated_at=meal_plan.generated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))

async def get_weekly_internal(week_start, user_id, db):
    monday = get_monday(week_start)
    plan = db.query(MealPlan).filter(
        MealPlan.user_id == user_id,
        MealPlan.week_start == monday
    ).first()

    if not plan:
        raise HTTPException(404, "No meal plan")

    meals = db.query(Meal).filter(Meal.meal_plan_id == plan.id).all()
    return MealPlanResponse(
        plan_id=str(plan.id),
        week_start=str(plan.week_start),
        meals=[MealResponse(
            id=str(m.id),
            day=m.day.value,
            meal_type=m.meal_type.value,
            name=m.name,
            calories=m.calories,
            protein=m.protein,
            carbs=m.carbs,
            fats=m.fats,
            ingredients=m.ingredients
        ) for m in meals],
        generated_at=plan.generated_at
    )

async def get_today_internal(user_id, db):
    today = date.today()
    monday = get_monday(today)
    plan = db.query(MealPlan).filter(
        MealPlan.user_id == user_id,
        MealPlan.week_start == monday
    ).first()

    if not plan:
        raise HTTPException(404, "No meal plan")

    meals = db.query(Meal).filter(
        Meal.meal_plan_id == plan.id,
        Meal.day == DayOfWeek[day_name(today).upper()]
    ).all()

    if not meals:
        raise HTTPException(404, "No meals today")

    return DailyMealsResponse(
        date=str(today),
        day=day_name(today),
        meals=[MealResponse(
            id=str(m.id),
            day=m.day.value,
            meal_type=m.meal_type.value,
            name=m.name,
            calories=m.calories,
            protein=m.protein,
            carbs=m.carbs,
            fats=m.fats,
            ingredients=m.ingredients
        ) for m in meals],
        daily_totals={
            "calories": sum(m.calories for m in meals),
            "protein": sum(m.protein for m in meals),
            "carbs": sum(m.carbs for m in meals),
            "fats": sum(m.fats for m in meals)
        }
    )

async def swap_internal(meal_id, user_id, db):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(404, "Meal not found")

    profile = await get_user_profile(user_id)
    target = get_meal_calorie_target(meal.meal_type.value, profile.daily_calories)

    new_meal = generate_meal_with_ai(
        meal.meal_type.value,
        profile.fitness_goal.value,
        profile.dietary_preference.value,
        target
    )

    meal.name = new_meal["name"]
    meal.calories = new_meal["calories"]
    meal.protein = new_meal["protein"]
    meal.carbs = new_meal["carbs"]
    meal.fats = new_meal["fats"]
    meal.ingredients = new_meal["ingredients"]

    db.commit()
    db.refresh(meal)

    return MealResponse(
        id=str(meal.id),
        day=meal.day.value,
        meal_type=meal.meal_type.value,
        name=meal.name,
        calories=meal.calories,
        protein=meal.protein,
        carbs=meal.carbs,
        fats=meal.fats,
        ingredients=meal.ingredients
    )

@app.get("/")
async def root():
    return {
        "service": "MacroMind Meal Planner",
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
