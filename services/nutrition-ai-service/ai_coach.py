from openai import OpenAI
import os
from typing import Optional, Dict, Any

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize client only if API key is available
client = None
if OPENAI_API_KEY:
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        print("OpenAI client initialized successfully")
    except Exception as e:
        print(f"Warning: Failed to initialize OpenAI client: {e}")
        client = None
else:
    print("WARNING: OPENAI_API_KEY not set - will use fallback responses")


def create_system_prompt(user_profile: Optional[Dict[str, Any]] = None) -> str:
    """
    Create personalized system prompt based on user profile.
    
    Args:
        user_profile: User profile dict with onboarding data
    
    Returns:
        System prompt string
    """
    base_prompt = """You are MacroMind, an encouraging but data-driven nutrition coach. Keep answers concise, helpful, and focused on the user's goals."""
    
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
        RuntimeError: If OpenAI API key is missing or invalid
    """
    # Check if OpenAI client is available
    if not client:
        error_msg = "OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable."
        print(f"ERROR: {error_msg}")
        raise RuntimeError(error_msg)
    
    try:
        system_prompt = create_system_prompt(user_profile)
        print(f"System prompt created: {system_prompt[:100]}...")
        print(f"Sending message to OpenAI: {message[:100]}...")
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content.strip()
        print(f"OpenAI response received: {ai_response[:100]}...")
        return ai_response
    
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        
        # Check for specific OpenAI API errors
        if "api_key" in error_message.lower() or "authentication" in error_message.lower():
            error_msg = f"OpenAI API key is invalid or missing. Error: {error_message}"
            print(f"ERROR: {error_msg}")
            raise RuntimeError(error_msg)
        elif "rate_limit" in error_message.lower() or "quota" in error_message.lower():
            error_msg = f"OpenAI API rate limit exceeded. Error: {error_message}"
            print(f"ERROR: {error_msg}")
            raise RuntimeError(error_msg)
        else:
            # Fallback response if AI fails for other reasons
            print(f"OpenAI API error ({error_type}): {error_message}")
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
        return "For muscle building, aim for 0.8-1g of protein per pound of body weight. Include lean meats, eggs, dairy, and plant proteins in your meals."
    
    if any(word in message_lower for word in ["lose", "weight", "fat", "cut"]):
        return "To lose weight sustainably, create a moderate calorie deficit (500-750 calories/day), prioritize protein and vegetables, and stay active. Consistency is key."
    
    if any(word in message_lower for word in ["meal", "plan", "planning"]):
        return "Plan meals around your schedule. Prep protein sources in advance, include vegetables with every meal, and balance carbs around your activity level."
    
    return "I'm here to help with your nutrition goals! Focus on whole foods, adequate protein, and staying consistent with your plan. What specific area would you like guidance on?"


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
