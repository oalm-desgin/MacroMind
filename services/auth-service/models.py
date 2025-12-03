"""
SQLAlchemy database models for auth service.
"""
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Enum as SQLEnum, Boolean, Text, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid
import enum


class FitnessGoal(str, enum.Enum):
    """Fitness goal options."""
    CUT = "cut"
    BULK = "bulk"
    MAINTAIN = "maintain"


class DietaryPreference(str, enum.Enum):
    """Dietary preference options."""
    NONE = "none"
    HALAL = "halal"
    VEGAN = "vegan"
    VEGETARIAN = "vegetarian"


class User(Base):
    """
    User model for authentication.
    Stores core authentication credentials.
    """
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship to profile
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


class UserProfile(Base):
    """
    User profile model for fitness goals and preferences.
    One-to-one relationship with User.
    """
    __tablename__ = "user_profiles"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    fitness_goal = Column(
        SQLEnum(FitnessGoal, name="fitness_goal_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=FitnessGoal.MAINTAIN
    )
    daily_calories = Column(Integer, nullable=True)  # Can be calculated based on goal
    dietary_preference = Column(
        SQLEnum(DietaryPreference, name="dietary_preference_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=DietaryPreference.NONE
    )
    # Onboarding fields
    has_completed_onboarding = Column(Boolean, nullable=False, default=False)
    current_weight = Column(Float, nullable=True)
    goal_weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    age_range = Column(String(50), nullable=True)
    main_goal = Column(String(100), nullable=True)
    seriousness_score = Column(Integer, nullable=True)
    disliked_foods = Column(Text, nullable=True)
    meals_per_day = Column(Integer, nullable=True)
    snacking_frequency = Column(String(50), nullable=True)
    activity_level = Column(String(50), nullable=True)
    preferred_workout_location = Column(String(50), nullable=True)
    enjoyed_movement_types = Column(Text, nullable=True)
    current_mental_state = Column(String(50), nullable=True)
    biggest_struggle = Column(String(100), nullable=True)
    sleep_quality = Column(String(50), nullable=True)
    motivation_text = Column(Text, nullable=True)
    fear_text = Column(Text, nullable=True)
    plan_strictness = Column(String(50), nullable=True)
    reminder_frequency = Column(String(50), nullable=True)
    motivation_tone = Column(String(50), nullable=True)
    commitment_ready = Column(String(50), nullable=True)
    commitment_score = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship to user
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<UserProfile(user_id={self.user_id}, goal={self.fitness_goal})>"

