"""
Meal plan generation using Google Gemini AI.
"""
import json
from typing import Optional, Dict, Any, List

# Get the model from ai_coach (reuse the same Gemini model)
from ai_coach import model

# Days of the week
DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def create_meal_plan_prompt(
    user_profile: Optional[Dict[str, Any]],
    excluded_foods: List[str]
) -> str:
    """
    Create a prompt for Gemini to generate a weekly meal plan.
    
    Args:
        user_profile: User profile dict with calories, goals, preferences
        excluded_foods: List of foods to exclude
    
    Returns:
        Formatted prompt string
    """
    # Extract user data
    daily_calories = user_profile.get("daily_calories") if user_profile else 2000
    fitness_goal = user_profile.get("fitness_goal", "maintain") if user_profile else "maintain"
    dietary_preference = user_profile.get("dietary_preference", "none") if user_profile else "none"
    disliked_foods = user_profile.get("disliked_foods", "") if user_profile else ""
    
    # Combine excluded foods with user's disliked foods
    all_excluded = excluded_foods.copy()
    if disliked_foods:
        # Parse disliked_foods if it's a string (comma-separated)
        if isinstance(disliked_foods, str):
            all_excluded.extend([f.strip() for f in disliked_foods.split(",") if f.strip()])
        elif isinstance(disliked_foods, list):
            all_excluded.extend(disliked_foods)
    
    # Remove duplicates
    all_excluded = list(set(all_excluded))
    
    # Build the prompt
    prompt = f"""You are a professional nutritionist creating a personalized weekly meal plan.

User Profile:
- Daily Calorie Target: {daily_calories} calories
- Fitness Goal: {fitness_goal}
- Dietary Preference: {dietary_preference}
- Excluded Foods: {', '.join(all_excluded) if all_excluded else 'None'}

Requirements:
1. Create a complete 7-day meal plan (Monday through Sunday)
2. Each day must have: breakfast, lunch, dinner, and snack
3. Each meal must include:
   - name: Descriptive meal name
   - calories: Exact calorie count (integer)
   - protein: Protein in grams (integer)
   - carbs: Carbohydrates in grams (integer)
   - fats: Fats in grams (integer)
   - ingredients: List of ingredient names (array of strings)
   - instructions: Brief cooking/preparation instructions (string)
4. Each day must have a total_calories field (sum of all meals)
5. Ensure daily totals are close to {daily_calories} calories
6. Do NOT include any excluded foods
7. Respect dietary preferences (e.g., vegetarian, vegan, halal)

Output Format:
You MUST respond with ONLY valid JSON matching this exact structure:
{{
  "days": [
    {{
      "day": "Monday",
      "breakfast": {{
        "name": "Meal Name",
        "calories": 350,
        "protein": 20,
        "carbs": 45,
        "fats": 10,
        "ingredients": ["ingredient1", "ingredient2"],
        "instructions": "Brief instructions"
      }},
      "lunch": {{...}},
      "dinner": {{...}},
      "snack": {{...}},
      "total_calories": 1550
    }},
    {{"day": "Tuesday", ...}},
    ... (all 7 days)
  ]
}}

IMPORTANT: Return ONLY the JSON object, no markdown, no code blocks, no explanations. Start with {{ and end with }}.
"""
    return prompt


def generate_weekly_plan(
    user_profile: Optional[Dict[str, Any]] = None,
    excluded_foods: List[str] = None
) -> Dict[str, Any]:
    """
    Generate a weekly meal plan using Gemini AI.
    
    Args:
        user_profile: User profile dict with calories, goals, preferences
        excluded_foods: List of foods to exclude from the meal plan
    
    Returns:
        Dictionary matching WeeklyPlan schema
    
    Raises:
        RuntimeError: If Gemini API fails or returns invalid JSON
    """
    if excluded_foods is None:
        excluded_foods = []
    
    if not model:
        error_msg = "Gemini API key is not configured. Please set GEMINI_API_KEY environment variable."
        print(f"ERROR: {error_msg}")
        raise RuntimeError(error_msg)
    
    try:
        prompt = create_meal_plan_prompt(user_profile, excluded_foods)
        daily_calories = user_profile.get('daily_calories') if user_profile else None
        print(f"Generating meal plan for {daily_calories if daily_calories else 'default'} calories...")
        
        # Generate content with Gemini
        # Request JSON response explicitly
        generation_config = {
            "temperature": 0.7,
            "max_output_tokens": 8192,
        }
        
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        response_text = response.text.strip()
        print(f"Gemini response received (length: {len(response_text)})")
        
        # Clean up response - remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]  # Remove ```json
        elif response_text.startswith("```"):
            response_text = response_text[3:]  # Remove ```
        
        if response_text.endswith("```"):
            response_text = response_text[:-3]  # Remove closing ```
        
        response_text = response_text.strip()
        
        # Parse JSON
        try:
            meal_plan_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON response: {e}")
            print(f"Response text: {response_text[:500]}...")
            raise RuntimeError(f"Gemini returned invalid JSON: {str(e)}")
        
        # Validate structure
        if "days" not in meal_plan_data:
            raise RuntimeError("Gemini response missing 'days' field")
        
        if not isinstance(meal_plan_data["days"], list):
            raise RuntimeError("Gemini response 'days' must be a list")
        
        if len(meal_plan_data["days"]) != 7:
            print(f"Warning: Expected 7 days, got {len(meal_plan_data['days'])}")
        
        print(f"Meal plan generated successfully with {len(meal_plan_data['days'])} days")
        return meal_plan_data
    
    except RuntimeError:
        # Re-raise RuntimeErrors (API key issues, etc.)
        raise
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        print(f"Error generating meal plan ({error_type}): {error_message}")
        raise RuntimeError(f"Failed to generate meal plan: {error_message}")

