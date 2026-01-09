# Sprint 2: Authentication Fixes & Role-Based Dashboards

**Issues:** #30 - Fix All Authentication Issues + Sync FE/BE Login & Registration  
**Issue:** #31 - Role-Based Dashboard Foundation & Basic Staff/User Routing  
**Status:** ✅ Completed  
**Date:** November 2025  
**Team:** Ruhani, Sheehan, Aidan, Neng, Theni

---

## Overview

This document covers the comprehensive fixes and enhancements made to the authentication system and the implementation of role-based dashboards. All authentication issues have been resolved, and the system now properly routes users to appropriate dashboards based on their role (staff or student).

---

## Issues Fixed (Issue #30)

### 1. Navigation Duplicate Login Buttons
**Problem:** Navigation component was showing duplicate "Login" links when user was not authenticated.

**Fix:** Removed the duplicate login link that appeared before the conditional rendering block. Navigation now correctly shows:
- When logged out: "Login" and "Sign Up" links
- When logged in: "Logout" button and "Staff Dashboard" (if staff)

**Files Changed:**
- `frontend/src/components/Navigation.jsx`

### 2. Password Visibility Toggle
**Problem:** Users couldn't see their password while typing, making it difficult to verify input.

**Fix:** Added password visibility toggle buttons to both login and signup forms:
- Eye icon button to toggle password visibility
- Works for both password and confirm password fields
- Accessible with proper ARIA labels

**Files Changed:**
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/LoginPage.css`
- `frontend/src/pages/SignupPage.jsx`
- `frontend/src/pages/SignupPage.css`

### 3. Login Authentication Flow
**Problem:** Login was not properly redirecting users based on their role.

**Fix:** 
- Updated login to check user role from response
- Staff users redirect to `/staff/dashboard`
- Student users redirect to `/student/dashboard`
- Proper error handling with backend error messages displayed

**Files Changed:**
- `frontend/src/pages/LoginPage.jsx`

### 4. Registration Flow
**Problem:** Registration was not properly handling auto-login and role-based routing.

**Fix:**
- Auto-login after successful registration
- Role-based redirect (students to student dashboard, staff to staff dashboard)
- Improved error handling and validation messages

**Files Changed:**
- `frontend/src/pages/SignupPage.jsx`

### 5. Default Staff Account
**Problem:** Default staff account (admin@uwaterloo.ca / admin123) was not being created reliably.

**Fix:**
- Moved account creation to run on every startup (not just in `__main__`)
- Account creation happens after database initialization
- Proper error handling if creation fails

**Files Changed:**
- `src/app.py`

---

## New Features (Issue #31)

### 1. Student Dashboard
**Description:** Created a dedicated dashboard for students to view and interact with lost items.

**Features:**
- Welcome message with user's name
- Display of all available lost items
- Item cards showing item details
- Loading, error, and empty states
- Authentication check with redirect if not logged in
- Automatic redirect to student dashboard if staff tries to access

**Files Created:**
- `frontend/src/pages/StudentDashboardPage.jsx`
- `frontend/src/pages/StudentDashboardPage.css`

**Route:** `/student/dashboard`

### 2. Role-Based Routing
**Description:** Implemented proper routing based on user role after login.

**Flow:**
1. User logs in
2. Backend returns user object with role
3. Frontend checks role:
   - `staff` → redirects to `/staff/dashboard`
   - `student` → redirects to `/student/dashboard`

**Implementation:**
- Login page checks role from response
- Registration auto-login checks role
- Both dashboards verify role and redirect if incorrect

**Files Changed:**
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/SignupPage.jsx`
- `frontend/src/pages/StaffDashboardPage.jsx`
- `frontend/src/pages/StudentDashboardPage.jsx`
- `frontend/src/App.jsx` (added route)

### 3. Enhanced Navigation
**Description:** Navigation now properly updates based on authentication status and role.

**Features:**
- Shows Login/Sign Up when logged out
- Shows Logout and Staff Dashboard (if staff) when logged in
- Updates automatically when user logs in/out
- Works on both desktop and mobile

**Files Changed:**
- `frontend/src/components/Navigation.jsx`

---

## Technical Details

### Password Visibility Toggle Implementation

```jsx
// State for password visibility
const [showPassword, setShowPassword] = useState(false)

// Input with toggle button
<div className="password-input-wrapper">
  <input
    type={showPassword ? 'text' : 'password'}
    // ... other props
  />
  <button
    type="button"
    className="password-toggle"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? '👁️' : '👁️‍🗨️'}
  </button>
</div>
```

### Role-Based Routing Implementation

```jsx
// After successful login
if (response.message === 'Login successful') {
  const userRole = response.user?.role
  if (userRole === 'staff') {
    window.location.href = '/staff/dashboard'
  } else {
    window.location.href = '/student/dashboard'
  }
}
```

### Default Staff Account Creation

```python
def create_default_staff_account():
    """Create default staff account if it doesn't exist."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ? AND role = ?', 
                      ('admin@uwaterloo.ca', 'staff'))
        if not cursor.fetchone():
            admin_hash = hash_password('admin123')
            cursor.execute('''
                INSERT INTO users (email, name, password_hash, role)
                VALUES (?, ?, ?, ?)
            ''', ('admin@uwaterloo.ca', 'Admin User', admin_hash, 'staff'))
            conn.commit()
            print("Default staff account created: admin@uwaterloo.ca / admin123")
        conn.close()
    except Exception as e:
        print(f"Warning: Could not create default staff account: {e}")

# Called on startup after database initialization
create_default_staff_account()
```

---

## User Flows

### Student Login Flow

```
1. Student goes to /login
2. Enters @uwaterloo.ca email and password
3. Clicks "Login"
4. Backend validates credentials
5. Returns user object with role: "student"
6. Frontend redirects to /student/dashboard
7. Student sees welcome message and lost items
```

### Staff Login Flow

```
1. Staff goes to /login
2. Enters admin@uwaterloo.ca / admin123 (or their staff account)
3. Clicks "Login"
4. Backend validates credentials
5. Returns user object with role: "staff"
6. Frontend redirects to /staff/dashboard
7. Staff sees dashboard with form to add items
```

### Registration Flow

```
1. User goes to /signup
2. Fills out form (name, email, password, confirm password)
3. Can toggle password visibility to verify input
4. Clicks "Sign Up"
5. Frontend validates form
6. Backend creates account (defaults to "student" role)
7. Auto-login after registration
8. Redirects to /student/dashboard
```

---

## Testing

### Test Cases

✅ **Login Tests:**
- Staff can login with admin@uwaterloo.ca / admin123
- Students can login with their registered accounts
- Invalid credentials show error message
- Password visibility toggle works
- Role-based redirect works correctly

✅ **Registration Tests:**
- New users can register with @uwaterloo.ca email
- Password validation works (min 6 characters)
- Password confirmation validation works
- Password visibility toggles work for both fields
- Auto-login after registration works
- Redirects to student dashboard

✅ **Navigation Tests:**
- Shows Login/Sign Up when logged out
- Shows Logout when logged in
- Shows Staff Dashboard link only for staff
- No duplicate login buttons
- Updates when user logs in/out

✅ **Dashboard Tests:**
- Staff dashboard accessible only to staff
- Student dashboard accessible to students
- Students redirected if they try to access staff dashboard
- Staff redirected if they try to access student dashboard
- Unauthenticated users redirected to login

---

## File Changes Summary

### Modified Files
- `Project/src/app.py` - Default staff account creation
- `Project/frontend/src/components/Navigation.jsx` - Removed duplicate login, added logout
- `Project/frontend/src/pages/LoginPage.jsx` - Password toggle, role-based redirect
- `Project/frontend/src/pages/LoginPage.css` - Password toggle styles
- `Project/frontend/src/pages/SignupPage.jsx` - Password toggles, role-based redirect
- `Project/frontend/src/pages/SignupPage.css` - Password toggle styles
- `Project/frontend/src/pages/StaffDashboardPage.jsx` - Redirect students to student dashboard
- `Project/frontend/src/App.jsx` - Added student dashboard route

### New Files
- `Project/frontend/src/pages/StudentDashboardPage.jsx` - Student dashboard component
- `Project/frontend/src/pages/StudentDashboardPage.css` - Student dashboard styles
- `Project/docs/sprint2_auth_fixes.md` - This documentation

---

## Default Test Accounts

### Staff Account
- **Email:** admin@uwaterloo.ca
- **Password:** admin123
- **Role:** staff
- **Access:** Staff Dashboard (can add items)

### Student Account
- **Email:** (any @uwaterloo.ca email)
- **Password:** (user-defined, min 6 characters)
- **Role:** student (default for new registrations)
- **Access:** Student Dashboard (can view items)

---

## Acceptance Criteria

### Issue #30 - Authentication Fixes
✅ Login form works for both staff and students  
✅ Registration form works and creates accounts  
✅ Password visibility toggle works on both forms  
✅ No duplicate login buttons in navigation  
✅ Default staff account is created on startup  
✅ Error messages display correctly  
✅ Frontend and backend are properly synced  

### Issue #31 - Role-Based Dashboards
✅ Students see student dashboard after login  
✅ Staff see staff dashboard after login  
✅ Students cannot access staff dashboard  
✅ Staff cannot access student dashboard  
✅ Navigation updates based on role  
✅ Proper routing based on user role  

---

## Next Steps

Future enhancements that can be added:
1. **Item Claiming:** Allow students to claim items from their dashboard
2. **Item Details:** Click item to see full details
3. **Search/Filter:** Add search and filter functionality
4. **Notifications:** Show notifications for new items matching user's lost items
5. **Profile Management:** Allow users to update their profile

---

## Conclusion

All authentication issues have been resolved, and role-based dashboards are fully functional. The system now properly:
- Authenticates users (staff and students)
- Routes users to appropriate dashboards based on role
- Provides password visibility toggles for better UX
- Handles errors gracefully
- Maintains proper navigation state

**Status:** ✅ **COMPLETE**

---

*Document created: November 2025*  
*Last updated: November 2025*  
*Team 15: Ruhani, Sheehan, Aidan, Neng, Theni*

