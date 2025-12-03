"""
Tests for meal planner endpoints.
"""
import pytest
from fastapi import status
from unittest.mock import patch, Mock
from datetime import date, timedelta
import uuid


class TestGenerateWeeklyMealPlan:
    """Tests for weekly meal plan generation endpoint."""

    @patch('main.get_user_id_from_token')
    @patch('main.get_user_profile')
    @patch('main.generate_weekly_meals')
    def test_generate_weekly_success(
        self,
        mock_generate,
        mock_profile,
        mock_user_id,
        client,
        mock_user_id,
        mock_user_profile,
        sample_weekly_meals
    ):
        """Test successful weekly meal plan generation."""
        # Setup mocks
        mock_user_id.return_value = mock_user_id
        mock_profile.return_value = mock_user_profile
        mock_generate.return_value = sample_weekly_meals
        
        response = client.post(
            "/api/meals/generate-weekly",
            json={"week_start": "2025-11-25"}
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "plan_id" in data
        assert "meals" in data
        assert len(data["meals"]) == 21  # 7 days × 3 meals

    @patch('main.get_user_id_from_token')
    def test_generate_weekly_unauthorized(self, mock_user_id, client):
        """Test generation without authentication fails."""
        mock_user_id.side_effect = Exception("Unauthorized")
        
        response = client.post("/api/meals/generate-weekly", json={})
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


class TestGetWeeklyMealPlan:
    """Tests for getting weekly meal plan endpoint."""

    @patch('main.get_user_id_from_token')
    def test_get_weekly_plan_not_found(self, mock_user_id, client, mock_user_id):
        """Test getting non-existent meal plan returns 404."""
        mock_user_id.return_value = mock_user_id
        
        response = client.get("/api/meals/week")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch('main.get_user_id_from_token')
    @patch('main.get_user_profile')
    @patch('main.generate_weekly_meals')
    def test_get_weekly_plan_success(
        self,
        mock_generate,
        mock_profile,
        mock_user_id_func,
        client,
        mock_user_id,
        mock_user_profile,
        sample_weekly_meals
    ):
        """Test getting existing meal plan."""
        # Setup mocks
        mock_user_id_func.return_value = mock_user_id
        mock_profile.return_value = mock_user_profile
        mock_generate.return_value = sample_weekly_meals
        
        # First create a meal plan
        create_response = client.post(
            "/api/meals/generate-weekly",
            json={"week_start": "2025-11-25"}
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        
        # Then retrieve it
        response = client.get("/api/meals/week?week_start=2025-11-25")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "meals" in data
        assert len(data["meals"]) == 21


class TestGetTodaysMeals:
    """Tests for getting today's meals endpoint."""

    @patch('main.get_user_id_from_token')
    def test_get_todays_meals_not_found(self, mock_user_id, client, mock_user_id):
        """Test getting today's meals when no plan exists."""
        mock_user_id.return_value = mock_user_id
        
        response = client.get("/api/meals/today")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch('main.get_user_id_from_token')
    @patch('main.get_user_profile')
    @patch('main.generate_weekly_meals')
    @patch('main.get_monday_of_week')
    @patch('main.get_day_of_week_name')
    def test_get_todays_meals_success(
        self,
        mock_day_name,
        mock_monday,
        mock_generate,
        mock_profile,
        mock_user_id_func,
        client,
        mock_user_id,
        mock_user_profile,
        sample_weekly_meals
    ):
        """Test getting today's meals successfully."""
        # Setup mocks
        mock_user_id_func.return_value = mock_user_id
        mock_profile.return_value = mock_user_profile
        mock_generate.return_value = sample_weekly_meals
        mock_monday.return_value = date(2025, 11, 24)  # A Monday
        mock_day_name.return_value = "monday"
        
        # Create meal plan first
        create_response = client.post(
            "/api/meals/generate-weekly",
            json={"week_start": "2025-11-24"}
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        
        # Get today's meals
        response = client.get("/api/meals/today")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "meals" in data
        assert "daily_totals" in data
        assert len(data["meals"]) == 3  # breakfast, lunch, dinner


class TestSwapMeal:
    """Tests for swapping a meal endpoint."""

    @patch('main.get_user_id_from_token')
    def test_swap_meal_not_found(self, mock_user_id, client, mock_user_id):
        """Test swapping non-existent meal returns 404."""
        mock_user_id.return_value = mock_user_id
        fake_meal_id = str(uuid.uuid4())
        
        response = client.put(f"/api/meals/{fake_meal_id}/swap")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch('main.get_user_id_from_token')
    @patch('main.get_user_profile')
    @patch('main.generate_weekly_meals')
    @patch('main.generate_meal_with_ai')
    def test_swap_meal_success(
        self,
        mock_generate_meal,
        mock_generate_weekly,
        mock_profile,
        mock_user_id_func,
        client,
        mock_user_id,
        mock_user_profile,
        sample_weekly_meals,
        sample_meal_data
    ):
        """Test successfully swapping a meal."""
        # Setup mocks
        mock_user_id_func.return_value = mock_user_id
        mock_profile.return_value = mock_user_profile
        mock_generate_weekly.return_value = sample_weekly_meals
        mock_generate_meal.return_value = sample_meal_data
        
        # Create meal plan first
        create_response = client.post(
            "/api/meals/generate-weekly",
            json={"week_start": "2025-11-25"}
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        
        # Get a meal ID
        meal_id = create_response.json()["meals"][0]["id"]
        
        # Swap the meal
        response = client.put(f"/api/meals/{meal_id}/swap")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == sample_meal_data["name"]

