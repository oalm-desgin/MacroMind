"""
Tests for authentication and security functions.
"""
import pytest
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type
)
from fastapi import HTTPException


class TestPasswordHashing:
    """Tests for password hashing functions."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "TestPass123!"
        hashed = hash_password(password)
        
        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")  # BCrypt hash prefix

    def test_verify_password_correct(self):
        """Test verifying correct password."""
        password = "TestPass123!"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test verifying incorrect password."""
        password = "TestPass123!"
        wrong_password = "WrongPass456!"
        hashed = hash_password(password)
        
        assert verify_password(wrong_password, hashed) is False

    def test_different_hashes_for_same_password(self):
        """Test that same password produces different hashes (salt)."""
        password = "TestPass123!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        assert hash1 != hash2
        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestJWTTokens:
    """Tests for JWT token functions."""

    def test_create_access_token(self):
        """Test creating access token."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_refresh_token(self):
        """Test creating refresh token."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_refresh_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_valid_token(self):
        """Test decoding valid token."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)
        
        payload = decode_token(token)
        
        assert payload["sub"] == "user123"
        assert payload["email"] == "test@example.com"
        assert "exp" in payload
        assert "iat" in payload
        assert payload["type"] == "access"

    def test_decode_invalid_token(self):
        """Test decoding invalid token raises exception."""
        with pytest.raises(HTTPException) as exc_info:
            decode_token("invalid.token.here")
        
        assert exc_info.value.status_code == 401

    def test_decode_expired_token(self):
        """Test decoding expired token raises exception."""
        from datetime import timedelta
        
        data = {"sub": "user123"}
        # Create token that expires immediately
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))
        
        with pytest.raises(HTTPException) as exc_info:
            decode_token(token)
        
        assert exc_info.value.status_code == 401

    def test_verify_token_type_correct(self):
        """Test verifying correct token type."""
        data = {"sub": "user123"}
        token = create_access_token(data)
        payload = decode_token(token)
        
        # Should not raise exception
        verify_token_type(payload, "access")

    def test_verify_token_type_incorrect(self):
        """Test verifying incorrect token type raises exception."""
        data = {"sub": "user123"}
        token = create_access_token(data)
        payload = decode_token(token)
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token_type(payload, "refresh")
        
        assert exc_info.value.status_code == 401
        assert "Invalid token type" in str(exc_info.value.detail)

    def test_access_and_refresh_tokens_different(self):
        """Test that access and refresh tokens have different types."""
        data = {"sub": "user123"}
        access_token = create_access_token(data)
        refresh_token = create_refresh_token(data)
        
        access_payload = decode_token(access_token)
        refresh_payload = decode_token(refresh_token)
        
        assert access_payload["type"] == "access"
        assert refresh_payload["type"] == "refresh"

    def test_token_contains_required_claims(self):
        """Test that token contains all required claims."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)
        payload = decode_token(token)
        
        required_claims = ["sub", "email", "exp", "iat", "type"]
        for claim in required_claims:
            assert claim in payload

