"""
FastAPI Auth Service - Main application.
Handles user authentication, registration, and profile management.
"""
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import time
from dotenv import load_dotenv
from pathlib import Path
import uuid
import json

# Get the directory where THIS file is located
current_dir = Path(__file__).parent
env_path = current_dir / ".env"

# Force load with override=True
load_dotenv(dotenv_path=env_path, override=True)

# Debug: Read the .env file directly and print its contents
if env_path.exists():
    print(f"DEBUG [auth-service]: Reading .env file directly from {env_path}")
    with open(env_path, 'r', encoding='utf-8') as f:
        content = f.read()
        print("DEBUG [auth-service]: .env file contents:")
        # Print first 50 chars of each line (to hide full values)
        for line in content.split('\n'):
            if line.strip() and not line.startswith('#'):
                if '=' in line:
                    key = line.split('=')[0].strip()
                    print(f"  {key}=...")
                else:
                    print(f"  (malformed line: {line[:50]})")

# Import local modules
from database import get_db, init_db, check_db_connection
from models import User, UserProfile
from schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    UserProfileResponse,
    UserProfileUpdateRequest,
    MessageResponse,
    RefreshTokenRequest,
    ErrorResponse,
    OnboardingDataRequest
)
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
    get_current_user_id,
    get_user_from_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Validate required environment variables on startup
# We removed "DATABASE_URL" from this list so it doesn't crash if the .env is missing
required = ["JWT_SECRET_KEY"] 
missing = [v for v in required if not os.getenv(v)]

if missing:
    raise RuntimeError(f"Missing environment variables: {missing}")

# Check for default/placeholder values
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if JWT_SECRET_KEY == "changeme_generate_secure_jwt_secret_key_here":
    raise RuntimeError("JWT_SECRET_KEY is using default placeholder value. Please set a secure key.")

# --- THE FIX IS HERE ---
# We are commenting out the .env loader for now
# DATABASE_URL = os.getenv("DATABASE_URL")

# We are HARDCODING the connection to your local machine.
# Format: postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DB_NAME]
# I used 'postgres' as the user and '123' as the password based on your screenshots.
DATABASE_URL = "postgresql://postgres:123@localhost:5432/macromind" 

print(f"FORCED DATABASE URL: {DATABASE_URL}") 
# -----------------------

# Log JWT key length (NOT the value) for verification
print(f"JWT key loaded, length: {len(JWT_SECRET_KEY)}")

# Log DATABASE_URL without secrets (for debugging)
# Mask password in connection string
if "@" in DATABASE_URL:
    parts = DATABASE_URL.split("@")
    if len(parts) == 2:
        user_pass = parts[0].split("://")[-1]
        if ":" in user_pass:
            user = user_pass.split(":")[0]
            masked_url = DATABASE_URL.replace(user_pass, f"{user}:***")
            print(f"Database URL: {masked_url}")
        else:
            print(f"Database URL: {DATABASE_URL.split('@')[0]}@***")
    else:
        print(f"Database URL: {DATABASE_URL.split('@')[0]}@***")
else:
    print(f"Database URL: {DATABASE_URL}")

# Initialize FastAPI app
app = FastAPI(
    title="MacroMind Auth Service",
    description="Authentication and user management microservice for MacroMind platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - Required for frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://localhost:3000"
    ],
    allow_credentials=True,  # REQUIRED for JWT authentication with CORS
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized error response handler
def create_error_response(
    error_code: str,
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    details: Optional[dict] = None
) -> JSONResponse:
    """Create standardized error response."""
    error_data = {
        "success": False,
        "error": message,
        "code": error_code
    }
    if details:
        error_data["details"] = details
    return JSONResponse(
        status_code=status_code,
        content=error_data
    )


# Exception handler for HTTPException to standardize error format
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Convert HTTPException to standardized error format."""
    error_code_map = {
        400: "VALIDATION_ERROR",
        401: "UNAUTHORIZED",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_ERROR"
    }
    
    code = error_code_map.get(exc.status_code, "UNKNOWN_ERROR")
    
    # Try to extract error code from detail if it's a dict
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        code = exc.detail["code"]
        message = exc.detail.get("message", str(exc.detail))
    else:
        message = str(exc.detail)
    
    return create_error_response(
        error_code=code,
        message=message,
        status_code=exc.status_code
    )


# Dependency to check if user has completed onboarding
async def require_onboarding_complete(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Dependency to enforce onboarding completion for protected routes.
    
    Raises:
        HTTPException: If user has not completed onboarding
    """
    user = get_user_from_token(db, user_id)
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    if not profile or not profile.has_completed_onboarding:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "ONBOARDING_INCOMPLETE",
                "message": "Please complete onboarding before accessing this feature"
            }
        )
    
    return user_id


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    print("Starting Auth Service...")
    print("Checking database connection...")
    
    # Always try to initialize database tables
    # This ensures tables exist even if connection check fails initially
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
            print(f"Database connection attempt {attempt} failed")
            if attempt < max_attempts:
                print(f"Waiting 2 seconds before retry...")
                time.sleep(2)
            else:
                print("ERROR: Could not connect to database after all attempts")
                print("Service will start but database operations will fail")


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for load balancers and monitoring.
    Returns 200 OK if service is running, regardless of database status.
    """
    try:
        # Quick database connectivity check (non-blocking)
        db_status = check_db_connection(max_retries=1, retry_delay=1)
        return {
            "status": "ok",
            "service": "auth-service",
            "database": "connected" if db_status else "disconnected"
        }
    except Exception as e:
        # Even if database check fails, return 200 OK
        # This allows the service to be marked healthy while database issues are resolved
        return {
            "status": "ok",
            "service": "auth-service",
            "database": "disconnected"
        }


# Auth endpoints
@app.post(
    "/api/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
    responses={
        201: {"description": "User registered successfully, tokens returned"},
        400: {"model": ErrorResponse, "description": "Validation error"},
        409: {"model": ErrorResponse, "description": "Email already registered"},
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
async def register_user(
    request: Request,
    user_data: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user with email and password.
    
    - Creates user account with hashed password
    - Creates user profile with default values (fitness data collected during onboarding)
    - Returns JWT access token and refresh token for automatic login
    - Only email and password are required; full_name is optional
    """
    import traceback
    from sqlalchemy.exc import IntegrityError
    
    # Log raw request body for debugging
    try:
        body = await request.body()
        raw_body = body.decode('utf-8') if body else "{}"
        print(f"[REGISTER] Raw request body: {raw_body}")
    except Exception as e:
        print(f"[REGISTER] Could not read raw body: {e}")
    
    # Log incoming request
    print(f"[REGISTER] Incoming registration request for email: {user_data.email}")
    print(f"[REGISTER] Parsed Pydantic data: email={user_data.email}, full_name={user_data.full_name}")
    
    try:
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            print(f"[REGISTER] Registration failed: Email {user_data.email} already exists")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "EMAIL_ALREADY_EXISTS",
                    "message": "Email already registered"
                }
            )
        
        # Hash password before insert
        print(f"[REGISTER] Hashing password for user: {user_data.email}")
        password_hash = hash_password(user_data.password)
        print(f"[REGISTER] Password hashed successfully")
        
        # Create new user
        new_user = User(
            id=uuid.uuid4(),
            email=user_data.email,
            password_hash=password_hash
        )
        
        print(f"[REGISTER] Creating user record with ID: {new_user.id}")
        db.add(new_user)
        db.flush()  # Flush to get the user ID
        print(f"[REGISTER] User record flushed, ID: {new_user.id}")
        
        # Create user profile with default values
        # CRITICAL: Explicitly set fitness_goal and dietary_preference to prevent NOT NULL constraint errors
        # Fitness data will be collected during onboarding, but we need defaults for database constraints
        from models import FitnessGoal, DietaryPreference
        
        # Explicitly set default enum values to satisfy NOT NULL database constraints
        fitness_goal_enum = FitnessGoal.MAINTAIN  # Explicit default to prevent NOT NULL error
        dietary_preference_enum = DietaryPreference.NONE  # Explicit default to prevent NOT NULL error
        
        print(f"[REGISTER] Creating user profile with explicit defaults: fitness_goal={fitness_goal_enum.value}, dietary_preference={dietary_preference_enum.value}")
        
        # Create profile with explicit defaults - these fields are NOT NULL in the database
        new_profile = UserProfile(
            id=uuid.uuid4(),
            user_id=new_user.id,
            fitness_goal=fitness_goal_enum,  # Explicitly set to MAINTAIN (required, NOT NULL)
            dietary_preference=dietary_preference_enum,  # Explicitly set to NONE (required, NOT NULL)
            daily_calories=None,  # Optional field, will be set during onboarding
            has_completed_onboarding=False  # Explicitly set to False (required, NOT NULL)
        )
        
        print(f"[REGISTER] User profile created with default values")
        db.add(new_profile)
        
        # Commit transaction
        print(f"[REGISTER] Committing database transaction...")
        db.commit()
        print(f"[REGISTER] Database transaction committed successfully")
        
        db.refresh(new_user)
        print(f"[REGISTER] User refreshed from database")
        
        # Create tokens for automatic login
        token_data = {
            "sub": str(new_user.id),
            "email": new_user.email
        }
        
        print(f"[REGISTER] Generating JWT tokens for user: {new_user.email}")
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        print(f"[REGISTER] Tokens generated successfully")
        
        print(f"[REGISTER] Registration successful for user: {user_data.email}")
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (already properly formatted)
        db.rollback()
        print(f"[REGISTER] HTTPException raised, transaction rolled back")
        raise
    except IntegrityError as e:
        # Handle database constraint violations (e.g., unique email)
        db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        print(f"[REGISTER] Database integrity error: {error_msg}")
        print(f"[REGISTER] Full exception stack trace:")
        traceback.print_exc()
        
        # Check if it's a duplicate email error
        if "email" in error_msg.lower() or "unique" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "EMAIL_ALREADY_EXISTS",
                    "message": "Email already registered"
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DATABASE_ERROR",
                    "message": f"Database error: {error_msg}"
                }
            )
    except Exception as e:
        # Handle any other unexpected errors
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        print(f"[REGISTER] Unexpected error during registration: {error_type}: {error_msg}")
        print(f"[REGISTER] Full exception stack trace:")
        traceback.print_exc()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "REGISTRATION_FAILED",
                "message": f"Registration failed: {error_msg}"
            }
        )


@app.post(
    "/api/auth/login",
    response_model=TokenResponse,
    tags=["Authentication"],
    responses={
        200: {"description": "Login successful, tokens returned"},
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
async def login_user(
    login_data: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    
    - Validates credentials
    - Returns JWT access token and refresh token
    - Access token expires in 30 minutes
    - Refresh token expires in 7 days
    """
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create tokens
    token_data = {
        "sub": str(user.id),
        "email": user.email
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    )


@app.post(
    "/api/auth/refresh",
    response_model=TokenResponse,
    tags=["Authentication"],
    responses={
        200: {"description": "Token refreshed successfully"},
        401: {"model": ErrorResponse, "description": "Invalid or expired refresh token"}
    }
)
async def refresh_access_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    - Validates refresh token
    - Issues new access token and refresh token
    """
    # Decode and validate refresh token
    payload = decode_token(token_data.refresh_token)
    verify_token_type(payload, "refresh")
    
    user_id = payload.get("sub")
    email = payload.get("email")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Verify user still exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create new tokens
    new_token_data = {
        "sub": str(user.id),
        "email": user.email
    }
    
    access_token = create_access_token(new_token_data)
    refresh_token = create_refresh_token(new_token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@app.get(
    "/api/auth/me",
    response_model=UserResponse,
    tags=["User Profile"],
    responses={
        200: {"description": "User profile retrieved successfully"},
        401: {"model": ErrorResponse, "description": "Unauthorized - invalid token"}
    }
)
async def get_current_user_profile(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get current user profile.
    
    - Requires valid JWT access token
    - Returns user information and profile data
    """
    user = get_user_from_token(db, user_id)
    
    # Load profile if exists
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    profile_data = None
    if profile:
        profile_data = UserProfileResponse(
            fitness_goal=profile.fitness_goal.value,
            daily_calories=profile.daily_calories,
            dietary_preference=profile.dietary_preference.value,
            has_completed_onboarding=bool(profile.has_completed_onboarding),  # Ensure always boolean
            current_weight=profile.current_weight,
            goal_weight=profile.goal_weight,
            height=profile.height,
            age_range=profile.age_range,
            main_goal=profile.main_goal,
            seriousness_score=profile.seriousness_score,
            disliked_foods=profile.disliked_foods,
            meals_per_day=profile.meals_per_day,
            snacking_frequency=profile.snacking_frequency,
            activity_level=profile.activity_level,
            preferred_workout_location=profile.preferred_workout_location,
            enjoyed_movement_types=profile.enjoyed_movement_types,
            current_mental_state=profile.current_mental_state,
            biggest_struggle=profile.biggest_struggle,
            sleep_quality=profile.sleep_quality,
            motivation_text=profile.motivation_text,
            fear_text=profile.fear_text,
            plan_strictness=profile.plan_strictness,
            reminder_frequency=profile.reminder_frequency,
            motivation_tone=profile.motivation_tone,
            commitment_ready=profile.commitment_ready,
            commitment_score=profile.commitment_score
        )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        profile=profile_data,
        created_at=user.created_at
    )


@app.put(
    "/api/auth/profile",
    response_model=MessageResponse,
    tags=["User Profile"],
    responses={
        200: {"description": "Profile updated successfully"},
        401: {"model": ErrorResponse, "description": "Unauthorized - invalid token"},
        404: {"model": ErrorResponse, "description": "Profile not found"}
    }
)
async def update_user_profile(
    profile_data: UserProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update user profile and fitness goals.
    
    - Requires valid JWT access token
    - Updates fitness goal, dietary preference, and/or daily calories
    - Only provided fields are updated (partial update)
    """
    user = get_user_from_token(db, user_id)
    
    # Get or create profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Update only provided fields
    update_data = profile_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if value is not None:
            # Convert enum values to their string values
            if hasattr(value, 'value'):
                value = value.value
            setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    
    return MessageResponse(message="Profile updated successfully")


@app.post(
    "/api/auth/onboarding",
    response_model=UserResponse,
    tags=["User Profile"],
    responses={
        200: {"description": "Onboarding data saved successfully"},
        401: {"model": ErrorResponse, "description": "Unauthorized - invalid token"},
        404: {"model": ErrorResponse, "description": "Profile not found"}
    }
)
async def save_onboarding_data(
    onboarding_data: OnboardingDataRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Save onboarding data and mark onboarding as complete.
    
    - Requires valid JWT access token
    - Updates user profile with onboarding answers
    - Sets has_completed_onboarding to True
    - Returns updated user profile
    """
    user = get_user_from_token(db, user_id)
    
    # Get or create profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "PROFILE_NOT_FOUND",
                "message": "Profile not found"
            }
        )
    
    # Update onboarding fields
    update_data = onboarding_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if value is not None:
            setattr(profile, field, value)
    
    # Mark onboarding as complete
    profile.has_completed_onboarding = True
    
    db.commit()
    db.refresh(profile)
    
    # Return updated user profile
    profile_data = UserProfileResponse(
        fitness_goal=profile.fitness_goal.value,
        daily_calories=profile.daily_calories,
        dietary_preference=profile.dietary_preference.value,
        has_completed_onboarding=bool(profile.has_completed_onboarding),
        current_weight=profile.current_weight,
        goal_weight=profile.goal_weight,
        height=profile.height,
        age_range=profile.age_range,
        main_goal=profile.main_goal,
        seriousness_score=profile.seriousness_score,
        disliked_foods=profile.disliked_foods,
        meals_per_day=profile.meals_per_day,
        snacking_frequency=profile.snacking_frequency,
        activity_level=profile.activity_level,
        preferred_workout_location=profile.preferred_workout_location,
        enjoyed_movement_types=profile.enjoyed_movement_types,
        current_mental_state=profile.current_mental_state,
        biggest_struggle=profile.biggest_struggle,
        sleep_quality=profile.sleep_quality,
        motivation_text=profile.motivation_text,
        fear_text=profile.fear_text,
        plan_strictness=profile.plan_strictness,
        reminder_frequency=profile.reminder_frequency,
        motivation_tone=profile.motivation_tone,
        commitment_ready=profile.commitment_ready,
        commitment_score=profile.commitment_score
    )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        profile=profile_data,
        created_at=user.created_at
    )


@app.post(
    "/api/auth/logout",
    response_model=MessageResponse,
    tags=["Authentication"],
    responses={
        200: {"description": "Logout successful"},
        401: {"model": ErrorResponse, "description": "Unauthorized - invalid token"}
    }
)
async def logout_user(
    user_id: str = Depends(get_current_user_id)
):
    """
    Logout user (placeholder for token invalidation).
    
    - In stateless JWT setup, logout is handled client-side by removing tokens
    - This endpoint confirms the token is valid
    - Future: Can implement token blacklisting with Redis
    """
    return MessageResponse(message="Logout successful")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information."""
    return {
        "service": "MacroMind Auth Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )