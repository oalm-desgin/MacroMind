"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Request Schemas
class ChatRequest(BaseModel):
    """Schema for AI coach chat request."""
    message: str = Field(..., min_length=1, max_length=1000, description="User message")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "What are the best protein sources for muscle building?"
            }
        }


class RecipeAnalysisRequest(BaseModel):
    """Schema for recipe macro analysis request."""
    recipe_text: str = Field(..., min_length=10, max_length=5000, description="Recipe text with ingredients")

    class Config:
        json_schema_extra = {
            "example": {
                "recipe_text": "Chicken breast (200g), brown rice (100g dry), broccoli (150g), olive oil (1 tbsp)"
            }
        }


# Response Schemas
class ChatResponse(BaseModel):
    """Schema for AI coach chat response."""
    message_id: str
    user_message: str
    ai_response: str
    timestamp: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "message_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_message": "What are the best protein sources?",
                "ai_response": "Excellent question! The best protein sources include...",
                "timestamp": "2025-11-26T10:00:00Z"
            }
        }


class IngredientMacros(BaseModel):
    """Schema for individual ingredient macros."""
    name: str
    amount: str
    calories: int
    protein: float
    carbs: float
    fats: float

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Chicken breast",
                "amount": "200g",
                "calories": 330,
                "protein": 62.0,
                "carbs": 0.0,
                "fats": 7.0
            }
        }


class RecipeAnalysisResponse(BaseModel):
    """Schema for recipe analysis response."""
    recipe_name: str
    total_calories: int
    macros: dict
    ingredients: List[IngredientMacros]

    class Config:
        json_schema_extra = {
            "example": {
                "recipe_name": "Chicken and Rice Bowl",
                "total_calories": 680,
                "macros": {
                    "protein": 69.0,
                    "carbs": 77.0,
                    "fats": 8.5
                },
                "ingredients": [
                    {
                        "name": "Chicken breast",
                        "amount": "200g",
                        "calories": 330,
                        "protein": 62.0,
                        "carbs": 0.0,
                        "fats": 7.0
                    }
                ]
            }
        }


class ChatHistoryItem(BaseModel):
    """Schema for individual chat history item."""
    id: str
    user_message: str
    ai_response: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """Schema for chat history response."""
    total: int
    messages: List[ChatHistoryItem]

    class Config:
        json_schema_extra = {
            "example": {
                "total": 25,
                "messages": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "user_message": "What are the best protein sources?",
                        "ai_response": "Excellent question! The best protein sources include...",
                        "timestamp": "2025-11-26T10:00:00Z"
                    }
                ]
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

