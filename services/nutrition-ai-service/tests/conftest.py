"""
Pytest configuration and fixtures for nutrition AI service tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from main import app
from database import Base, get_db
from models import ChatMessage

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
    
    # Disable rate limiting for tests
    app.state.limiter.enabled = False
    
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
def sample_chat_message():
    """Sample chat message for testing."""
    return "What are the best protein sources for muscle building?"


@pytest.fixture
def sample_recipe_text():
    """Sample recipe text for testing."""
    return "Chicken breast (200g), brown rice (100g dry), broccoli (150g), olive oil (1 tbsp)"


@pytest.fixture
def sample_ai_response():
    """Sample AI response for testing."""
    return "Excellent question! The best protein sources include lean meats, fish, eggs, and legumes."

