# 🧬 MacroMind

> **AI-Powered Nutrition & Fitness Command Center**
> A full-stack, intelligent application providing personalized meal planning and real-time coaching using Google Gemini 2.0.

![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/UI-Tailwind%20CSS%20%7C%20Framer-38B2AC?style=for-the-badge&logo=tailwind-css)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.0-8E75B2?style=for-the-badge)

## 📖 Overview

**MacroMind** is an advanced nutrition platform designed to solve the complexity of dietary tracking. Unlike standard calorie counters, MacroMind utilizes Generative AI to create hyper-personalized, nutritionally balanced meal plans instantly.

The application demonstrates a modern **Microservices Architecture** and features a high-fidelity **Glassmorphism UI** with 3D elements, bridging the gap between functional utility and premium user experience.

## ✨ Key Technical Features

### 🎨 **Immersive User Experience**
* **3D Dynamic Backgrounds:** Integrated React Three Fiber for performant, GPU-accelerated mesh gradient backgrounds.
* **Interactive Onboarding:** A step-by-step wizard to capture user biometrics and goals, utilizing Framer Motion for smooth state transitions.
* **Modern UI Architecture:** Component-driven design using Tailwind CSS with a consistent "Dark Glass" aesthetic.

### 🧠 **AI-Powered Intelligence**
* **Generative Meal Planner:** Integrates **Google Gemini 2.0 Flash** to generate 7-day meal plans in real-time.
    * Automatically calculates macros (Protein, Carbs, Fats) for every meal.
    * Adheres to strict dietary constraints (Keto, Vegan, Gluten-Free).
    * **Smart Exclusion Engine:** Allows users to filter out specific disliked ingredients dynamically.
* **Context-Aware AI Coach:** A persistent chat interface that retains user context (goals, weight, history) to provide tailored advice.

### ⚙️ **System Architecture**
* **Microservices Backend:** Decoupled services for better scalability and maintenance:
    * **Auth Service (Port 8000):** Manages Identity, JWT issuance, and User Profiles.
    * **Nutrition Service (Port 8001):** Manages LLM integration, prompt engineering, and heavy logic.
* **Security:** Implements industry-standard JWT (JSON Web Tokens) for stateless authentication and `bcrypt` for password hashing.
* **Persistence:** Leverages PostgreSQL for relational data storage, ensuring data integrity for user profiles and history.

---

## 🛠 Technology Stack

### **Frontend**
* **Core:** React 18, Vite
* **Styling:** Tailwind CSS, clsx
* **Motion:** Framer Motion
* **3D Rendering:** React Three Fiber (Three.js)
* **State:** React Context API

### **Backend**
* **Framework:** FastAPI (Python 3.10+)
* **Server:** Uvicorn (ASGI)
* **Database ORM:** SQLAlchemy
* **Validation:** Pydantic
* **AI SDK:** Google Generative AI (`google-generativeai`)

### **Infrastructure**
* **Database:** PostgreSQL 16
* **Version Control:** Git

---

## 📂 Project Structure

```bash
MacroMind/
├── frontend/                 # React Client
│   ├── src/
│   │   ├── components/       # Reusable UI Components
│   │   ├── pages/            # Core Views (Dashboard, Planner, Coach)
│   │   ├── context/          # Global State (Auth)
│   │   └── services/         # API Integration Layer
│   └── vite.config.js        # Build Configuration
│
├── services/
│   ├── auth-service/         # Service A: Authentication & Users
│   │   ├── main.py           # Entry Point
│   │   ├── models.py         # SQLAlchemy Models
│   │   └── auth.py           # Security Logic
│   │
│   └── nutrition-ai-service/ # Service B: AI & Logic
│       ├── main.py           # Entry Point
│       ├── ai_coach.py       # LLM Integration
│       └── meal_planner.py   # Generation Logic
🚀 Installation & Setup
Prerequisites
Node.js (v18+)

Python (v3.10+)

PostgreSQL (Local installation or Cloud)

Google Gemini API Key

1. Database Configuration
Ensure PostgreSQL is running.

Create a database named macromind.

2. Backend Setup
Auth Service:

Bash

cd services/auth-service
# Configure .env with DATABASE_URL
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
Nutrition AI Service:

Bash

cd services/nutrition-ai-service
# Configure .env with GEMINI_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
3. Frontend Setup
Bash

cd frontend
npm install
npm run dev
Application runs on http://localhost:5174

🛡 License
This project is licensed under the MIT License.

Developed by Omar Almoumen
