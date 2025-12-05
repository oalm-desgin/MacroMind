"""
SQLAlchemy database models for nutrition AI service.
"""
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from database import Base
import uuid


class ChatMessage(Base):
    """
    Chat message model for storing AI coach conversations.
    Stores user messages and AI responses for history tracking.
    """
    __tablename__ = "chat_messages"

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
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, user_id={self.user_id}, timestamp={self.timestamp})>"


class MealPlan(Base):
    """
    Meal plan model for storing user's current weekly meal plan.
    Stores the complete weekly plan as JSON for easy retrieval.
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
    plan_data = Column(
        JSONB,
        nullable=False
    )  # Stores the complete WeeklyPlan JSON structure
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    def __repr__(self):
        return f"<MealPlan(id={self.id}, user_id={self.user_id}, created_at={self.created_at})>"

