# Nutrition AI Service

FastAPI-based AI coaching and recipe analysis microservice.

## Features

- Real-time AI nutrition coach chat
- Evidence-based nutrition advice
- Recipe macro analysis (text-based for MVP)
- Chat history tracking
- Rate limiting and quota management

## Tech Stack

- Python 3.11+
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- OpenAI API

## API Endpoints

- `POST /api/ai/chat` - Send message to AI coach, get response
- `GET /api/ai/history/{user_id}` - Get chat history
- `POST /api/ai/analyze-recipe` - Extract macros from recipe text
- `DELETE /api/ai/history/{user_id}` - Clear chat history

## Setup

```bash
cd services/nutrition-ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

## AI Coach Configuration

System prompt configures AI as:
- Professional nutrition coach
- Evidence-based advice provider
- Concise responses (under 150 words)
- Focus on nutrition, meal planning, and fitness goals

## Rate Limiting

- 10 requests per minute per user
- Fallback messages on quota exceeded
- All interactions logged for monitoring

## Database Models

- ChatMessage (id, user_id, message, response, timestamp)

