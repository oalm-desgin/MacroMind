"""
Tests for meal generator functions.
"""
import pytest
from unittest.mock import Mock, patch
from meal_generator import (
    get_meal_calorie_target,
    get_default_calories_for_goal,
    create_meal_prompt,
    parse_ai_meal_response,
    get_fallback_meal,
    generate_meal_with_ai
)


class TestMealCalorieCalculations:
    """Tests for calorie calculation functions."""

    def test_get_meal_calorie_target_breakfast(self):
        """Test breakfast calorie calculation (25%)."""
        result = get_meal_calorie_target("breakfast", 2000)
        assert result == 500  # 25% of 2000

    def test_get_meal_calorie_target_lunch(self):
        """Test lunch calorie calculation (35%)."""
        result = get_meal_calorie_target("lunch", 2000)
        assert result == 700  # 35% of 2000

    def test_get_meal_calorie_target_dinner(self):
        """Test dinner calorie calculation (40%)."""
        result = get_meal_calorie_target("dinner", 2000)
        assert result == 800  # 40% of 2000

    def test_get_default_calories_for_cut(self):
        """Test default calories for cutting."""
        result = get_default_calories_for_goal("cut")
        assert result == 1800

    def test_get_default_calories_for_bulk(self):
        """Test default calories for bulking."""
        result = get_default_calories_for_goal("bulk")
        assert result == 2800

    def test_get_default_calories_for_maintain(self):
        """Test default calories for maintenance."""
        result = get_default_calories_for_goal("maintain")
        assert result == 2200


class TestMealPromptCreation:
    """Tests for meal prompt creation."""

    def test_create_meal_prompt_basic(self):
        """Test basic meal prompt creation."""
        prompt = create_meal_prompt("breakfast", "cut", "none", 400)
        
        assert "breakfast" in prompt.lower()
        assert "400" in prompt
        assert "JSON" in prompt

    def test_create_meal_prompt_with_dietary_preference(self):
        """Test prompt with dietary preference."""
        prompt = create_meal_prompt("lunch", "bulk", "vegan", 700)
        
        assert "vegan" in prompt.lower()
        assert "700" in prompt

    def test_create_meal_prompt_different_goals(self):
        """Test prompts for different fitness goals."""
        cut_prompt = create_meal_prompt("dinner", "cut", "none", 500)
        bulk_prompt = create_meal_prompt("dinner", "bulk", "none", 800)
        
        assert "weight loss" in cut_prompt.lower() or "cut" in cut_prompt.lower()
        assert "muscle gain" in bulk_prompt.lower() or "bulk" in bulk_prompt.lower()


class TestAIResponseParsing:
    """Tests for parsing AI responses."""

    def test_parse_valid_json_response(self):
        """Test parsing valid JSON response."""
        response = '''{
            "name": "Test Meal",
            "calories": 400,
            "protein": 25.0,
            "carbs": 45.0,
            "fats": 12.0,
            "ingredients": ["item1", "item2"]
        }'''
        
        result = parse_ai_meal_response(response)
        
        assert result is not None
        assert result["name"] == "Test Meal"
        assert result["calories"] == 400
        assert len(result["ingredients"]) == 2

    def test_parse_json_with_markdown(self):
        """Test parsing JSON wrapped in markdown code blocks."""
        response = '''```json
        {
            "name": "Test Meal",
            "calories": 400,
            "protein": 25.0,
            "carbs": 45.0,
            "fats": 12.0,
            "ingredients": ["item1", "item2"]
        }
        ```'''
        
        result = parse_ai_meal_response(response)
        
        assert result is not None
        assert result["name"] == "Test Meal"

    def test_parse_invalid_json(self):
        """Test parsing invalid JSON returns None."""
        response = "This is not JSON"
        
        result = parse_ai_meal_response(response)
        
        assert result is None

    def test_parse_json_missing_fields(self):
        """Test parsing JSON with missing required fields."""
        response = '''{
            "name": "Test Meal",
            "calories": 400
        }'''
        
        result = parse_ai_meal_response(response)
        
        assert result is None


class TestFallbackMeals:
    """Tests for fallback meal functionality."""

    def test_get_fallback_breakfast_cut(self):
        """Test getting fallback breakfast for cutting."""
        meal = get_fallback_meal("breakfast", "cut")
        
        assert meal is not None
        assert "name" in meal
        assert "calories" in meal
        assert "ingredients" in meal
        assert meal["calories"] < 500  # Cutting should be lower calorie

    def test_get_fallback_lunch_bulk(self):
        """Test getting fallback lunch for bulking."""
        meal = get_fallback_meal("lunch", "bulk")
        
        assert meal is not None
        assert meal["calories"] > 600  # Bulking should be higher calorie

    def test_get_fallback_dinner_maintain(self):
        """Test getting fallback dinner for maintenance."""
        meal = get_fallback_meal("dinner", "maintain")
        
        assert meal is not None
        assert 500 <= meal["calories"] <= 700  # Moderate calories


class TestMealGeneration:
    """Tests for meal generation with AI."""

    @patch('meal_generator.client')
    def test_generate_meal_with_ai_success(self, mock_client):
        """Test successful AI meal generation."""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = '''{
            "name": "AI Generated Meal",
            "calories": 450,
            "protein": 30.0,
            "carbs": 50.0,
            "fats": 15.0,
            "ingredients": ["ingredient 1", "ingredient 2"]
        }'''
        mock_client.chat.completions.create.return_value = mock_response
        
        result = generate_meal_with_ai("breakfast", "maintain", "none", 450)
        
        assert result["name"] == "AI Generated Meal"
        assert result["calories"] == 450

    @patch('meal_generator.client', None)
    def test_generate_meal_without_client(self):
        """Test meal generation falls back when client not available."""
        result = generate_meal_with_ai("breakfast", "cut", "none", 350)
        
        # Should return fallback meal
        assert result is not None
        assert "name" in result
        assert "calories" in result

    @patch('meal_generator.client')
    def test_generate_meal_ai_error(self, mock_client):
        """Test meal generation falls back on AI error."""
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        
        result = generate_meal_with_ai("lunch", "bulk", "vegan", 700)
        
        # Should return fallback meal
        assert result is not None
        assert "name" in result

