import axios from 'axios'
import { AI_API_URL } from '../utils/constants'

// Create separate axios instance for nutrition-ai-service
const nutritionAIAPI = axios.create({
  baseURL: AI_API_URL,
  timeout: 60000, // 60 seconds for AI responses
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
nutritionAIAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

const aiCoachService = {
  /**
   * Send message to AI coach
   */
  sendMessage: async (message) => {
    console.log('[AI_COACH] Sending message to nutrition-ai-service:', message.substring(0, 50))
    try {
      const response = await nutritionAIAPI.post('/chat', {
        message
      })
      console.log('[AI_COACH] Received response:', response.data)
      return response.data
    } catch (error) {
      console.error('[AI_COACH] Error sending message:', error)
      console.error('[AI_COACH] Error details:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Get chat history
   */
  getChatHistory: async (userId, limit = 50, offset = 0) => {
    console.log('[AI_COACH] Fetching chat history for user:', userId)
    try {
      const response = await nutritionAIAPI.get(`/api/ai/history/${userId}`, {
        params: { limit, offset }
      })
      return response.data
    } catch (error) {
      console.error('[AI_COACH] Error fetching chat history:', error)
      // Return empty history if user doesn't exist or has no history
      if (error.response?.status === 404 || error.response?.status === 400) {
        return { total: 0, messages: [] }
      }
      throw error
    }
  },

  /**
   * Clear chat history
   */
  clearHistory: async (userId) => {
    const response = await nutritionAIAPI.delete(`/api/ai/history/${userId}`)
    return response.data
  },

  /**
   * Analyze recipe macros
   */
  analyzeRecipe: async (recipeText) => {
    const response = await nutritionAIAPI.post('/api/ai/analyze-recipe', {
      recipe_text: recipeText
    })
    return response.data
  }
}

export default aiCoachService

