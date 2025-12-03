# MacroMind Frontend

React-based frontend application for the MacroMind AI-powered nutrition platform.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Recharts** - Data visualization
- **Lucide React** - Icon library

## Features Implemented (Phase 3A)

### Screens
- ✅ **S-001: Authentication** (Login + Register with validation)
- ✅ **S-002: Dashboard** (Macros, progress chart, today's meals, goal card)
- ✅ **S-005: AI Coach Chat** (Real-time AI nutrition coaching)

### Core Features
- ✅ JWT authentication with Axios interceptors
- ✅ Global AuthContext for state management
- ✅ Protected routes
- ✅ Dark theme (#0A0A0A background, #121212 cards, #4ADE80 accent)
- ✅ Responsive layout
- ✅ Loading states and error handling
- ✅ API integration with all backend services

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ProtectedRoute.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── ErrorMessage.jsx
│   │   └── Navbar.jsx
│   ├── pages/           # Screen components
│   │   ├── Auth/        # Login and Register
│   │   ├── Dashboard/   # Dashboard and subcomponents
│   │   └── AICoach/     # AI Chat interface
│   ├── services/        # API service layer
│   │   ├── api.js       # Axios instance with interceptors
│   │   ├── authService.js
│   │   ├── mealPlannerService.js
│   │   └── aiCoachService.js
│   ├── context/         # React context providers
│   │   └── AuthContext.jsx
│   ├── hooks/           # Custom React hooks
│   │   └── useAuth.js
│   ├── utils/           # Helper functions and constants
│   │   └── constants.js
│   ├── App.jsx          # Main app with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your backend service URLs
# (Default URLs point to localhost:8000, 8001, 8002)
```

### Development

```bash
# Start development server
npm run dev

# Access at http://localhost:3000
```

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_AUTH_SERVICE_URL=http://localhost:8000
VITE_MEAL_PLANNER_SERVICE_URL=http://localhost:8001
VITE_NUTRITION_AI_SERVICE_URL=http://localhost:8002
```

## API Integration

### Authentication Flow
1. User logs in via `/auth`
2. JWT tokens stored in localStorage
3. Axios interceptor adds token to all requests
4. Token validated on protected routes
5. Auto-redirect to `/auth` on 401

### Services Integrated
- **Auth Service** (port 8000) - User authentication and profiles
- **Meal Planner Service** (port 8001) - Today's meals and macro data
- **Nutrition AI Service** (port 8002) - AI coach chat

## Theme Colors

```
Background:     #0A0A0A
Card:           #121212
Primary:        #4ADE80 (Green)
Secondary:      #22C55E (Darker Green)
Text Primary:   #F8FAFC (White)
Text Secondary: #94A3B8 (Gray)
Border:         #1F2933 (Dark Gray)
```

## Available Screens

### Authentication (`/auth`)
- Login with email/password
- Register with fitness goals and dietary preferences
- Password strength validation
- Error handling with user feedback

### Dashboard (`/dashboard`)
- Daily macro summary (calories, protein, carbs, fats)
- Weekly progress chart with Recharts
- Today's meal list with details
- Fitness goal card with adherence tracking
- Responsive grid layout

### AI Coach (`/ai-coach`)
- Real-time chat with AI nutrition coach
- Message history with pagination
- Typing indicators
- Auto-scroll to new messages
- Error handling with fallback messages

## Components

### Reusable Components
- **ProtectedRoute** - Wraps protected routes, redirects if not authenticated
- **LoadingSpinner** - Customizable loading indicator
- **ErrorMessage** - Error display with retry option
- **Navbar** - Navigation bar with active state indicators

### Page-Specific Components
- **Auth Forms** - LoginForm, RegisterForm with validation
- **Dashboard Widgets** - MacroSummary, WeeklyProgressChart, TodaysMeals, GoalCard
- **Chat Components** - MessageList, MessageBubble, ChatInput, TypingIndicator

## Features

### Authentication
- JWT token management
- Automatic token refresh (placeholder)
- Protected route guards
- Persistent login state

### Dashboard
- Real-time macro tracking
- Interactive progress charts
- Meal display with icons
- Goal visualization

### AI Coach
- Natural language chat interface
- Conversation history
- Typing animations
- Error recovery

## Next Steps (Future Phases)

- **Phase 3B:** Meal Planner UI (S-003)
- **Phase 3C:** Recipe Upload UI (S-006)
- **Phase 3D:** Analytics UI (S-007)
- **Phase 4:** Docker containerization
- **Phase 5:** Kubernetes deployment

## Development Notes

- Uses Vite for fast HMR and builds
- TailwindCSS for utility-first styling
- Axios interceptors handle auth globally
- Context API for state management (lightweight, no Redux needed for MVP)
- React Router v6 for modern routing

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Proprietary - Portfolio Project
