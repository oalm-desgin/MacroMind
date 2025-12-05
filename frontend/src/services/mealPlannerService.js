import axios from "axios";
import { AI_API_URL } from "../utils/constants";

// Create axios instance for nutrition-ai-service
const api = axios.create({
  baseURL: AI_API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ============================
   MEAL PLANNER API CALLS
============================ */

/**
 * Generate a weekly meal plan with optional excluded foods
 * @param {Array<string>} excludedFoods - List of foods to exclude
 * @returns {Promise} Weekly meal plan data
 */
const generateWeeklyPlan = async (excludedFoods = []) => {
  const res = await api.post("/generate-plan", {
    excluded_foods: excludedFoods
  });
  return res.data;
};

// Legacy methods for backward compatibility
const getWeeklyPlan = async () => {
  try {
    // Get the weekly meal plan from the saved plan
    const res = await api.get("/meal-plan");
    return res.data;
  } catch (error) {
    // If 404, return null (no meal plan exists)
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error('Error fetching weekly plan:', error);
    throw error;
  }
};

const getTodaysMeals = async () => {
  try {
    // Get the weekly meal plan
    const weeklyPlan = await api.get("/meal-plan");
    
    if (!weeklyPlan.data || !weeklyPlan.data.days) {
      return null;
    }
    
    // Get today's day name (Monday, Tuesday, etc.)
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = dayNames[today.getDay()];
    
    // Find today's plan
    const todayPlan = weeklyPlan.data.days.find(day => day.day === todayDayName);
    
    if (!todayPlan) {
      return null;
    }
    
    // Transform meals into the format expected by Dashboard
    const meals = [
      {
        id: `breakfast-${todayDayName}`,
        meal_type: 'breakfast',
        name: todayPlan.breakfast.name,
        calories: todayPlan.breakfast.calories,
        protein: todayPlan.breakfast.protein,
        carbs: todayPlan.breakfast.carbs,
        fats: todayPlan.breakfast.fats
      },
      {
        id: `lunch-${todayDayName}`,
        meal_type: 'lunch',
        name: todayPlan.lunch.name,
        calories: todayPlan.lunch.calories,
        protein: todayPlan.lunch.protein,
        carbs: todayPlan.lunch.carbs,
        fats: todayPlan.lunch.fats
      },
      {
        id: `dinner-${todayDayName}`,
        meal_type: 'dinner',
        name: todayPlan.dinner.name,
        calories: todayPlan.dinner.calories,
        protein: todayPlan.dinner.protein,
        carbs: todayPlan.dinner.carbs,
        fats: todayPlan.dinner.fats
      },
      {
        id: `snack-${todayDayName}`,
        meal_type: 'snack',
        name: todayPlan.snack.name,
        calories: todayPlan.snack.calories,
        protein: todayPlan.snack.protein,
        carbs: todayPlan.snack.carbs,
        fats: todayPlan.snack.fats
      }
    ];
    
    // Calculate daily totals
    const daily_totals = {
      calories: todayPlan.total_calories || meals.reduce((sum, meal) => sum + meal.calories, 0),
      protein: meals.reduce((sum, meal) => sum + meal.protein, 0),
      carbs: meals.reduce((sum, meal) => sum + meal.carbs, 0),
      fats: meals.reduce((sum, meal) => sum + meal.fats, 0)
    };
    
    return {
      date: today.toISOString().split('T')[0],
      meals: meals,
      daily_totals: daily_totals
    };
  } catch (error) {
    // If 404, return null (no meal plan exists)
    if (error.response && error.response.status === 404) {
      return null;
    }
    // For other errors, log and return null
    console.error('Error fetching today\'s meals:', error);
    throw error;
  }
};

const swapMeal = async (mealId) => {
  // This endpoint doesn't exist yet, just log for now
  console.log("Swap meal requested for:", mealId);
  return { success: true };
};

export default {
  generateWeeklyPlan,
  getWeeklyPlan,
  getTodaysMeals,
  swapMeal
};
