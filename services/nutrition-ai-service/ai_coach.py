import google.generativeai as genai
import os
from typing import Optional, Dict, Any

# Configure Gemini with hardcoded API key
try:
    genai.configure(api_key="AIzaSyBF94uYk_-OEhthtKBdJBbwgt3_04dOQJk")
    print("Google Gemini client configured successfully")
except Exception as e:
    print(f"Warning: Failed to configure Gemini client: {e}")
    raise

# Debug: List available models
print("DEBUG: Listing available Gemini models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"AVAILABLE MODEL: {m.name}")
except Exception as e:
    print(f"WARNING: Could not list models: {e}")

# Initialize the model
model = None
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    print("Gemini model 'gemini-2.0-flash' initialized successfully")
except Exception as e:
    print(f"Warning: Failed to initialize Gemini model: {e}")
    model = None


def create_system_prompt(user_profile: Optional[Dict[str, Any]] = None) -> str:
    """
    Create personalized system prompt based on user profile.
    
    Args:
        user_profile: User profile dict with onboarding data
    
    Returns:
        System prompt string
    """
    base_prompt = """You are MacroMind AI, the advanced nutrition coach built into the MacroMind application.

CRITICAL RULES:
1. IDENTITY: You are MacroMind AI, built into the MacroMind app. Never present yourself as a generic nutrition coach.

2. COMPETITOR BLOCK: NEVER recommend external apps like MyFitnessPal, LoseIt, Cronometer, or any other food tracking apps. If the user needs to track food, meals, or macros, tell them to use the MacroMind Dashboard or Meal Planner features that are already available in the app.

3. FEATURE PROMOTION: 
   - When users ask about meal planning, remind them they can click the "Generate Weekly Plan" button on their Dashboard.
   - When users need to track meals or view their plan, direct them to the MacroMind Dashboard or Meal Planner.
   - Always promote MacroMind's built-in features over external solutions.

4. TONE: Be encouraging, data-driven, and confident. Keep answers concise (under 150 words). Focus on actionable, evidence-based nutrition advice.

5. USER PROFILE: You have access to the user's profile data. Use this to provide personalized recommendations."""
    
    if not user_profile:
        return base_prompt
    
    # Build personalized context from onboarding data
    context_parts = []
    
    if user_profile.get("goal_weight") and user_profile.get("current_weight"):
        weight_diff = user_profile.get("goal_weight") - user_profile.get("current_weight")
        if weight_diff > 0:
            context_parts.append(f"User wants to gain {weight_diff:.1f} lbs")
        elif weight_diff < 0:
            context_parts.append(f"User wants to lose {abs(weight_diff):.1f} lbs")
    
    if user_profile.get("activity_level"):
        context_parts.append(f"Activity level: {user_profile.get('activity_level')}")
    
    if user_profile.get("dietary_preference"):
        context_parts.append(f"Dietary preference: {user_profile.get('dietary_preference')}")
    
    if user_profile.get("disliked_foods"):
        context_parts.append(f"Dislikes: {user_profile.get('disliked_foods')}")
    
    if user_profile.get("main_goal"):
        context_parts.append(f"Main goal: {user_profile.get('main_goal')}")
    
    if context_parts:
        personalized_context = "User context: " + "; ".join(context_parts) + "."
        return f"{base_prompt}\n\n{personalized_context}"
    
    return base_prompt


def chat_with_nutrition_coach(
    message: str,
    user_profile: Optional[Dict[str, Any]] = None
) -> str:
    """
    Send a message to the AI nutrition coach and get a response.
    
    Args:
        message: User's message/question
        user_profile: Optional user profile dict for personalized responses
    
    Returns:
        AI coach response
    
    Raises:
        RuntimeError: If Gemini API key is missing or invalid
    """
    # Check if Gemini model is available
    if not model:
        error_msg = "Gemini API key is not configured. Please set GEMINI_API_KEY environment variable."
        print(f"ERROR: {error_msg}")
        raise RuntimeError(error_msg)
    
    try:
        system_prompt = create_system_prompt(user_profile)
        print(f"System prompt created: {system_prompt[:100]}...")
        
        # Gemini doesn't have a separate system role, so prepend system prompt to user message
        full_prompt = f"{system_prompt}\n\nUser: {message}\n\nAssistant:"
        print(f"Sending message to Gemini: {message[:100]}...")
        
        # Generate content using Gemini
        response = model.generate_content(full_prompt)
        
        ai_response = response.text.strip()
        print(f"Gemini response received: {ai_response[:100]}...")
        return ai_response
    
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        
        # Check for specific Gemini API errors
        if "api_key" in error_message.lower() or "authentication" in error_message.lower() or "API_KEY" in error_message:
            error_msg = f"Gemini API key is invalid or missing. Error: {error_message}"
            print(f"ERROR: {error_msg}")
            raise RuntimeError(error_msg)
        elif "rate_limit" in error_message.lower() or "quota" in error_message.lower():
            error_msg = f"Gemini API rate limit exceeded. Error: {error_message}"
            print(f"ERROR: {error_msg}")
            raise RuntimeError(error_msg)
        else:
            # Fallback response if AI fails for other reasons
            print(f"Gemini API error ({error_type}): {error_message}")
            print("Using fallback response")
            return get_fallback_response(message, user_profile)


def get_fallback_response(message: str, user_profile: Optional[Dict[str, Any]] = None) -> str:
    """
    Generate a fallback response when AI is unavailable.
    
    Args:
        message: User's message
        user_profile: Optional user profile
    
    Returns:
        Fallback response string
    """
    message_lower = message.lower()
    
    if any(word in message_lower for word in ["protein", "muscle", "build"]):
        return "For muscle building, aim for 0.8-1g of protein per pound of body weight. Include lean meats, eggs, dairy, and plant proteins in your meals. Track your macros using the MacroMind Dashboard."
    
    if any(word in message_lower for word in ["lose", "weight", "fat", "cut"]):
        return "To lose weight sustainably, create a moderate calorie deficit (500-750 calories/day), prioritize protein and vegetables, and stay active. Use the MacroMind Meal Planner to generate a personalized weekly plan."
    
    if any(word in message_lower for word in ["meal", "plan", "planning", "track", "tracking"]):
        return "Use MacroMind's Meal Planner to generate your weekly meal plan. Click 'Generate Weekly Plan' on your Dashboard. Plan meals around your schedule, prep protein sources in advance, and include vegetables with every meal."
    
    return "I'm here to help with your nutrition goals! Use MacroMind's Dashboard and Meal Planner features to track your progress and plan your meals. Focus on whole foods, adequate protein, and staying consistent. What specific area would you like guidance on?"


def validate_ai_response_length(response: str, max_words: int = 150) -> str:
    """
    Validate and truncate AI response if it exceeds word limit.
    
    Args:
        response: AI response text
        max_words: Maximum number of words allowed
    
    Returns:
        Validated response (truncated if necessary)
    """
    words = response.split()
    if len(words) <= max_words:
        return response
    
    # Truncate to max_words and add ellipsis
    truncated = " ".join(words[:max_words])
    if not truncated.endswith((".", "!", "?")):
        truncated += "..."
    
    return truncated
