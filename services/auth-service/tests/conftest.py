"""
Pytest configuration and fixtures for auth service tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import Base, get_db
from models import User, UserProfile

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
    Creates all tables before test and drops them after.
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
def sample_user_data():
    """Sample user registration data."""
    return {
        "email": "test@example.com",
        "password": "TestPass123!",
        "fitness_goal": "cut",
        "dietary_preference": "none",
        "daily_calories": 2000
    }


@pytest.fixture
def sample_login_data():
    """Sample user login data."""
    return {
        "email": "test@example.com",
        "password": "TestPass123!"
    }


@pytest.fixture
def registered_user(client, sample_user_data):
    """
    Create and return a registered user.
    """
    response = client.post("/api/auth/register", json=sample_user_data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def authenticated_user(client, registered_user, sample_login_data):
    """
    Create a registered user and return authentication tokens.
    """
    response = client.post("/api/auth/login", json=sample_login_data)
    assert response.status_code == 200
    return response.json()


@pytest.fixture
def auth_headers(authenticated_user):
    """
    Return authorization headers with valid access token.
    """
    return {
        "Authorization": f"Bearer {authenticated_user['access_token']}"
    }

