// --- API CONFIGURATION ---

// Auth Service (Registration, Login, Profile) - Port 8000
export const AUTH_API_URL = "http://localhost:8000/api/auth";

// Nutrition AI Service (AI Coach, Meal Planner) - Port 8001
export const AI_API_URL = "http://localhost:8001/api/ai"; 

// Fallback / Base URL (Used for generic requests if needed)
export const API_BASE_URL = "http://localhost:8000";


// --- CONSTANTS & ENUMS ---

// Fitness Goals
export const FITNESS_GOALS = {
  CUT: 'cut',
  BULK: 'bulk',
  MAINTAIN: 'maintain'
};

// Fitness Goal Labels
export const FITNESS_GOAL_LABELS = {
  [FITNESS_GOALS.CUT]: 'Lose Weight',
  [FITNESS_GOALS.BULK]: 'Gain Muscle',
  [FITNESS_GOALS.MAINTAIN]: 'Maintain Weight'
};

// Dietary Preferences
export const DIETARY_PREFERENCES = {
  NONE: 'none',
  HALAL: 'halal',
  VEGAN: 'vegan',
  VEGETARIAN: 'vegetarian',
  KETO: 'keto',
  GLUTEN_FREE: 'gluten_free',
  DAIRY_FREE: 'dairy_free'
};

// Dietary Preference Labels
export const DIETARY_PREFERENCE_LABELS = {
  [DIETARY_PREFERENCES.NONE]: 'No Restrictions',
  [DIETARY_PREFERENCES.HALAL]: 'Halal',
  [DIETARY_PREFERENCES.VEGAN]: 'Vegan',
  [DIETARY_PREFERENCES.VEGETARIAN]: 'Vegetarian',
  [DIETARY_PREFERENCES.KETO]: 'Keto',
  [DIETARY_PREFERENCES.GLUTEN_FREE]: 'Gluten Free',
  [DIETARY_PREFERENCES.DAIRY_FREE]: 'Dairy Free'
};

// Activity Levels
export const ACTIVITY_LEVELS = {
  SEDENTARY: 'sedentary',
  LIGHT: 'light',
  MODERATE: 'moderate',
  ACTIVE: 'active',
  VERY_ACTIVE: 'very_active'
};

// Activity Level Labels
export const ACTIVITY_LEVEL_LABELS = {
  [ACTIVITY_LEVELS.SEDENTARY]: 'Sedentary (Office job, little exercise)',
  [ACTIVITY_LEVELS.LIGHT]: 'Light (1-3 days/week)',
  [ACTIVITY_LEVELS.MODERATE]: 'Moderate (3-5 days/week)',
  [ACTIVITY_LEVELS.ACTIVE]: 'Active (6-7 days/week)',
  [ACTIVITY_LEVELS.VERY_ACTIVE]: 'Very Active (Physical job + training)'
};