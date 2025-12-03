"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
import uuid


class MealTypeEnum(str, Enum):
    """Meal type options."""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"


class DayOfWeekEnum(str, Enum):
    """Days of the week."""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class FitnessGoalEnum(str, Enum):
    """Fitness goal options (from user profile)."""
    CUT = "cut"
    BULK = "bulk"
    MAINTAIN = "maintain"


class DietaryPreferenceEnum(str, Enum):
    """Dietary preference options (from user profile)."""
    NONE = "none"
    HALAL = "halal"
    VEGAN = "vegan"
    VEGETARIAN = "vegetarian"


# Request Schemas
class GenerateWeeklyMealPlanRequest(BaseModel):
    """Schema for weekly meal plan generation request."""
    week_start: Optional[date] = Field(default=None, description="Start date of the week (Monday)")

    class Config:
        json_schema_extra = {
            "example": {
                "week_start": "2025-11-26"
            }
        }


class SwapMealRequest(BaseModel):
    """Schema for swapping a single meal."""
    # No body needed, meal_id comes from path
    pass


# Response Schemas
class MealResponse(BaseModel):
    """Schema for individual meal response."""
    id: str
    day: str
    meal_type: str
    name: str
    calories: int
    protein: float
    carbs: float
    fats: float
    ingredients: List[str]

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "day": "monday",
                "meal_type": "breakfast",
                "name": "Oatmeal with Berries and Almonds",
                "calories": 400,
                "protein": 15.5,
                "carbs": 60.0,
                "fats": 12.0,
                "ingredients": [
                    "1 cup rolled oats",
                    "1/2 cup mixed berries",
                    "2 tbsp almonds",
                    "1 cup almond milk"
                ]
            }
        }


class MealPlanResponse(BaseModel):
    """Schema for meal plan response."""
    plan_id: str
    week_start: str
    meals: List[MealResponse]
    generated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "plan_id": "123e4567-e89b-12d3-a456-426614174000",
                "week_start": "2025-11-26",
                "meals": [
                    {
                        "id": "meal-id-1",
                        "day": "monday",
                        "meal_type": "breakfast",
                        "name": "Oatmeal with Berries",
                        "calories": 400,
                        "protein": 15.5,
                        "carbs": 60.0,
                        "fats": 12.0,
                        "ingredients": ["1 cup rolled oats", "1/2 cup mixed berries"]
                    }
                ],
                "generated_at": "2025-11-26T10:00:00Z"
            }
        }


class DailyMealsResponse(BaseModel):
    """Schema for daily meals response."""
    date: str
    day: str
    meals: List[MealResponse]
    daily_totals: dict

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2025-11-26",
                "day": "monday",
                "meals": [],
                "daily_totals": {
                    "calories": 2000,
                    "protein": 150,
                    "carbs": 200,
                    "fats": 70
                }
            }
        }


class MessageResponse(BaseModel):
    """Schema for generic message response."""
    message: str


class ErrorResponse(BaseModel):
    """Schema for error response."""
    error: str
    message: str
    details: Optional[dict] = None


# Internal Schemas for Meal Generation
class UserProfileData(BaseModel):
    """User profile data for meal generation."""
    fitness_goal: FitnessGoalEnum
    daily_calories: Optional[int]
    dietary_preference: DietaryPreferenceEnum


class MealGenerationRequest(BaseModel):
    """Internal schema for meal generation."""
    meal_type: MealTypeEnum
    fitness_goal: FitnessGoalEnum
    dietary_preference: DietaryPreferenceEnum
    target_calories: int


class GeneratedMealData(BaseModel):
    """Schema for AI-generated meal data."""
    name: str
    calories: int
    protein: float
    carbs: float
    fats: float
    ingredients: List[str]

