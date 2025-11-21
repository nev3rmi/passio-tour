# Authentication Guide - Passio Tour

## Overview

The Passio Tour application uses JWT (JSON Web Token) based authentication to protect sensitive routes and ensure only authorized users can access certain features.

---

## Authentication Flow

1. **User logs in** → Receives JWT token
2. **Token stored** in `localStorage`
3. **Protected routes** check for valid token
4. **Token sent** with API requests via Authorization header
5. **Invalid/expired token** → Redirect to login

---

## Protected Pages (Require Authentication)

These pages require users to be logged in and will automatically redirect to `/login` if not authenticated:

| Page | Route | Purpose |
|------|-------|---------|
| **Dashboard** | `/dashboard` | User's main control panel |
| **Create Tour** | `/tours/create` | Form to create new tours |

---

## Public Pages (No Authentication Required)

These pages are accessible to everyone without logging in:

| Category | Pages |
|----------|-------|
| **Core** | `/` (Homepage), `/tours` (Browse Tours) |
| **Auth** | `/login`, `/register`, `/forgot-password` |
| **Info** | `/about`, `/contact`, `/faq`, `/help` |
| **Content** | `/blog`, `/destinations`, `/press`, `/careers`, `/partners` |
| **Legal** | `/privacy`, `/terms` |

---

## Implementation Details

### useAuth Hook

Located at: `frontend/src/hooks/useAuth.ts`

**Purpose:** Reusable authentication hook that checks user authentication status and optionally enforces authentication requirements.

**Usage:**

```typescript
import { useAuth } from '@/hooks/useAuth'

// For protected pages (requires authentication)
const { user, isLoading, isAuthenticated } = useAuth(true)

// For public pages (optional authentication check)
const { user, isLoading, isAuthenticated } = useAuth(false)
```

**Features:**
- ✅ Checks `localStorage` for auth token
- ✅ Validates token with backend `/auth/me` endpoint
- ✅ Automatically redirects to `/login` if required auth fails
- ✅ Returns loading state for skeleton display
- ✅ Clears invalid tokens from storage

**Return Values:**

```typescript
{
  user: User | null,           // User object if authenticated
  isLoading: boolean,          // True while checking authentication
  isAuthenticated: boolean     // True if user is logged in
}
```

---

## How to Protect a New Page

### Step 1: Import the Hook

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import LayoutWrapper from '@/components/layout/LayoutWrapper'
```

### Step 2: Use the Hook with `requireAuth: true`

```typescript
export default function ProtectedPage() {
  const { user, isLoading } = useAuth(true) // Require authentication

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      </LayoutWrapper>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <LayoutWrapper user={user}>
      {/* Your protected content here */}
    </LayoutWrapper>
  )
}
```

---

## Authentication States

### 1. Loading State
**When:** Checking authentication status
**UI:** Shows skeleton loading components
**Duration:** 1-2 seconds

### 2. Unauthenticated State
**When:** No token or invalid token
**Action:** Automatic redirect to `/login`
**UI:** Returns `null` to prevent flash of content

### 3. Authenticated State
**When:** Valid token and user data retrieved
**UI:** Renders protected content with user info

---

## Token Management

### Storage Location
```javascript
localStorage.getItem('token')    // Get token
localStorage.setItem('token', token)    // Store token
localStorage.removeItem('token')         // Clear token
```

### Token Format
```
Authorization: Bearer <jwt-token>
```

### Token Lifecycle
1. **Issued:** When user logs in successfully
2. **Stored:** In browser's localStorage
3. **Used:** Sent with every API request
4. **Validated:** On protected page load and API calls
5. **Removed:** On logout or when invalid

---

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/v1/auth/login` | POST | User login | No |
| `/api/v1/auth/register` | POST | User registration | No |
| `/api/v1/auth/me` | GET | Get current user | Yes |
| `/api/v1/auth/logout` | POST | User logout | Yes |

### Example: Login Request

```typescript
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})

const data = await response.json()
// data.token contains the JWT token
```

### Example: Authenticated Request

```typescript
const response = await fetch(`${API_URL}/tours`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

---

## Error Handling

### 401 Unauthorized
**Trigger:** Invalid or expired token
**Action:**
- Clear token from localStorage
- Redirect to `/login`
- Display error message

### 403 Forbidden
**Trigger:** Valid token but insufficient permissions
**Action:**
- Display "Access Denied" message
- Log error to console

### Network Error
**Trigger:** No response from server
**Action:**
- Display connection error message
- Keep user on current page

---

## Security Best Practices

### ✅ Implemented
- Token stored in localStorage (HttpOnly cookies preferred for production)
- Automatic token validation on protected routes
- Token sent via Authorization header
- Invalid tokens cleared immediately
- Redirect to login for unauthorized access

### 🔄 Future Enhancements
- [ ] Implement token refresh mechanism
- [ ] Add session timeout warnings
- [ ] Use HttpOnly cookies for production
- [ ] Implement CSRF protection
- [ ] Add rate limiting for auth endpoints
- [ ] Implement 2FA (Two-Factor Authentication)

---

## Testing Authentication

### Test Protected Route Access

1. **Without Login:**
   ```
   Navigate to: http://localhost:3000/dashboard
   Expected: Redirects to /login
   ```

2. **Create Tour Without Login:**
   ```
   Navigate to: http://localhost:3000/tours/create
   Expected: Shows skeleton, then redirects to /login
   ```

3. **With Valid Login:**
   ```
   1. Login at /login
   2. Navigate to /dashboard
   Expected: Shows dashboard with user info
   ```

---

## Troubleshooting

### Issue: Redirect Loop
**Cause:** Token exists but is invalid
**Solution:** Clear localStorage and login again
```javascript
localStorage.clear()
```

### Issue: "Auth guard not working"
**Cause:** Page not using `useAuth(true)`
**Solution:** Add authentication hook to page component

### Issue: Token expired
**Cause:** Token has exceeded its validity period
**Solution:** Implement token refresh or re-login

---

## User Object Structure

```typescript
interface User {
  id: string
  name: string
  email: string
  // Additional fields as needed
}
```

---

## Related Files

- **Hook:** `frontend/src/hooks/useAuth.ts`
- **Auth Service:** `frontend/src/services/authService.ts`
- **Auth Store:** `frontend/src/store/authStore.ts`
- **API Client:** `frontend/src/lib/api-client.ts`
- **Protected Pages:**
  - `frontend/src/app/dashboard/page.tsx`
  - `frontend/src/app/tours/create/page.tsx`

---

## Support

For issues or questions about authentication:
1. Check browser console for errors
2. Verify token in localStorage
3. Check API endpoint responses
4. Review this documentation

**Last Updated:** 2025-11-21
