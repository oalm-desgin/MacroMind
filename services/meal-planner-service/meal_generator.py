"""
AI-powered meal generation using OpenAI API.
"""
from openai import OpenAI, OpenAIError
import os
import json
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Fallback meals for when AI is unavailable
FALLBACK_MEALS = {
    "breakfast": {
        "cut": {
            "name": "Greek Yogurt with Berries and Almonds",
            "calories": 350,
            "protein": 25.0,
            "carbs": 40.0,
            "fats": 10.0,
            "ingredients": [
                "1 cup Greek yogurt (non-fat)",
                "1/2 cup mixed berries",
                "2 tbsp sliced almonds",
                "1 tsp honey"
            ]
        },
        "bulk": {
            "name": "Protein Pancakes with Peanut Butter",
            "calories": 550,
            "protein": 35.0,
            "carbs": 65.0,
            "fats": 15.0,
            "ingredients": [
                "3 protein pancakes",
                "2 tbsp peanut butter",
                "1 banana",
                "2 tbsp maple syrup"
            ]
        },
        "maintain": {
            "name": "Oatmeal with Berries and Nuts",
            "calories": 400,
            "protein": 15.0,
            "carbs": 55.0,
            "fats": 12.0,
            "ingredients": [
                "1 cup rolled oats",
                "1/2 cup mixed berries",
                "2 tbsp mixed nuts",
                "1 cup almond milk"
            ]
        }
    },
    "lunch": {
        "cut": {
            "name": "Grilled Chicken Salad",
            "calories": 450,
            "protein": 45.0,
            "carbs": 30.0,
            "fats": 15.0,
            "ingredients": [
                "6 oz grilled chicken breast",
                "3 cups mixed greens",
                "1/2 cup cherry tomatoes",
                "1/4 avocado",
                "2 tbsp balsamic vinaigrette"
            ]
        },
        "bulk": {
            "name": "Chicken and Rice Bowl",
            "calories": 700,
            "protein": 55.0,
            "carbs": 85.0,
            "fats": 15.0,
            "ingredients": [
                "8 oz grilled chicken breast",
                "1.5 cups brown rice",
                "1 cup steamed broccoli",
                "2 tbsp olive oil"
            ]
        },
        "maintain": {
            "name": "Turkey and Quinoa Bowl",
            "calories": 550,
            "protein": 40.0,
            "carbs": 60.0,
            "fats": 15.0,
            "ingredients": [
                "6 oz ground turkey",
                "1 cup quinoa",
                "1 cup mixed vegetables",
                "1 tbsp olive oil"
            ]
        }
    },
    "dinner": {
        "cut": {
            "name": "Baked Salmon with Vegetables",
            "calories": 500,
            "protein": 50.0,
            "carbs": 35.0,
            "fats": 18.0,
            "ingredients": [
                "6 oz salmon fillet",
                "2 cups roasted vegetables",
                "1/2 cup sweet potato",
                "1 tbsp olive oil",
                "Lemon and herbs"
            ]
        },
        "bulk": {
            "name": "Steak with Pasta",
            "calories": 800,
            "protein": 60.0,
            "carbs": 80.0,
            "fats": 25.0,
            "ingredients": [
                "8 oz sirloin steak",
                "2 cups whole wheat pasta",
                "1/2 cup marinara sauce",
                "1 cup steamed broccoli",
                "2 tbsp parmesan cheese"
            ]
        },
        "maintain": {
            "name": "Chicken Stir-Fry",
            "calories": 600,
            "protein": 45.0,
            "carbs": 65.0,
            "fats": 18.0,
            "ingredients": [
                "6 oz chicken breast",
                "2 cups mixed vegetables",
                "1 cup brown rice",
                "2 tbsp stir-fry sauce",
                "1 tbsp sesame oil"
            ]
        }
    }
}


def get_meal_calorie_target(meal_type: str, daily_calories: int) -> int:
    """
    Calculate target calories for a specific meal type.
    
    Args:
        meal_type: Type of meal (breakfast, lunch, dinner)
        daily_calories: User's daily calorie target
    
    Returns:
        Target calories for the meal
    """
    # Typical distribution: breakfast 25%, lunch 35%, dinner 40%
    distributions = {
        "breakfast": 0.25,
        "lunch": 0.35,
        "dinner": 0.40
    }
    
    return int(daily_calories * distributions.get(meal_type, 0.33))


def get_default_calories_for_goal(fitness_goal: str) -> int:
    """
    Get default daily calories based on fitness goal.
    
    Args:
        fitness_goal: User's fitness goal
    
    Returns:
        Default daily calorie target
    """
    defaults = {
        "cut": 1800,
        "bulk": 2800,
        "maintain": 2200
    }
    return defaults.get(fitness_goal, 2000)


def create_meal_prompt(
    meal_type: str,
    fitness_goal: str,
    dietary_preference: str,
    target_calories: int
) -> str:
    """
    Create a detailed prompt for OpenAI to generate a meal.
    
    Args:
        meal_type: Type of meal (breakfast, lunch, dinner)
        fitness_goal: User's fitness goal (cut, bulk, maintain)
        dietary_preference: User's dietary preference
        target_calories: Target calories for this meal
    
    Returns:
        Formatted prompt string
    """
    dietary_constraint = ""
    if dietary_preference != "none":
        dietary_constraint = f"The meal must be {dietary_preference}. "
    
    goal_description = {
        "cut": "designed for weight loss with high protein and lower carbs",
        "bulk": "designed for muscle gain with high protein and higher calories",
        "maintain": "designed for weight maintenance with balanced macros"
    }
    
    prompt = f"""Generate a {meal_type} meal {goal_description.get(fitness_goal, '')}.

Requirements:
- Target calories: approximately {target_calories} calories
- {dietary_constraint}Must include realistic portions and ingredients
- Provide macros (protein, carbs, fats in grams)
- List 3-6 specific ingredients with measurements

Return ONLY a valid JSON object in this exact format:
{{
    "name": "Meal Name",
    "calories": {target_calories},
    "protein": 25.5,
    "carbs": 45.0,
    "fats": 12.0,
    "ingredients": [
        "1 cup ingredient 1",
        "200g ingredient 2",
        "2 tbsp ingredient 3"
    ]
}}

Do not include any markdown formatting, explanations, or additional text. Return only the JSON object."""
    
    return prompt


def parse_ai_meal_response(response_text: str) -> Optional[Dict]:
    """
    Parse OpenAI response and extract meal data.
    
    Args:
        response_text: Raw response from OpenAI
    
    Returns:
        Parsed meal data dictionary or None if parsing fails
    """
    try:
        # Clean up the response - remove markdown code blocks if present
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]  # Remove ```json
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]  # Remove ```
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]  # Remove trailing ```
        
        cleaned = cleaned.strip()
        
        # Parse JSON
        meal_data = json.loads(cleaned)
        
        # Validate required fields
        required_fields = ["name", "calories", "protein", "carbs", "fats", "ingredients"]
        if not all(field in meal_data for field in required_fields):
            print(f"Missing required fields in AI response: {meal_data}")
            return None
        
        # Validate types
        if not isinstance(meal_data["ingredients"], list):
            print(f"Ingredients is not a list: {meal_data['ingredients']}")
            return None
        
        return meal_data
    
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON from AI response: {e}")
        print(f"Response was: {response_text}")
        return None
    except Exception as e:
        print(f"Unexpected error parsing AI response: {e}")
        return None


def generate_meal_with_ai(
    meal_type: str,
    fitness_goal: str,
    dietary_preference: str,
    target_calories: int
) -> Dict:
    """
    Generate a meal using OpenAI API.
    Falls back to predefined meals if AI is unavailable.
    
    Args:
        meal_type: Type of meal (breakfast, lunch, dinner)
        fitness_goal: User's fitness goal
        dietary_preference: User's dietary preference
        target_calories: Target calories for the meal
    
    Returns:
        Dictionary containing meal data
    """
    # Check if OpenAI client is available
    if not client:
        print("OpenAI client not available, using fallback meal")
        return get_fallback_meal(meal_type, fitness_goal)
    
    try:
        # Create prompt
        prompt = create_meal_prompt(
            meal_type,
            fitness_goal,
            dietary_preference,
            target_calories
        )
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional nutritionist creating meal plans. Return only valid JSON without markdown formatting."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,  # Some creativity
            max_tokens=500
        )
        
        # Extract response
        response_text = response.choices[0].message.content
        
        # Parse response
        meal_data = parse_ai_meal_response(response_text)
        
        if meal_data:
            print(f"Successfully generated {meal_type} with AI")
            return meal_data
        else:
            print(f"Failed to parse AI response, using fallback")
            return get_fallback_meal(meal_type, fitness_goal)
    
    except OpenAIError as e:
        print(f"OpenAI API error: {e}")
        return get_fallback_meal(meal_type, fitness_goal)
    
    except Exception as e:
        print(f"Unexpected error generating meal: {e}")
        return get_fallback_meal(meal_type, fitness_goal)


def get_fallback_meal(meal_type: str, fitness_goal: str) -> Dict:
    """
    Get a predefined fallback meal when AI is unavailable.
    
    Args:
        meal_type: Type of meal
        fitness_goal: User's fitness goal
    
    Returns:
        Fallback meal data
    """
    return FALLBACK_MEALS.get(meal_type, {}).get(fitness_goal, FALLBACK_MEALS["breakfast"]["maintain"])


def generate_weekly_meals(
    fitness_goal: str,
    dietary_preference: str,
    daily_calories: Optional[int] = None
) -> List[Dict]:
    """
    Generate meals for an entire week (7 days × 3 meals = 21 meals).
    
    Args:
        fitness_goal: User's fitness goal
        dietary_preference: User's dietary preference
        daily_calories: User's daily calorie target
    
    Returns:
        List of 21 meal dictionaries with day and meal_type included
    """
    if daily_calories is None:
        daily_calories = get_default_calories_for_goal(fitness_goal)
    
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    meal_types = ["breakfast", "lunch", "dinner"]
    
    weekly_meals = []
    
    for day in days:
        for meal_type in meal_types:
            target_calories = get_meal_calorie_target(meal_type, daily_calories)
            
            meal_data = generate_meal_with_ai(
                meal_type,
                fitness_goal,
                dietary_preference,
                target_calories
            )
            
            # Add day and meal_type to the meal data
            meal_data["day"] = day
            meal_data["meal_type"] = meal_type
            
            weekly_meals.append(meal_data)
            
            print(f"Generated {day} {meal_type}: {meal_data['name']}")
    
    return weekly_meals

