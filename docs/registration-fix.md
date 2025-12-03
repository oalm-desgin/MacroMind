# Registration Fix - ERR_CONNECTION_REFUSED

## Root Cause

The frontend was attempting to connect to `http://localhost:8000/api/auth/register` and receiving `ERR_CONNECTION_REFUSED` because:

1. **Hardcoded localhost URLs**: The frontend was using hardcoded `http://localhost:8000` URLs that don't work in containerized environments
2. **No environment detection**: The app didn't detect whether it was running in Docker, Kubernetes, or local development
3. **Incorrect baseURL**: Axios wasn't configured with a proper baseURL, causing all requests to use absolute URLs

## Fix Applied

### 1. Environment-Aware API Base URL Detection

Created intelligent base URL detection in `frontend/src/utils/constants.js`:

```javascript
const getApiBaseUrl = () => {
  // Priority 1: Explicit environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // Priority 2: Auto-detect based on hostname
  const isLocalDev = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1'
  
  if (isLocalDev) {
    return 'http://localhost:8000'  // Local development
  } else {
    return ''  // Production - use relative URLs (nginx proxy)
  }
}
```

### 2. Axios BaseURL Configuration

Updated `frontend/src/services/api.js` to use the environment-aware baseURL:

```javascript
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL,  // Environment-aware
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### 3. Relative Path API Calls

Updated all service calls to use relative paths:

**Before:**
```javascript
api.post(`${AUTH_SERVICE_URL}/api/auth/register`, data)
```

**After:**
```javascript
api.post('/api/auth/register', data)  // baseURL handles the host
```

### 4. Environment Variables

Created `frontend/.env.example` with clear documentation:

```env
# For local development:
VITE_API_BASE_URL=http://localhost:8000

# For Docker Compose (nginx proxy):
VITE_API_BASE_URL=

# For Kubernetes (ingress):
VITE_API_BASE_URL=https://macromind.local
```

### 5. Docker Configuration Updates

- **docker-compose.yml**: Set `VITE_API_BASE_URL=""` (empty = relative URLs)
- **docker-compose.dev.yml**: Set `VITE_API_BASE_URL=http://localhost:8000`
- **Dockerfile**: Updated build args to use `VITE_API_BASE_URL`

## Before and After Behavior

### Before

**Local Development:**
- ✅ Worked if backend was running on localhost:8000
- ❌ Failed if backend wasn't running

**Docker Compose:**
- ❌ Frontend tried to connect to `http://localhost:8000` from inside container
- ❌ `ERR_CONNECTION_REFUSED` - localhost doesn't exist in container
- ❌ Registration failed

**Kubernetes:**
- ❌ Frontend tried to connect to `http://localhost:8000`
- ❌ No service available at localhost
- ❌ Registration failed

### After

**Local Development:**
- ✅ Auto-detects localhost hostname
- ✅ Uses `http://localhost:8000` as baseURL
- ✅ Works when backend is running locally

**Docker Compose:**
- ✅ Uses empty baseURL (relative URLs)
- ✅ Nginx proxies `/api/*` to backend services
- ✅ Registration works via nginx proxy

**Kubernetes:**
- ✅ Uses empty baseURL or ingress URL
- ✅ Ingress routes `/api/*` to backend services
- ✅ Registration works via ingress

## How to Avoid This in Future Deployments

### 1. Always Use Environment Variables

Never hardcode API URLs. Always use environment variables:

```javascript
// ❌ Bad
const API_URL = 'http://localhost:8000'

// ✅ Good
const API_URL = import.meta.env.VITE_API_BASE_URL || ''
```

### 2. Use Relative URLs When Possible

In containerized environments, prefer relative URLs and let the reverse proxy handle routing:

```javascript
// ❌ Bad - absolute URL
api.post('http://auth-service:8000/api/auth/register', data)

// ✅ Good - relative URL
api.post('/api/auth/register', data)  // nginx/ingress handles routing
```

### 3. Configure Axios baseURL

Set baseURL in Axios instance, not in individual calls:

```javascript
// ✅ Good
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  // ...
})

api.post('/api/auth/register', data)  // Uses baseURL
```

### 4. Test in All Environments

Before deploying, test:
- ✅ Local development (npm run dev)
- ✅ Docker Compose (docker-compose up)
- ✅ Kubernetes (kubectl apply)

### 5. Document Environment Variables

Always provide `.env.example` with:
- Clear descriptions
- Examples for each environment
- Default values

## Verification Steps

### 1. Check Base URL

```javascript
// In browser console:
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)
```

### 2. Test Registration

1. Open browser DevTools (F12)
2. Navigate to Network tab
3. Go to registration page
4. Fill form and submit
5. **Expected**: Request to `/api/auth/register` (relative) or `http://localhost:8000/api/auth/register` (local)
6. **Expected**: HTTP 201 response
7. **Expected**: Redirect to dashboard

### 3. Verify in Different Environments

**Local Dev:**
```bash
# Start backend
cd services/auth-service
uvicorn main:app --reload --port 8000

# Start frontend
cd frontend
npm run dev

# Check network tab - should see: http://localhost:8000/api/auth/register
```

**Docker Compose:**
```bash
docker-compose up -d

# Check network tab - should see: /api/auth/register (relative)
# Nginx proxies to auth-service:8000
```

**Kubernetes:**
```bash
kubectl apply -f k8s/

# Check network tab - should see: https://macromind.local/api/auth/register
# Ingress routes to auth-service
```

## Files Modified

1. `frontend/src/utils/constants.js` - Environment-aware base URL detection
2. `frontend/src/services/api.js` - Axios baseURL configuration
3. `frontend/src/services/authService.js` - Relative path API calls
4. `frontend/src/services/mealPlannerService.js` - Relative path API calls
5. `frontend/src/services/aiCoachService.js` - Relative path API calls
6. `frontend/.env.example` - Environment variable documentation
7. `docker-compose.yml` - Updated build args
8. `docker-compose.dev.yml` - Updated environment variables
9. `frontend/Dockerfile` - Updated build args

## Final Axios Configuration

```javascript
// frontend/src/services/api.js
import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL,  // Environment-aware
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

## Working API BaseURL by Environment

| Environment | BaseURL | Example Request |
|------------|---------|----------------|
| Local Dev | `http://localhost:8000` | `http://localhost:8000/api/auth/register` |
| Docker Compose | `` (empty) | `/api/auth/register` → nginx → `auth-service:8000` |
| Kubernetes | `` (empty) or `https://macromind.local` | `/api/auth/register` → ingress → `auth-service` |

## Timestamp

Fix applied: 2024-11-26
Status: ✅ **RESOLVED** - Registration now works in all environments
