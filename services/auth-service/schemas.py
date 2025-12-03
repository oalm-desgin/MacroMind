"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum
import re


class FitnessGoalEnum(str, Enum):
    """Fitness goal options."""
    CUT = "cut"
    BULK = "bulk"
    MAINTAIN = "maintain"


class DietaryPreferenceEnum(str, Enum):
    """Dietary preference options."""
    NONE = "none"
    HALAL = "halal"
    VEGAN = "vegan"
    VEGETARIAN = "vegetarian"


# Request Schemas
class UserRegisterRequest(BaseModel):
    """Schema for user registration request. Only email and password required."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=100, description="User password")
    full_name: Optional[str] = Field(default=None, max_length=255, description="User's full name (optional)")

    @validator('password')
    def validate_password_strength(cls, v):
        """
        Validate password strength:
        - At least 8 characters
        - Contains at least one uppercase letter
        - Contains at least one lowercase letter
        - Contains at least one number
        """
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123!",
                "full_name": "John Doe"
            }
        }


class UserLoginRequest(BaseModel):
    """Schema for user login request."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123!"
            }
        }


class UserProfileUpdateRequest(BaseModel):
    """Schema for updating user profile."""
    fitness_goal: Optional[FitnessGoalEnum] = Field(default=None, description="Fitness goal")
    dietary_preference: Optional[DietaryPreferenceEnum] = Field(default=None, description="Dietary preference")
    daily_calories: Optional[int] = Field(default=None, ge=1000, le=5000, description="Daily calorie target")

    class Config:
        json_schema_extra = {
            "example": {
                "fitness_goal": "bulk",
                "dietary_preference": "vegetarian",
                "daily_calories": 2500
            }
        }


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str = Field(..., description="Refresh token")


# Response Schemas
class UserProfileResponse(BaseModel):
    """Schema for user profile response."""
    fitness_goal: str
    daily_calories: Optional[int]
    dietary_preference: str
    has_completed_onboarding: bool = False  # Always boolean, never None
    current_weight: Optional[float] = None
    goal_weight: Optional[float] = None
    height: Optional[float] = None
    age_range: Optional[str] = None
    main_goal: Optional[str] = None
    seriousness_score: Optional[int] = None
    disliked_foods: Optional[str] = None
    meals_per_day: Optional[int] = None
    snacking_frequency: Optional[str] = None
    activity_level: Optional[str] = None
    preferred_workout_location: Optional[str] = None
    enjoyed_movement_types: Optional[str] = None
    current_mental_state: Optional[str] = None
    biggest_struggle: Optional[str] = None
    sleep_quality: Optional[str] = None
    motivation_text: Optional[str] = None
    fear_text: Optional[str] = None
    plan_strictness: Optional[str] = None
    reminder_frequency: Optional[str] = None
    motivation_tone: Optional[str] = None
    commitment_ready: Optional[str] = None
    commitment_score: Optional[int] = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """Schema for user response."""
    id: str
    email: str
    profile: Optional[UserProfileResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800
            }
        }


class MessageResponse(BaseModel):
    """Schema for generic message response."""
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operation completed successfully"
            }
        }


class UserRegisterResponse(BaseModel):
    """Schema for user registration response."""
    id: str
    email: str
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "message": "User registered successfully"
            }
        }


class OnboardingDataRequest(BaseModel):
    """Schema for onboarding data submission."""
    main_goal: Optional[str] = None
    seriousness_score: Optional[int] = Field(default=None, ge=1, le=10)
    current_weight: Optional[float] = None
    goal_weight: Optional[float] = None
    height: Optional[float] = None
    age_range: Optional[str] = None
    dietary_preference: Optional[str] = None
    disliked_foods: Optional[str] = None
    meals_per_day: Optional[int] = None
    snacking_frequency: Optional[str] = None
    activity_level: Optional[str] = None
    preferred_workout_location: Optional[str] = None
    enjoyed_movement_types: Optional[str] = None
    current_mental_state: Optional[str] = None
    biggest_struggle: Optional[str] = None
    sleep_quality: Optional[str] = None
    motivation_text: Optional[str] = None
    fear_text: Optional[str] = None
    plan_strictness: Optional[str] = None
    reminder_frequency: Optional[str] = None
    motivation_tone: Optional[str] = None
    commitment_ready: Optional[str] = None
    commitment_score: Optional[int] = Field(default=None, ge=1, le=10)

    class Config:
        json_schema_extra = {
            "example": {
                "main_goal": "Lose Weight",
                "seriousness_score": 8,
                "current_weight": 180.0,
                "goal_weight": 160.0,
                "height": 70.0
            }
        }


class ErrorResponse(BaseModel):
    """Schema for error response."""
    error: str
    message: str
    details: Optional[dict] = None

    class Config:
        json_schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid input data",
                "details": {"field": "email", "issue": "Invalid email format"}
            }
        }

