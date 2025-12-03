"""
Recipe macro analysis using OpenAI API.
Extracts nutritional information from recipe text.
"""
from openai import OpenAI, OpenAIError
import os
import json
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set")

client = OpenAI(api_key=OPENAI_API_KEY)


def create_recipe_analysis_prompt(recipe_text: str) -> str:
    """
    Create a prompt for OpenAI to analyze recipe macros.
    
    Args:
        recipe_text: Recipe text with ingredients
    
    Returns:
        Formatted prompt string
    """
    prompt = f"""Analyze the following recipe ingredients and calculate the total nutritional macros.

Recipe: {recipe_text}

Provide a detailed breakdown with:
1. Recipe name (create a simple descriptive name)
2. Each ingredient with amount and individual macros
3. Total calories and macros (protein, carbs, fats in grams)

Return ONLY a valid JSON object in this exact format:
{{
    "recipe_name": "Descriptive Recipe Name",
    "total_calories": 500,
    "macros": {{
        "protein": 50.0,
        "carbs": 55.0,
        "fats": 12.0
    }},
    "ingredients": [
        {{
            "name": "ingredient name",
            "amount": "200g",
            "calories": 330,
            "protein": 62.0,
            "carbs": 0.0,
            "fats": 7.0
        }}
    ]
}}

Be accurate with portion sizes and macro calculations. Do not include markdown formatting or explanations."""
    
    return prompt


def parse_recipe_analysis_response(response_text: str) -> Optional[Dict]:
    """
    Parse OpenAI response and extract recipe analysis data.
    
    Args:
        response_text: Raw response from OpenAI
    
    Returns:
        Parsed recipe data dictionary or None if parsing fails
    """
    try:
        # Clean up the response - remove markdown code blocks if present
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        
        cleaned = cleaned.strip()
        
        # Parse JSON
        recipe_data = json.loads(cleaned)
        
        # Validate required fields
        required_fields = ["recipe_name", "total_calories", "macros", "ingredients"]
        if not all(field in recipe_data for field in required_fields):
            print(f"Missing required fields in recipe analysis: {recipe_data}")
            return None
        
        # Validate macros structure
        if not all(key in recipe_data["macros"] for key in ["protein", "carbs", "fats"]):
            print(f"Missing macro fields: {recipe_data['macros']}")
            return None
        
        # Validate ingredients structure
        if not isinstance(recipe_data["ingredients"], list) or len(recipe_data["ingredients"]) == 0:
            print(f"Invalid ingredients structure")
            return None
        
        return recipe_data
    
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON from recipe analysis: {e}")
        print(f"Response was: {response_text}")
        return None
    except Exception as e:
        print(f"Unexpected error parsing recipe analysis: {e}")
        return None


def get_fallback_recipe_analysis(recipe_text: str) -> Dict:
    """
    Get a fallback recipe analysis when AI is unavailable.
    Returns a simple estimation.
    
    Args:
        recipe_text: Recipe text
    
    Returns:
        Basic recipe analysis
    """
    return {
        "recipe_name": "Custom Recipe",
        "total_calories": 500,
        "macros": {
            "protein": 30.0,
            "carbs": 50.0,
            "fats": 15.0
        },
        "ingredients": [
            {
                "name": "Mixed ingredients",
                "amount": "as listed",
                "calories": 500,
                "protein": 30.0,
                "carbs": 50.0,
                "fats": 15.0
            }
        ]
    }


def analyze_recipe_macros(recipe_text: str) -> Dict:
    """
    Analyze recipe text and extract macro information using AI.
    Falls back to estimation if AI is unavailable.
    
    Args:
        recipe_text: Recipe text with ingredients
    
    Returns:
        Dictionary containing recipe analysis with macros
    """
    # Check if OpenAI client is available
    if not client:
        print("OpenAI client not available, using fallback analysis")
        return get_fallback_recipe_analysis(recipe_text)
    
    try:
        # Create prompt
        prompt = create_recipe_analysis_prompt(recipe_text)
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional nutritionist analyzing recipe macros. Return only valid JSON without markdown formatting."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,  # Lower temperature for more consistent results
            max_tokens=800
        )
        
        # Extract response
        response_text = response.choices[0].message.content
        
        # Parse response
        recipe_data = parse_recipe_analysis_response(response_text)
        
        if recipe_data:
            print(f"Successfully analyzed recipe: {recipe_data['recipe_name']}")
            return recipe_data
        else:
            print("Failed to parse AI response, using fallback")
            return get_fallback_recipe_analysis(recipe_text)
    
    except OpenAIError as e:
        print(f"OpenAI API error: {e}")
        return get_fallback_recipe_analysis(recipe_text)
    
    except Exception as e:
        print(f"Unexpected error analyzing recipe: {e}")
        return get_fallback_recipe_analysis(recipe_text)


def calculate_recipe_totals(ingredients: List[Dict]) -> Dict:
    """
    Calculate total macros from ingredient list.
    
    Args:
        ingredients: List of ingredient dictionaries with macros
    
    Returns:
        Dictionary with total calories and macros
    """
    total_calories = sum(ing.get("calories", 0) for ing in ingredients)
    total_protein = sum(ing.get("protein", 0) for ing in ingredients)
    total_carbs = sum(ing.get("carbs", 0) for ing in ingredients)
    total_fats = sum(ing.get("fats", 0) for ing in ingredients)
    
    return {
        "total_calories": total_calories,
        "protein": round(total_protein, 1),
        "carbs": round(total_carbs, 1),
        "fats": round(total_fats, 1)
    }

