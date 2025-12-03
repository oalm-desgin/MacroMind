import axios from "axios";

const API_BASE_URL = "http://localhost:8001"; // ✅ MEAL PLANNER SERVICE

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// ✅ Attach JWT automatically
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

const generateWeeklyPlan = async (weekStart = null) => {
  const payload = weekStart ? { week_start: weekStart } : {};
  const res = await api.post("/api/meals/generate-weekly", payload);
  return res.data;
};

const getWeeklyPlan = async (weekStart = null) => {
  const params = weekStart ? { week_start: weekStart } : {};
  const res = await api.get("/api/meals/week", { params });
  return res.data;
};

const getTodaysMeals = async () => {
  const res = await api.get("/api/meals/today");
  return res.data;
};

const swapMeal = async (mealId) => {
  const res = await api.put(`/api/meals/${mealId}/swap`);
  return res.data;
};

export default {
  generateWeeklyPlan,
  getWeeklyPlan,
  getTodaysMeals,
  swapMeal
};
