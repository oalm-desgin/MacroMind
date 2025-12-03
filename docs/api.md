# API Documentation

Complete REST API reference for MacroMind microservices.

## Base URLs

**Local Development:**
- Auth Service: `http://localhost:8000`
- Meal Planner Service: `http://localhost:8001`
- Nutrition AI Service: `http://localhost:8002`

**Kubernetes:**
- All services: `http://macromind.local/api/{service}`

## Authentication

All protected endpoints require JWT Bearer token in Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Auth Service API

### POST /api/auth/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fitness_goal": "cut",
  "dietary_preference": "none"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "message": "User registered successfully"
}
```

**Errors:**
- 400: Email already registered
- 422: Validation error (weak password, invalid email)

---

### POST /api/auth/login

Login and receive JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Errors:**
- 401: Invalid credentials
- 422: Validation error

---

### GET /api/auth/me

Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "profile": {
    "fitness_goal": "cut",
    "daily_calories": 2000,
    "dietary_preference": "none"
  },
  "created_at": "2025-11-26T10:00:00Z"
}
```

**Errors:**
- 401: Invalid or expired token

---

### PUT /api/auth/profile

Update user profile and fitness goals.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "fitness_goal": "bulk",
  "daily_calories": 2500,
  "dietary_preference": "vegetarian"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "fitness_goal": "bulk",
    "daily_calories": 2500,
    "dietary_preference": "vegetarian"
  }
}
```

---

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

## Meal Planner Service API

### POST /api/meals/generate-weekly

Generate AI-powered weekly meal plan.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "week_start": "2025-11-26"
}
```

**Response (201):**
```json
{
  "plan_id": "uuid",
  "week_start": "2025-11-26",
  "meals": [
    {
      "id": "uuid",
      "day": "monday",
      "meal_type": "breakfast",
      "name": "Oatmeal with Berries and Almonds",
      "calories": 400,
      "protein": 15.5,
      "carbs": 60.0,
      "fats": 12.0,
      "ingredients": [
        "1 cup rolled oats",
        "1/2 cup mixed berries",
        "2 tbsp almonds",
        "1 cup almond milk"
      ]
    },
    // ... 20 more meals (7 days × 3 meals)
  ],
  "generated_at": "2025-11-26T10:00:00Z"
}
```

**Processing Time:** 10-30 seconds (AI generation)

**Errors:**
- 401: Unauthorized
- 429: Rate limit exceeded (OpenAI quota)
- 500: AI service unavailable

---

### GET /api/meals/week

Get current week's meal plan.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**
- `week_start` (optional): Date in YYYY-MM-DD format (defaults to current week)

**Response (200):**
```json
{
  "plan_id": "uuid",
  "week_start": "2025-11-26",
  "meals": [
    // Array of 21 meals
  ]
}
```

**Errors:**
- 401: Unauthorized
- 404: No meal plan found for this week

---

### GET /api/meals/today

Get today's meals.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "date": "2025-11-26",
  "day": "monday",
  "meals": [
    {
      "meal_type": "breakfast",
      "name": "Oatmeal with Berries",
      "calories": 400,
      "protein": 15.5,
      "carbs": 60.0,
      "fats": 12.0
    },
    {
      "meal_type": "lunch",
      // ...
    },
    {
      "meal_type": "dinner",
      // ...
    }
  ],
  "daily_totals": {
    "calories": 2000,
    "protein": 150,
    "carbs": 200,
    "fats": 70
  }
}
```

---

### PUT /api/meals/{meal_id}/swap

Regenerate a single meal with AI.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "day": "monday",
  "meal_type": "breakfast",
  "name": "Scrambled Eggs with Avocado Toast",
  "calories": 420,
  "protein": 20.0,
  "carbs": 35.0,
  "fats": 22.0,
  "ingredients": [
    "3 eggs",
    "1/2 avocado",
    "2 slices whole wheat bread"
  ]
}
```

**Processing Time:** 3-5 seconds

---

## Nutrition AI Service API

### POST /api/ai/chat

Send message to AI nutrition coach.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "message": "What are the best protein sources for muscle building?"
}
```

**Response (200):**
```json
{
  "message_id": "uuid",
  "user_message": "What are the best protein sources for muscle building?",
  "ai_response": "Excellent question! The best protein sources for muscle building include:\n\n1. Lean meats: Chicken breast, turkey, lean beef\n2. Fish: Salmon, tuna, cod\n3. Eggs: Complete protein with all essential amino acids\n4. Dairy: Greek yogurt, cottage cheese\n5. Plant-based: Legumes, tofu, tempeh\n\nAim for 1.6-2.2g protein per kg body weight daily, distributed across meals for optimal muscle protein synthesis.",
  "timestamp": "2025-11-26T10:00:00Z"
}
```

**Rate Limiting:** 10 requests per minute per user

**Errors:**
- 401: Unauthorized
- 429: Rate limit exceeded
- 503: AI service quota exceeded (fallback response provided)

---

### GET /api/ai/history/{user_id}

Get chat history for a user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**
- `limit` (optional): Number of messages (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "total": 25,
  "messages": [
    {
      "id": "uuid",
      "user_message": "What are...",
      "ai_response": "Excellent question...",
      "timestamp": "2025-11-26T10:00:00Z"
    },
    // ... more messages
  ]
}
```

---

### POST /api/ai/analyze-recipe

Extract macros from recipe text (MVP: text only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "recipe_text": "Chicken breast (200g), rice (100g dry), broccoli (150g)"
}
```

**Response (200):**
```json
{
  "recipe_name": "Chicken, Rice and Broccoli",
  "total_calories": 520,
  "macros": {
    "protein": 55.0,
    "carbs": 65.0,
    "fats": 8.0
  },
  "ingredients": [
    {
      "name": "Chicken breast",
      "amount": "200g",
      "calories": 330,
      "protein": 62,
      "carbs": 0,
      "fats": 7
    },
    {
      "name": "White rice",
      "amount": "100g dry",
      "calories": 350,
      "protein": 7,
      "carbs": 77,
      "fats": 1
    },
    {
      "name": "Broccoli",
      "amount": "150g",
      "calories": 50,
      "protein": 4,
      "carbs": 10,
      "fats": 0.5
    }
  ]
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    // Additional error context
  },
  "status_code": 400
}
```

## HTTP Status Codes

- `200` OK - Request succeeded
- `201` Created - Resource created successfully
- `400` Bad Request - Invalid request data
- `401` Unauthorized - Missing or invalid authentication
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `422` Unprocessable Entity - Validation error
- `429` Too Many Requests - Rate limit exceeded
- `500` Internal Server Error - Server error
- `503` Service Unavailable - External service unavailable

## Rate Limiting

- **AI endpoints:** 10 requests/minute per user
- **Other endpoints:** 100 requests/minute per user

Rate limit headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1732618800
```

