"""
SQLAlchemy database models for nutrition AI service.
"""
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
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

