"""
Tests for AI coach endpoints.
"""
import pytest
from fastapi import status
from unittest.mock import patch, Mock
import uuid


class TestAIChatEndpoint:
    """Tests for AI chat endpoint."""

    @patch('main.get_user_id_from_token')
    @patch('main.chat_with_nutrition_coach')
    def test_chat_success(
        self,
        mock_chat,
        mock_user_id,
        client,
        mock_user_id,
        sample_chat_message,
        sample_ai_response
    ):
        """Test successful chat with AI coach."""
        # Setup mocks
        mock_user_id.return_value = mock_user_id
        mock_chat.return_value = sample_ai_response
        
        response = client.post(
            "/api/ai/chat",
            json={"message": sample_chat_message}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message_id" in data
        assert data["user_message"] == sample_chat_message
        assert data["ai_response"] == sample_ai_response
        assert "timestamp" in data

    @patch('main.get_user_id_from_token')
    def test_chat_unauthorized(self, mock_user_id, client):
        """Test chat without authentication fails."""
        mock_user_id.side_effect = Exception("Unauthorized")
        
        response = client.post(
            "/api/ai/chat",
            json={"message": "Test message"}
        )
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    @patch('main.get_user_id_from_token')
    def test_chat_empty_message(self, mock_user_id, client, mock_user_id):
        """Test chat with empty message fails validation."""
        mock_user_id.return_value = mock_user_id
        
        response = client.post(
            "/api/ai/chat",
            json={"message": ""}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @patch('main.get_user_id_from_token')
    @patch('main.chat_with_nutrition_coach')
    def test_chat_saves_to_database(
        self,
        mock_chat,
        mock_user_id_func,
        client,
        mock_user_id,
        sample_chat_message,
        sample_ai_response,
        db_session
    ):
        """Test that chat messages are saved to database."""
        # Setup mocks
        mock_user_id_func.return_value = mock_user_id
        mock_chat.return_value = sample_ai_response
        
        response = client.post(
            "/api/ai/chat",
            json={"message": sample_chat_message}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify message was saved
        from models import ChatMessage
        messages = db_session.query(ChatMessage).all()
        assert len(messages) == 1
        assert messages[0].message == sample_chat_message


class TestChatHistoryEndpoint:
    """Tests for chat history endpoint."""

    @patch('main.get_user_id_from_token')
    def test_get_history_empty(self, mock_user_id_func, client, mock_user_id):
        """Test getting empty chat history."""
        mock_user_id_func.return_value = mock_user_id
        
        response = client.get(f"/api/ai/history/{mock_user_id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 0
        assert len(data["messages"]) == 0

    @patch('main.get_user_id_from_token')
    @patch('main.chat_with_nutrition_coach')
    def test_get_history_with_messages(
        self,
        mock_chat,
        mock_user_id_func,
        client,
        mock_user_id,
        sample_ai_response
    ):
        """Test getting chat history with messages."""
        # Setup mocks
        mock_user_id_func.return_value = mock_user_id
        mock_chat.return_value = sample_ai_response
        
        # Create some chat messages
        for i in range(3):
            client.post(
                "/api/ai/chat",
                json={"message": f"Test message {i}"}
            )
        
        # Get history
        response = client.get(f"/api/ai/history/{mock_user_id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 3
        assert len(data["messages"]) == 3

    @patch('main.get_user_id_from_token')
    def test_get_history_other_user_forbidden(self, mock_user_id_func, client):
        """Test that users cannot access other users' history."""
        mock_user_id_func.return_value = str(uuid.uuid4())
        other_user_id = str(uuid.uuid4())
        
        response = client.get(f"/api/ai/history/{other_user_id}")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @patch('main.get_user_id_from_token')
    @patch('main.chat_with_nutrition_coach')
    def test_get_history_pagination(
        self,
        mock_chat,
        mock_user_id_func,
        client,
        mock_user_id,
        sample_ai_response
    ):
        """Test chat history pagination."""
        # Setup mocks
        mock_user_id_func.return_value = mock_user_id
        mock_chat.return_value = sample_ai_response
        
        # Create 10 messages
        for i in range(10):
            client.post(
                "/api/ai/chat",
                json={"message": f"Test message {i}"}
            )
        
        # Get first page
        response = client.get(f"/api/ai/history/{mock_user_id}?limit=5&offset=0")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 10
        assert len(data["messages"]) == 5
        
        # Get second page
        response = client.get(f"/api/ai/history/{mock_user_id}?limit=5&offset=5")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["messages"]) == 5


class TestClearHistoryEndpoint:
    """Tests for clear history endpoint."""

    @patch('main.get_user_id_from_token')
    @patch('main.chat_with_nutrition_coach')
    def test_clear_history_success(
        self,
        mock_chat,
        mock_user_id_func,
        client,
        mock_user_id,
        sample_ai_response
    ):
        """Test clearing chat history."""
        # Setup mocks
        mock_user_id_func.return_value = mock_user_id
        mock_chat.return_value = sample_ai_response
        
        # Create messages
        for i in range(3):
            client.post(
                "/api/ai/chat",
                json={"message": f"Test message {i}"}
            )
        
        # Clear history
        response = client.delete(f"/api/ai/history/{mock_user_id}")
        
        assert response.status_code == status.HTTP_200_OK
        assert "Cleared 3" in response.json()["message"]
        
        # Verify history is empty
        history_response = client.get(f"/api/ai/history/{mock_user_id}")
        assert history_response.json()["total"] == 0

    @patch('main.get_user_id_from_token')
    def test_clear_history_other_user_forbidden(self, mock_user_id_func, client):
        """Test that users cannot clear other users' history."""
        mock_user_id_func.return_value = str(uuid.uuid4())
        other_user_id = str(uuid.uuid4())
        
        response = client.delete(f"/api/ai/history/{other_user_id}")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

