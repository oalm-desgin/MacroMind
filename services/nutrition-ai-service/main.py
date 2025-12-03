"""
FastAPI Nutrition AI Service - Main application.
Handles AI nutrition coaching and recipe macro analysis.
"""
from fastapi import FastAPI, Depends, HTTPException, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import Optional, Dict, Any
import os
import time
from dotenv import load_dotenv
import uuid
from jose import jwt, JWTError
import httpx

# Import local modules
from database import get_db, init_db, check_db_connection
from models import ChatMessage
from schemas import (
    ChatRequest,
    ChatResponse,
    RecipeAnalysisRequest,
    RecipeAnalysisResponse,
    ChatHistoryResponse,
    ChatHistoryItem,
    MessageResponse,
    ErrorResponse,
    IngredientMacros
)
from ai_coach import chat_with_nutrition_coach, validate_ai_response_length
from macro_analyzer import analyze_recipe_macros

load_dotenv()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI app
app = FastAPI(
    title="MacroMind Nutrition AI Service",
    description="AI nutrition coaching and recipe analysis microservice for MacroMind platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174").split(",")
# Clean up origins (remove whitespace)
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Auth service URL for fetching user profile
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")


async def get_user_profile_from_auth_service(user_id: str, access_token: str) -> Optional[Dict[str, Any]]:
    """
    Fetch user profile from auth-service.
    
    Args:
        user_id: User ID
        access_token: JWT access token for authentication
    
    Returns:
        User profile dict or None if fetch fails
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("profile")
    except Exception as e:
        print(f"Failed to fetch user profile: {e}")
    return None


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    print("Starting Nutrition AI Service...")
    print("Checking database connection...")
    
    # Try to connect with retries
    max_attempts = 10
    attempt = 0
    db_connected = False
    
    while attempt < max_attempts and not db_connected:
        attempt += 1
        print(f"Database connection attempt {attempt}/{max_attempts}...")
        
        if check_db_connection(max_retries=3, retry_delay=1):
            db_connected = True
            print("Database connection successful")
            try:
                init_db()
                print("Database tables initialized/verified")
            except Exception as e:
                print(f"Warning: Database initialization had issues: {e}")
                print(f"Full error: {type(e).__name__}: {str(e)}")
                # Continue anyway - tables might already exist
        else:
            if attempt < max_attempts:
                print(f"Waiting 2 seconds before retry...")
                time.sleep(2)
            else:
                print("ERROR: Could not connect to database after all attempts")
                print("Service will start but database operations will fail")
    
    # Check OpenAI configuration
    if os.getenv("OPENAI_API_KEY"):
        print("OpenAI API key configured")
    else:
        print("WARNING: OpenAI API key not configured - will use fallback responses")


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for load balancers and monitoring.
    Returns 200 OK if service is running, with accurate database status.
    """
    try:
        # Quick database connectivity check (non-blocking)
        db_status = check_db_connection(max_retries=1, retry_delay=1)
        openai_configured = os.getenv("OPENAI_API_KEY") is not None
        
        return {
            "status": "ok",
            "service": "nutrition-ai-service",
            "database": "connected" if db_status else "disconnected",
            "openai": "configured" if openai_configured else "not_configured"
        }
    except Exception as e:
        # Even if database check fails, return 200 OK
        # This allows the service to be marked healthy while database issues are resolved
        return {
            "status": "ok",
            "service": "nutrition-ai-service",
            "database": "disconnected",
            "openai": "configured" if os.getenv("OPENAI_API_KEY") else "not_configured",
            "error": str(e)
        }


# Helper function to extract user ID from JWT token
def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract user ID from JWT token in Authorization header.
    
    Args:
        authorization: Authorization header with Bearer token
    
    Returns:
        User ID from token
    
    Raises:
        HTTPException: If token is missing or invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
        
        # Decode JWT token
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user identifier"
            )
        
        return user_id
    
    except (ValueError, JWTError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


# AI Coach endpoints
@app.post(
    "/api/ai/chat",
    response_model=ChatResponse,
    tags=["AI Coach"],
    responses={
        200: {"description": "Chat response generated successfully"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
        503: {"model": ErrorResponse, "description": "AI service unavailable (fallback used)"}
    }
)
@limiter.limit("10/minute")
async def chat_with_ai_coach(
    request: Request,
    chat_request: ChatRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """
    Send a message to the AI nutrition coach and get a response.
    
    - Professional nutrition coaching with evidence-based advice
    - Responses limited to ~150 words for conciseness
    - Rate limited to 10 requests per minute per user
    - Falls back to predefined responses if AI unavailable
    - All conversations logged to database
    
    Topics covered:
    - Macronutrient guidance (protein, carbs, fats)
    - Meal planning strategies
    - Nutrition for fitness goals
    - Common nutrition questions
    - Healthy eating habits
    """
    try:
        # Log incoming request with debugging
        print(f"Received message: {chat_request.message}")
        print(f"AI Coach request from user {user_id}: {chat_request.message[:100]}")
        
        # Fetch user profile from auth-service for personalized context
        authorization = request.headers.get("Authorization", "")
        user_profile = None
        if authorization:
            try:
                user_profile = await get_user_profile_from_auth_service(user_id, authorization.replace("Bearer ", ""))
                if user_profile:
                    print(f"User profile loaded: goal_weight={user_profile.get('goal_weight')}, activity_level={user_profile.get('activity_level')}")
            except Exception as e:
                print(f"Could not fetch user profile (continuing without it): {e}")
        
        # Get AI response with user profile context
        # Note: chat_with_nutrition_coach is synchronous, so we run it in executor if needed
        import asyncio
        loop = asyncio.get_event_loop()
        ai_response = await loop.run_in_executor(
            None,
            chat_with_nutrition_coach,
            chat_request.message,
            user_profile
        )
        
        # Validate response length
        ai_response = validate_ai_response_length(ai_response, max_words=150)
        
        # Save to database
        chat_message = ChatMessage(
            id=uuid.uuid4(),
            user_id=uuid.UUID(user_id),
            message=chat_request.message,
            response=ai_response
        )
        
        db.add(chat_message)
        db.commit()
        db.refresh(chat_message)
        
        print(f"Chat message saved: {chat_message.id}")
        
        return ChatResponse(
            message_id=str(chat_message.id),
            user_message=chat_message.message,
            ai_response=chat_message.response,
            timestamp=chat_message.timestamp
        )
    
    except RuntimeError as e:
        # Handle OpenAI API key errors specifically
        db.rollback()
        error_message = str(e)
        print(f"RuntimeError in chat endpoint: {error_message}")
        
        if "API key" in error_message or "OPENAI_API_KEY" in error_message:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI API key is not configured or invalid. Please check your OPENAI_API_KEY environment variable."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI service unavailable: {error_message}"
            )
    except Exception as e:
        db.rollback()
        error_type = type(e).__name__
        error_message = str(e)
        print(f"Error in chat endpoint ({error_type}): {error_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {error_message}"
        )


@app.get(
    "/api/ai/history/{user_id}",
    response_model=ChatHistoryResponse,
    tags=["AI Coach"],
    responses={
        200: {"description": "Chat history retrieved successfully"},
        401: {"model": ErrorResponse, "description": "Unauthorized"}
    }
)
async def get_chat_history(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    requesting_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """
    Get chat history for a user.
    
    - Returns recent chat conversations
    - Supports pagination with limit and offset
    - Users can only access their own history
    - Ordered by most recent first
    """
    # Verify user can only access their own history
    if user_id != requesting_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other users' chat history"
        )
    
    # Get total count
    total = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).count()
    
    # Get messages with pagination
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(
        ChatMessage.timestamp.desc()
    ).limit(limit).offset(offset).all()
    
    # Convert to response format
    history_items = [
        ChatHistoryItem(
            id=str(msg.id),
            user_message=msg.message,
            ai_response=msg.response,
            timestamp=msg.timestamp
        )
        for msg in messages
    ]
    
    return ChatHistoryResponse(
        total=total,
        messages=history_items
    )


@app.delete(
    "/api/ai/history/{user_id}",
    response_model=MessageResponse,
    tags=["AI Coach"],
    responses={
        200: {"description": "Chat history cleared successfully"},
        401: {"model": ErrorResponse, "description": "Unauthorized"}
    }
)
async def clear_chat_history(
    user_id: str,
    requesting_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """
    Clear all chat history for a user.
    
    - Deletes all chat messages for the user
    - Users can only clear their own history
    """
    # Verify user can only clear their own history
    if user_id != requesting_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot clear other users' chat history"
        )
    
    # Delete all messages
    deleted_count = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).delete()
    
    db.commit()
    
    return MessageResponse(
        message=f"Cleared {deleted_count} chat messages"
    )


# Recipe Analysis endpoints
@app.post(
    "/api/ai/analyze-recipe",
    response_model=RecipeAnalysisResponse,
    tags=["Recipe Analysis"],
    responses={
        200: {"description": "Recipe analyzed successfully"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
        503: {"model": ErrorResponse, "description": "AI service unavailable (fallback used)"}
    }
)
@limiter.limit("10/minute")
async def analyze_recipe(
    request: Request,
    recipe_request: RecipeAnalysisRequest,
    user_id: str = Depends(get_user_id_from_token)
):
    """
    Analyze recipe text and extract macro information.
    
    - Extracts nutritional macros from recipe ingredients
    - Text-based analysis (MVP - image support future)
    - Provides breakdown by ingredient
    - Calculates total calories and macros
    - Rate limited to 10 requests per minute
    - Falls back to estimation if AI unavailable
    
    Input format examples:
    - "Chicken breast 200g, brown rice 100g, broccoli 150g"
    - "2 eggs, 2 slices whole wheat bread, 1 tbsp peanut butter"
    - "6oz salmon, 1 cup quinoa, mixed vegetables"
    """
    try:
        print(f"Recipe analysis request from user {user_id}")
        
        # Analyze recipe with AI
        analysis = analyze_recipe_macros(recipe_request.recipe_text)
        
        # Convert to response format
        ingredients = [
            IngredientMacros(**ing)
            for ing in analysis["ingredients"]
        ]
        
        return RecipeAnalysisResponse(
            recipe_name=analysis["recipe_name"],
            total_calories=analysis["total_calories"],
            macros=analysis["macros"],
            ingredients=ingredients
        )
    
    except Exception as e:
        print(f"Error in recipe analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze recipe: {str(e)}"
        )


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information."""
    return {
        "service": "MacroMind Nutrition AI Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "features": [
            "AI Nutrition Coach",
            "Recipe Macro Analysis",
            "Chat History"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )

