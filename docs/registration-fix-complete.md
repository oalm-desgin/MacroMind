# User Registration End-to-End Fix

## Root Cause Analysis

### Issue 1: Backend Not Running
- **Problem**: Auth service was not running on port 8000
- **Evidence**: `ERR_CONNECTION_REFUSED` when frontend tried to call `/api/auth/register`
- **Impact**: Registration requests failed before reaching the backend

### Issue 2: Registration Endpoint Didn't Return Tokens
- **Problem**: `/api/auth/register` returned `UserRegisterResponse` (id, email, message) but no JWT tokens
- **Impact**: Frontend had to make a second API call to login after registration
- **UX Issue**: Two network requests instead of one, potential race conditions

### Issue 3: Frontend Registration Flow
- **Problem**: `AuthContext.register()` called `authService.register()` then `login()`, but `authService.register()` didn't handle tokens
- **Impact**: Even if backend returned tokens, frontend wouldn't store them properly

## Fixes Applied

### Fix 1: Backend Registration Endpoint (`services/auth-service/main.py`)

**Changed**:
- Response model from `UserRegisterResponse` to `TokenResponse`
- Endpoint now returns JWT tokens directly after registration
- Automatic login after successful registration

**Before**:
```python
return UserRegisterResponse(
    id=str(new_user.id),
    email=new_user.email,
    message="User registered successfully"
)
```

**After**:
```python
# Create tokens for automatic login
token_data = {
    "sub": str(new_user.id),
    "email": new_user.email
}

access_token = create_access_token(token_data)
refresh_token = create_refresh_token(token_data)

return TokenResponse(
    access_token=access_token,
    refresh_token=refresh_token,
    token_type="bearer",
    expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
)
```

### Fix 2: Frontend Auth Service (`frontend/src/services/authService.js`)

**Changed**:
- `register()` now handles tokens returned from backend
- Stores tokens in localStorage
- Fetches user profile automatically
- Returns user object ready for AuthContext

**Before**:
```javascript
register: async (email, password, fitnessGoal, dietaryPreference, dailyCalories) => {
  const response = await api.post('/api/auth/register', {...})
  return response.data  // Just returns id, email, message
}
```

**After**:
```javascript
register: async (email, password, fitnessGoal, dietaryPreference, dailyCalories) => {
  const response = await api.post('/api/auth/register', {...})
  
  // Backend now returns tokens directly
  const { access_token, refresh_token } = response.data
  
  // Store tokens
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token)
  
  // Fetch user profile
  const user = await authService.getProfile()
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  
  return user
}
```

### Fix 3: AuthContext Registration (`frontend/src/context/AuthContext.jsx`)

**Changed**:
- Removed redundant `login()` call after registration
- `authService.register()` now handles everything
- Directly sets user state from registration response

**Before**:
```javascript
const register = async (...) => {
  await authService.register(...)
  return await login(email, password)  // Extra API call
}
```

**After**:
```javascript
const register = async (...) => {
  const user = await authService.register(...)  // Handles tokens + profile
  setUser(user)
  setIsGuest(false)
  return user
}
```

## Files Modified

1. **`services/auth-service/main.py`**
   - Changed registration endpoint to return `TokenResponse` instead of `UserRegisterResponse`
   - Added token generation after user creation
   - Automatic login after registration

2. **`frontend/src/services/authService.js`**
   - Updated `register()` to handle tokens from backend
   - Added token storage
   - Added automatic profile fetch

3. **`frontend/src/context/AuthContext.jsx`**
   - Simplified registration flow
   - Removed redundant login call
   - Direct user state update

## Registration Flow (After Fix)

1. **User fills registration form** → Frontend validates
2. **Frontend calls** `POST /api/auth/register` with:
   - email
   - password
   - fitness_goal
   - dietary_preference
   - daily_calories

3. **Backend**:
   - Validates email uniqueness
   - Creates user with hashed password
   - Creates user profile
   - Generates JWT tokens
   - Returns `TokenResponse` with tokens

4. **Frontend**:
   - Receives tokens
   - Stores in localStorage
   - Fetches user profile
   - Updates AuthContext
   - Redirects to dashboard

5. **Dashboard**:
   - User is logged in
   - All features unlocked
   - Quick Actions clickable

## Verification Checklist

### Backend Requirements
- [ ] Auth service running on port 8000
- [ ] Database connected and accessible
- [ ] `/api/auth/register` endpoint returns tokens
- [ ] Password hashing works
- [ ] Email uniqueness enforced

### Frontend Requirements
- [ ] API base URL correct (`http://localhost:8000`)
- [ ] Registration form sends correct payload
- [ ] Tokens stored in localStorage
- [ ] User profile fetched after registration
- [ ] AuthContext updated
- [ ] Redirect to dashboard works

### End-to-End Test
- [ ] User can register successfully
- [ ] Token is returned and stored
- [ ] User is logged in automatically
- [ ] Dashboard unlocks
- [ ] Quick Actions become clickable
- [ ] No console errors
- [ ] No network errors

## Starting the Backend

To start the auth service:

### Option 1: Docker Compose
```bash
docker-compose up auth-service
```

### Option 2: Direct Python
```bash
cd services/auth-service
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 3: Full Stack
```bash
docker-compose up
```

## Expected Network Flow

### Successful Registration
```
POST /api/auth/register
Status: 201 Created
Response: {
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800
}

GET /api/auth/me
Status: 200 OK
Response: {
  "id": "...",
  "email": "user@example.com",
  "profile": {...}
}
```

### Error Cases
- **400 Bad Request**: Email already registered
- **422 Unprocessable Entity**: Validation error (password too weak, invalid email, etc.)
- **500 Internal Server Error**: Database error or server crash

## Next Steps

1. **Start the backend service**
2. **Test registration** with a new email
3. **Verify** tokens are stored
4. **Confirm** dashboard unlocks
5. **Test** all features are accessible

