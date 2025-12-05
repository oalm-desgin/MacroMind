"""
Database configuration and session management for nutrition AI service.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
import os
import time
# Database URL - hardcoded for local development
DATABASE_URL = "postgresql://postgres:123@localhost:5432/macromind"

# Log connection string (mask password for security)
if DATABASE_URL:
    # Mask password in connection string for logging
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
else:
    print("ERROR: DATABASE_URL is not set!")

# Create SQLAlchemy engine with connection retry support
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,        # Connection pool size
    max_overflow=20,     # Allow up to 20 connections above pool_size
    echo=False,          # Set to True for SQL query logging
    connect_args={
        "connect_timeout": 10,  # Connection timeout in seconds
        "options": "-c statement_timeout=30000"  # 30 second statement timeout
    }
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency for getting database session.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.
    Creates all tables defined in models.
    """
    from models import ChatMessage, MealPlan  # Import here to avoid circular imports
    Base.metadata.create_all(bind=engine)


def check_db_connection(max_retries=5, retry_delay=2):
    """
    Check if database connection is working with automatic retries.
    Performs real SELECT 1 query to verify connectivity.
    
    Args:
        max_retries: Maximum number of retry attempts (default: 5)
        retry_delay: Delay between retries in seconds (default: 2)
    
    Returns:
        True if connection is successful, False otherwise.
    """
    import traceback
    for attempt in range(1, max_retries + 1):
        try:
            # Use text() for SQLAlchemy 2.0 compatibility
            from sqlalchemy import text
            print(f"Testing database connection (attempt {attempt}/{max_retries})...")
            db = SessionLocal()
            result = db.execute(text("SELECT 1"))
            db.close()
            if attempt > 1:
                print(f"Database connection successful after {attempt} attempts")
            else:
                print("Database connected successfully")
            return True
        except OperationalError as e:
            if attempt < max_retries:
                print(f"Database connection attempt {attempt}/{max_retries} failed: {e}")
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print(f"Database connection failed after {max_retries} attempts")
                print(f"Full error: {e}")
                print("Full exception stack trace:")
                traceback.print_exc()
                return False
        except Exception as e:
            print(f"Database connection error: {type(e).__name__}: {e}")
            print("Full exception stack trace:")
            traceback.print_exc()
            return False
    return False

