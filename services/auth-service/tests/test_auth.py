"""
Tests for authentication endpoints.
"""
import pytest
from fastapi import status


class TestUserRegistration:
    """Tests for user registration endpoint."""

    def test_register_user_success(self, client, sample_user_data):
        """Test successful user registration."""
        response = client.post("/api/auth/register", json=sample_user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "id" in data
        assert data["email"] == sample_user_data["email"]
        assert data["message"] == "User registered successfully"

    def test_register_duplicate_email(self, client, sample_user_data):
        """Test registration with duplicate email fails."""
        # Register first user
        client.post("/api/auth/register", json=sample_user_data)
        
        # Try to register with same email
        response = client.post("/api/auth/register", json=sample_user_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"].lower()

    def test_register_weak_password(self, client, sample_user_data):
        """Test registration with weak password fails."""
        weak_data = sample_user_data.copy()
        weak_data["password"] = "weak"
        
        response = client.post("/api/auth/register", json=weak_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_invalid_email(self, client, sample_user_data):
        """Test registration with invalid email fails."""
        invalid_data = sample_user_data.copy()
        invalid_data["email"] = "not-an-email"
        
        response = client.post("/api/auth/register", json=invalid_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_missing_fields(self, client):
        """Test registration with missing required fields fails."""
        response = client.post("/api/auth/register", json={})
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_with_fitness_goals(self, client, sample_user_data):
        """Test registration with different fitness goals."""
        for goal in ["cut", "bulk", "maintain"]:
            data = sample_user_data.copy()
            data["email"] = f"user_{goal}@example.com"
            data["fitness_goal"] = goal
            
            response = client.post("/api/auth/register", json=data)
            
            assert response.status_code == status.HTTP_201_CREATED

    def test_register_with_dietary_preferences(self, client, sample_user_data):
        """Test registration with different dietary preferences."""
        for pref in ["none", "halal", "vegan", "vegetarian"]:
            data = sample_user_data.copy()
            data["email"] = f"user_{pref}@example.com"
            data["dietary_preference"] = pref
            
            response = client.post("/api/auth/register", json=data)
            
            assert response.status_code == status.HTTP_201_CREATED


class TestUserLogin:
    """Tests for user login endpoint."""

    def test_login_success(self, client, registered_user, sample_login_data):
        """Test successful login."""
        response = client.post("/api/auth/login", json=sample_login_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data

    def test_login_wrong_password(self, client, registered_user, sample_login_data):
        """Test login with wrong password fails."""
        wrong_data = sample_login_data.copy()
        wrong_data["password"] = "WrongPassword123!"
        
        response = client.post("/api/auth/login", json=wrong_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user fails."""
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "Password123!"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_invalid_email_format(self, client):
        """Test login with invalid email format."""
        response = client.post("/api/auth/login", json={
            "email": "not-an-email",
            "password": "Password123!"
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_missing_credentials(self, client):
        """Test login with missing credentials fails."""
        response = client.post("/api/auth/login", json={})
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestTokenRefresh:
    """Tests for token refresh endpoint."""

    def test_refresh_token_success(self, client, authenticated_user):
        """Test successful token refresh."""
        response = client.post("/api/auth/refresh", json={
            "refresh_token": authenticated_user["refresh_token"]
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_refresh_with_access_token_fails(self, client, authenticated_user):
        """Test that refresh endpoint rejects access tokens."""
        response = client.post("/api/auth/refresh", json={
            "refresh_token": authenticated_user["access_token"]
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_with_invalid_token(self, client):
        """Test refresh with invalid token fails."""
        response = client.post("/api/auth/refresh", json={
            "refresh_token": "invalid.token.here"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUserProfile:
    """Tests for user profile endpoints."""

    def test_get_profile_success(self, client, auth_headers):
        """Test getting user profile."""
        response = client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "profile" in data
        assert data["profile"]["fitness_goal"] == "cut"

    def test_get_profile_without_token(self, client):
        """Test getting profile without authentication fails."""
        response = client.get("/api/auth/me")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_profile_with_invalid_token(self, client):
        """Test getting profile with invalid token fails."""
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer invalid.token.here"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile_success(self, client, auth_headers):
        """Test updating user profile."""
        update_data = {
            "fitness_goal": "bulk",
            "dietary_preference": "vegetarian",
            "daily_calories": 2500
        }
        
        response = client.put("/api/auth/profile", json=update_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Profile updated successfully"
        
        # Verify changes
        profile_response = client.get("/api/auth/me", headers=auth_headers)
        profile = profile_response.json()["profile"]
        assert profile["fitness_goal"] == "bulk"
        assert profile["dietary_preference"] == "vegetarian"
        assert profile["daily_calories"] == 2500

    def test_update_profile_partial(self, client, auth_headers):
        """Test partial profile update (only some fields)."""
        update_data = {
            "fitness_goal": "maintain"
        }
        
        response = client.put("/api/auth/profile", json=update_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify only fitness_goal changed
        profile_response = client.get("/api/auth/me", headers=auth_headers)
        profile = profile_response.json()["profile"]
        assert profile["fitness_goal"] == "maintain"
        assert profile["dietary_preference"] == "none"  # Should remain unchanged

    def test_update_profile_without_token(self, client):
        """Test updating profile without authentication fails."""
        response = client.put("/api/auth/profile", json={"fitness_goal": "bulk"})
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestLogout:
    """Tests for logout endpoint."""

    def test_logout_success(self, client, auth_headers):
        """Test successful logout."""
        response = client.post("/api/auth/logout", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Logout successful"

    def test_logout_without_token(self, client):
        """Test logout without authentication fails."""
        response = client.post("/api/auth/logout")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

