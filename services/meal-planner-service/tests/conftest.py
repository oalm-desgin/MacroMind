"""
Pytest configuration and fixtures for meal planner service tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import Mock, patch
import uuid

from main import app
from database import Base, get_db
from models import Meal, MealPlan
from schemas import UserProfileData, FitnessGoalEnum, DietaryPreferenceEnum

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database session for each test.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Create a test client with overridden database dependency.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def mock_user_id():
    """Mock user ID for testing."""
    return str(uuid.uuid4())


@pytest.fixture
def auth_headers(mock_user_id):
    """
    Mock authorization headers.
    In tests, we'll patch the get_user_id_from_token function.
    """
    return {
        "Authorization": "Bearer mock_token"
    }


@pytest.fixture
def mock_user_profile():
    """Mock user profile data."""
    return UserProfileData(
        fitness_goal=FitnessGoalEnum.MAINTAIN,
        daily_calories=2200,
        dietary_preference=DietaryPreferenceEnum.NONE
    )


@pytest.fixture
def sample_meal_data():
    """Sample meal data for testing."""
    return {
        "name": "Test Breakfast",
        "calories": 400,
        "protein": 20.0,
        "carbs": 50.0,
        "fats": 15.0,
        "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"]
    }


@pytest.fixture
def sample_weekly_meals():
    """Sample weekly meals data."""
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    meal_types = ["breakfast", "lunch", "dinner"]
    
    meals = []
    for day in days:
        for meal_type in meal_types:
            meals.append({
                "day": day,
                "meal_type": meal_type,
                "name": f"{day.capitalize()} {meal_type.capitalize()}",
                "calories": 400,
                "protein": 25.0,
                "carbs": 45.0,
                "fats": 12.0,
                "ingredients": ["ingredient 1", "ingredient 2"]
            })
    
    return meals

