"""
Tests for database models.
"""
import pytest
from models import ChatMessage
import uuid


class TestChatMessageModel:
    """Tests for ChatMessage model."""

    def test_create_chat_message(self, db_session):
        """Test creating a chat message."""
        user_id = uuid.uuid4()
        
        message = ChatMessage(
            id=uuid.uuid4(),
            user_id=user_id,
            message="Test user message",
            response="Test AI response"
        )
        
        db_session.add(message)
        db_session.commit()
        
        assert message.id is not None
        assert message.user_id == user_id
        assert message.message == "Test user message"
        assert message.response == "Test AI response"
        assert message.timestamp is not None

    def test_chat_message_repr(self, db_session):
        """Test chat message string representation."""
        user_id = uuid.uuid4()
        message = ChatMessage(
            id=uuid.uuid4(),
            user_id=user_id,
            message="Test message",
            response="Test response"
        )
        
        repr_str = repr(message)
        assert "ChatMessage" in repr_str
        assert str(user_id) in repr_str

    def test_query_messages_by_user(self, db_session):
        """Test querying messages by user ID."""
        user1_id = uuid.uuid4()
        user2_id = uuid.uuid4()
        
        # Create messages for user 1
        for i in range(3):
            msg = ChatMessage(
                id=uuid.uuid4(),
                user_id=user1_id,
                message=f"User 1 message {i}",
                response=f"Response {i}"
            )
            db_session.add(msg)
        
        # Create messages for user 2
        for i in range(2):
            msg = ChatMessage(
                id=uuid.uuid4(),
                user_id=user2_id,
                message=f"User 2 message {i}",
                response=f"Response {i}"
            )
            db_session.add(msg)
        
        db_session.commit()
        
        # Query messages for user 1
        user1_messages = db_session.query(ChatMessage).filter(
            ChatMessage.user_id == user1_id
        ).all()
        
        assert len(user1_messages) == 3
        
        # Query messages for user 2
        user2_messages = db_session.query(ChatMessage).filter(
            ChatMessage.user_id == user2_id
        ).all()
        
        assert len(user2_messages) == 2

    def test_chat_message_ordering(self, db_session):
        """Test ordering chat messages by timestamp."""
        user_id = uuid.uuid4()
        
        # Create multiple messages
        for i in range(5):
            msg = ChatMessage(
                id=uuid.uuid4(),
                user_id=user_id,
                message=f"Message {i}",
                response=f"Response {i}"
            )
            db_session.add(msg)
        
        db_session.commit()
        
        # Query with ordering
        messages = db_session.query(ChatMessage).filter(
            ChatMessage.user_id == user_id
        ).order_by(ChatMessage.timestamp.desc()).all()
        
        assert len(messages) == 5
        # Verify descending order (most recent first)
        for i in range(len(messages) - 1):
            assert messages[i].timestamp >= messages[i + 1].timestamp

