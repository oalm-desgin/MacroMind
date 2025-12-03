"""
Tests for recipe analysis endpoint and functions.
"""
import pytest
from fastapi import status
from unittest.mock import patch, Mock
from macro_analyzer import (
    create_recipe_analysis_prompt,
    parse_recipe_analysis_response,
    get_fallback_recipe_analysis,
    analyze_recipe_macros,
    calculate_recipe_totals
)


class TestRecipeAnalysisEndpoint:
    """Tests for recipe analysis endpoint."""

    @patch('main.get_user_id_from_token')
    @patch('main.analyze_recipe_macros')
    def test_analyze_recipe_success(
        self,
        mock_analyze,
        mock_user_id,
        client,
        mock_user_id,
        sample_recipe_text
    ):
        """Test successful recipe analysis."""
        # Setup mock response
        mock_analyze.return_value = {
            "recipe_name": "Test Recipe",
            "total_calories": 500,
            "macros": {
                "protein": 50.0,
                "carbs": 55.0,
                "fats": 12.0
            },
            "ingredients": [
                {
                    "name": "Chicken breast",
                    "amount": "200g",
                    "calories": 330,
                    "protein": 62.0,
                    "carbs": 0.0,
                    "fats": 7.0
                }
            ]
        }
        
        mock_user_id.return_value = mock_user_id
        
        response = client.post(
            "/api/ai/analyze-recipe",
            json={"recipe_text": sample_recipe_text}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "recipe_name" in data
        assert "total_calories" in data
        assert "macros" in data
        assert "ingredients" in data

    @patch('main.get_user_id_from_token')
    def test_analyze_recipe_unauthorized(self, mock_user_id, client):
        """Test recipe analysis without authentication fails."""
        mock_user_id.side_effect = Exception("Unauthorized")
        
        response = client.post(
            "/api/ai/analyze-recipe",
            json={"recipe_text": "Some recipe"}
        )
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    @patch('main.get_user_id_from_token')
    def test_analyze_recipe_short_text(self, mock_user_id, client, mock_user_id):
        """Test recipe analysis with too short text fails validation."""
        mock_user_id.return_value = mock_user_id
        
        response = client.post(
            "/api/ai/analyze-recipe",
            json={"recipe_text": "short"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestRecipeAnalysisFunctions:
    """Tests for recipe analysis helper functions."""

    def test_create_recipe_analysis_prompt(self):
        """Test prompt creation for recipe analysis."""
        recipe_text = "Chicken 200g, rice 100g"
        prompt = create_recipe_analysis_prompt(recipe_text)
        
        assert recipe_text in prompt
        assert "JSON" in prompt
        assert "recipe_name" in prompt
        assert "macros" in prompt

    def test_parse_valid_recipe_response(self):
        """Test parsing valid JSON response."""
        response = '''{
            "recipe_name": "Test Recipe",
            "total_calories": 500,
            "macros": {
                "protein": 50.0,
                "carbs": 55.0,
                "fats": 12.0
            },
            "ingredients": [
                {
                    "name": "Chicken",
                    "amount": "200g",
                    "calories": 330,
                    "protein": 62.0,
                    "carbs": 0.0,
                    "fats": 7.0
                }
            ]
        }'''
        
        result = parse_recipe_analysis_response(response)
        
        assert result is not None
        assert result["recipe_name"] == "Test Recipe"
        assert result["total_calories"] == 500
        assert len(result["ingredients"]) == 1

    def test_parse_recipe_response_with_markdown(self):
        """Test parsing response with markdown code blocks."""
        response = '''```json
        {
            "recipe_name": "Test Recipe",
            "total_calories": 500,
            "macros": {"protein": 50.0, "carbs": 55.0, "fats": 12.0},
            "ingredients": [{
                "name": "Chicken",
                "amount": "200g",
                "calories": 330,
                "protein": 62.0,
                "carbs": 0.0,
                "fats": 7.0
            }]
        }
        ```'''
        
        result = parse_recipe_analysis_response(response)
        
        assert result is not None
        assert result["recipe_name"] == "Test Recipe"

    def test_parse_invalid_recipe_response(self):
        """Test parsing invalid JSON returns None."""
        response = "This is not JSON"
        
        result = parse_recipe_analysis_response(response)
        
        assert result is None

    def test_parse_recipe_response_missing_fields(self):
        """Test parsing response with missing fields returns None."""
        response = '{"recipe_name": "Test", "total_calories": 500}'
        
        result = parse_recipe_analysis_response(response)
        
        assert result is None

    def test_get_fallback_recipe_analysis(self):
        """Test fallback recipe analysis."""
        result = get_fallback_recipe_analysis("Some recipe")
        
        assert "recipe_name" in result
        assert "total_calories" in result
        assert "macros" in result
        assert "ingredients" in result

    @patch('macro_analyzer.client')
    def test_analyze_recipe_with_ai_success(self, mock_client):
        """Test successful AI recipe analysis."""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = '''{
            "recipe_name": "AI Recipe",
            "total_calories": 600,
            "macros": {"protein": 60.0, "carbs": 65.0, "fats": 15.0},
            "ingredients": [{
                "name": "Ingredient",
                "amount": "100g",
                "calories": 600,
                "protein": 60.0,
                "carbs": 65.0,
                "fats": 15.0
            }]
        }'''
        mock_client.chat.completions.create.return_value = mock_response
        
        result = analyze_recipe_macros("Test recipe")
        
        assert result["recipe_name"] == "AI Recipe"
        assert result["total_calories"] == 600

    @patch('macro_analyzer.client', None)
    def test_analyze_recipe_without_client(self):
        """Test recipe analysis falls back when client not available."""
        result = analyze_recipe_macros("Test recipe")
        
        # Should return fallback analysis
        assert result is not None
        assert "recipe_name" in result
        assert "total_calories" in result

    def test_calculate_recipe_totals(self):
        """Test calculating totals from ingredients."""
        ingredients = [
            {"calories": 330, "protein": 62.0, "carbs": 0.0, "fats": 7.0},
            {"calories": 350, "protein": 7.0, "carbs": 77.0, "fats": 1.0}
        ]
        
        totals = calculate_recipe_totals(ingredients)
        
        assert totals["total_calories"] == 680
        assert totals["protein"] == 69.0
        assert totals["carbs"] == 77.0
        assert totals["fats"] == 8.0

