"""
SQLAlchemy database models for meal planner service.
"""
from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Date, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid
import enum


class MealType(str, enum.Enum):
    """Meal type options."""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"


class DayOfWeek(str, enum.Enum):
    """Days of the week."""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class MealPlan(Base):
    """
    Meal plan model representing a weekly meal plan for a user.
    Container for a week's worth of meals.
    """
    __tablename__ = "meal_plans"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )
    week_start = Column(Date, nullable=False, index=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship to meals
    meals = relationship("Meal", back_populates="meal_plan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<MealPlan(id={self.id}, user_id={self.user_id}, week_start={self.week_start})>"


class Meal(Base):
    """
    Meal model representing individual meals.
    Contains meal details, macros, and ingredients.
    """
    __tablename__ = "meals"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    meal_plan_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meal_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )
    day = Column(
        SQLEnum(DayOfWeek, name="day_of_week_enum"),
        nullable=False,
        index=True
    )
    meal_type = Column(
        SQLEnum(MealType, name="meal_type_enum"),
        nullable=False
    )
    name = Column(String(255), nullable=False)
    calories = Column(Integer, nullable=False)
    protein = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    fats = Column(Float, nullable=False)
    ingredients = Column(JSON, nullable=False)  # Store as JSON array
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship to meal plan
    meal_plan = relationship("MealPlan", back_populates="meals")

    def __repr__(self):
        return f"<Meal(id={self.id}, name={self.name}, day={self.day}, type={self.meal_type})>"

