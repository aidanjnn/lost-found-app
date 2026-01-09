# Sprint 2, Part 1: Create User Sign-Up and Login System

**Sprint:** 2, Part 1  
**Issue:** #27 - Create User Sign-Up and Login System  
**Status:** ✅ Completed  
**Date:** November 2025  
**Team:** Ruhani, Sheehan, Aidan, Neng, Theni

---

## Overview

This sprint implements a user sign-up and login system for the UW Lost-and-Found web application. The system supports students and staff only (visitors excluded), requiring @uwaterloo.ca email addresses for registration and authentication. Since WatIAM SSO is restricted, users sign up and log in with their WatIAM username (uwaterloo.ca email) and password.

---

## Objectives Completed

✅ **Define authentication requirements for student and staff roles**
- Students: Sign up and login with @uwaterloo.ca email and password
- Staff: Sign up and login with @uwaterloo.ca email and password (elevated privileges)
- Visitors: Removed from system (no longer supported)

✅ **Implement email-based authentication using uwaterloo.ca email addresses**
- Email validation function ensures only @uwaterloo.ca emails are accepted
- Registration and login endpoints validate email domain

✅ **Build backend structure for user registration, login, and session management**
- Updated database schema (removed visitor role)
- Registration endpoint with email validation
- Login endpoint for students and staff
- Session management with Flask-Session

✅ **Develop sign-up and login workflows**
- User registration with @uwaterloo.ca email requirement
- Password-based login for both students and staff
- Role assignment (defaults to student, staff can be explicitly set)

✅ **Implement role-based access control**
- Role-based decorators maintained
- Student and staff roles persist across sessions

---

## Implementation Details

### Changes from Sprint 1

**Removed:**
- Visitor role support
- WatIAM SSO stub implementation
- Visitor-specific registration flow

**Added:**
- @uwaterloo.ca email validation
- Email domain restriction for registration and login
- Simplified login flow (email/password for all users)

**Updated:**
- Database schema: Removed 'visitor' from role CHECK constraint
- Registration endpoint: Only accepts @uwaterloo.ca emails
- Login endpoint: Unified flow for students and staff
- Password requirement: All users now require passwords (no NULL passwords)

### Database Schema Updates

```sql
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,  -- Now required for all users
    role TEXT NOT NULL CHECK(role IN ('student', 'staff')),  -- Visitor removed
    watcard_number TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
)
```

**Key Changes:**
- `password_hash` is now NOT NULL (all users must have passwords)
- Role constraint updated to only allow 'student' and 'staff'
- Removed `driver_license` field (no longer needed without visitors)

### Email Validation

New function `validate_uwaterloo_email()` ensures only @uwaterloo.ca emails are accepted:

```python
def validate_uwaterloo_email(email):
    """Validate that email is a @uwaterloo.ca email address."""
    if not email or not isinstance(email, str):
        return False
    return email.lower().endswith('@uwaterloo.ca') and '@' in email and email.count('@') == 1
```

**Validation Rules:**
- Must end with `@uwaterloo.ca` (case-insensitive)
- Must contain exactly one `@` symbol
- Must be a valid string

---

## API Endpoints

### POST `/auth/register`

User registration endpoint. Only accepts @uwaterloo.ca email addresses.

**Request Body:**
```json
{
  "email": "user@uwaterloo.ca",
  "password": "password123",
  "name": "John Doe",
  "role": "student"  // Optional, defaults to "student"
}
```

**Response (201):**
```json
{
  "message": "Account created successfully",
  "user": {
    "user_id": 1,
    "email": "user@uwaterloo.ca",
    "name": "John Doe",
    "role": "student"
  }
}
```

**Error Responses:**
- `400`: Missing fields, invalid email domain, weak password, invalid role
- `409`: Email already registered

**Validation:**
- Email must be @uwaterloo.ca
- Password must be at least 8 characters
- Role must be "student" or "staff" (defaults to "student")

### POST `/auth/login`

Login endpoint for students and staff. Requires @uwaterloo.ca email and password.

**Request Body:**
```json
{
  "email": "user@uwaterloo.ca",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "user_id": 1,
    "email": "user@uwaterloo.ca",
    "name": "John Doe",
    "role": "student"
  }
}
```

**Error Responses:**
- `400`: Missing fields, invalid email domain
- `401`: Invalid credentials

**Validation:**
- Email must be @uwaterloo.ca
- Email and password must match registered account

### POST `/auth/logout`

Logout endpoint. Clears the user's session.

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Error Response:**
- `401`: Not authenticated

### GET `/auth/verify-session`

Verify if the current session is valid.

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "user_id": 1,
    "email": "user@uwaterloo.ca",
    "name": "John Doe",
    "role": "student"
  }
}
```

**Error Response:**
- `401`: Session invalid or expired

### GET `/auth/me`

Get current authenticated user information.

**Response (200):**
```json
{
  "user_id": 1,
  "email": "user@uwaterloo.ca",
  "name": "John Doe",
  "role": "student"
}
```

**Error Response:**
- `401`: Not authenticated

---

## Authentication Flow Diagrams

### Student Registration Flow

```
┌─────────┐
│ Student │
└────┬────┘
     │
     │ 1. POST /auth/register
     │    {email: "student@uwaterloo.ca", password, name}
     ▼
┌─────────────────┐
│   Flask App     │
│  /auth/register │
└────┬────────────┘
     │
     │ 2. Validate @uwaterloo.ca email
     │    - Check email ends with @uwaterloo.ca
     │    - Validate password (min 8 chars)
     ▼
┌─────────────────┐
│ Email Validation│
│ (uwaterloo.ca)  │
└────┬────────────┘
     │
     │ 3. Check if email exists
     ▼
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└────┬────────────┘
     │
     │ 4. Hash password (bcrypt)
     │    Create account with role="student"
     ▼
┌─────────────────┐
│  Account Created│
└────┬────────────┘
     │
     │ 5. Return user info
     ▼
┌─────────┐
│ Student │ (Account Created)
└─────────┘
```

### Staff Registration Flow

```
┌────────┐
│ Staff  │
└────┬───┘
     │
     │ 1. POST /auth/register
     │    {email: "staff@uwaterloo.ca", password, name, role: "staff"}
     ▼
┌─────────────────┐
│   Flask App     │
│  /auth/register │
└────┬────────────┘
     │
     │ 2. Validate @uwaterloo.ca email
     │    Validate role="staff"
     ▼
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└────┬────────────┘
     │
     │ 3. Hash password
     │    Create account with role="staff"
     ▼
┌────────┐
│ Staff  │ (Account Created with Elevated Privileges)
└────────┘
```

### Login Flow (Students and Staff)

```
┌─────────┐
│  User   │
│(Student │
│or Staff)│
└────┬────┘
     │
     │ 1. POST /auth/login
     │    {email: "user@uwaterloo.ca", password}
     ▼
┌─────────────────┐
│   Flask App     │
│  /auth/login    │
└────┬────────────┘
     │
     │ 2. Validate @uwaterloo.ca email
     ▼
┌─────────────────┐
│ Email Validation│
└────┬────────────┘
     │
     │ 3. Look up user in database
     ▼
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└────┬────────────┘
     │
     │ 4. Verify password (bcrypt)
     ▼
┌─────────────────┐
│ Password Verify │
└────┬────────────┘
     │
     │ 5. Create session
     │    Set role in session
     ▼
┌─────────┐
│  User   │ (Authenticated, Role Persists)
└─────────┘
```

---

## Role Assignment

### Default Behavior

- **Registration without role:** Defaults to `"student"`
- **Registration with role="staff":** Creates staff account with elevated privileges

### Role Persistence

- Roles are stored in the database and persist across sessions
- Session stores role information for quick access
- Role-based decorators (`@require_role('staff')`) enforce access control

---

## Security Features

### Email Domain Restriction

- Only @uwaterloo.ca emails are accepted
- Validation occurs at both registration and login
- Prevents unauthorized users from accessing the system

### Password Security

- **Hashing:** bcrypt with automatic salt generation
- **Minimum Length:** 8 characters
- **Storage:** Passwords never stored in plain text

### Session Security

- **Signed Sessions:** All sessions are cryptographically signed
- **Session Expiration:** Automatic expiration after 24 hours
- **Role Persistence:** Roles stored in session for access control

---

## Error Handling

### HTTP Status Codes

- **200:** Success
- **201:** Created (registration)
- **400:** Bad Request (validation errors, missing fields, invalid email domain)
- **401:** Unauthorized (invalid credentials, no session)
- **403:** Forbidden (insufficient privileges)
- **409:** Conflict (duplicate email)

### Error Response Format

```json
{
  "error": "Descriptive error message"
}
```

### Common Error Messages

- `"Only @uwaterloo.ca email addresses are accepted"`
- `"Missing required fields: email, password, and name"`
- `"Password must be at least 8 characters"`
- `"Email already registered"`
- `"Invalid email or password"`
- `"Invalid role. Must be 'student' or 'staff'"`

---

## Testing

### Test Coverage

Comprehensive test suite in `tests/test_auth_sprint2.py` covering:

✅ **Email Validation Tests**
- Valid @uwaterloo.ca emails accepted
- Invalid email domains rejected
- Edge cases (empty, None, malformed)

✅ **Registration Tests**
- Student registration success
- Staff registration success
- Default role assignment (student)
- Email domain validation
- Duplicate email handling
- Weak password validation
- Invalid role rejection

✅ **Login Tests**
- Student login success
- Staff login success
- Email domain validation
- Invalid credentials handling
- Missing fields handling

✅ **Session Management Tests**
- Session verification
- Get current user
- Logout functionality
- Role persistence

✅ **Error Handling Tests**
- Missing request body
- Invalid email domains
- Invalid roles

### Running Tests

```bash
# Install dependencies
pip install -r requirements.txt
pip install pytest

# Run Sprint 2 tests
pytest tests/test_auth_sprint2.py -v
```

---

## Migration from Sprint 1

### Breaking Changes

1. **Visitor Role Removed:** Existing visitor accounts will need to be migrated or removed
2. **Email Domain Restriction:** Non-@uwaterloo.ca emails are no longer accepted
3. **Password Required:** All users must have passwords (no NULL passwords)
4. **Login Flow Changed:** No longer uses role parameter, unified email/password flow

### Migration Steps (if needed)

1. **Update Existing Database:**
   ```sql
   -- Remove visitor accounts or migrate them
   DELETE FROM users WHERE role = 'visitor';
   
   -- Update schema constraint
   -- (Handled automatically by new init_db())
   ```

2. **Update Frontend:**
   - Remove visitor registration UI
   - Update login form to remove role selection
   - Add email domain validation in frontend
   - Update API calls to match new endpoints

---

## Default Test Account

For development and testing, a default staff account is created:

- **Email:** admin@uwaterloo.ca
- **Password:** admin123
- **Role:** staff

**⚠️ IMPORTANT:** Change this password in production!

---

## Acceptance Criteria Status

✅ **Students can sign up using their @uwaterloo.ca email address**
- Registration endpoint accepts @uwaterloo.ca emails
- Email validation enforces domain requirement
- Default role assignment works correctly

✅ **Staff can sign up using their @uwaterloo.ca email address**
- Registration with role="staff" creates staff account
- Staff accounts have elevated privileges

✅ **Only @uwaterloo.ca email addresses are accepted for registration**
- Email validation function enforces domain
- Non-uwaterloo emails are rejected with clear error message

✅ **Users can log in with their registered email and password**
- Login endpoint validates email domain
- Password verification works correctly
- Session is created upon successful login

✅ **Roles (student/staff) are correctly assigned and persist**
- Roles stored in database
- Roles persist across sessions
- Role-based access control works

✅ **Roles persist across authenticated sessions**
- Session stores role information
- Role available in all authenticated requests
- 24-hour session lifetime

✅ **Invalid email domains are rejected during registration**
- Email validation rejects non-@uwaterloo.ca emails
- Clear error messages provided
- Validation occurs before database operations

---

## Deliverables Completed

✅ **Authentication flow diagram (students and staff)**
- Student registration flow diagram
- Staff registration flow diagram
- Login flow diagram (unified for students and staff)

✅ **Working sign-up and login API endpoints**
- `/auth/register` - User registration with email validation
- `/auth/login` - Unified login for students and staff
- `/auth/logout` - Session termination
- `/auth/verify-session` - Session validation
- `/auth/me` - Current user info

✅ **Email validation for uwaterloo.ca addresses**
- `validate_uwaterloo_email()` function
- Validation at registration and login
- Clear error messages for invalid domains

✅ **Session validation and role-permission logic**
- Session management with Flask-Session
- Role-based decorators maintained
- Role persistence across requests

✅ **Basic error handling**
- Invalid email domains
- Missing fields
- Invalid credentials
- Duplicate emails
- Weak passwords
- Invalid roles

✅ **Documentation for setup and use of authentication routes**
- This comprehensive documentation file
- API endpoint documentation
- Authentication flow diagrams
- Testing instructions
- Migration guide

---

## File Changes

### Modified Files

- `Project/src/app.py` - Updated authentication system
  - Removed visitor support
  - Added email validation
  - Updated registration endpoint
  - Updated login endpoint
  - Updated database schema

### New Files

- `Project/tests/test_auth_sprint2.py` - New test suite for Sprint 2
- `Project/docs/sprint2_user_system.md` - This documentation

---

## Next Steps (Future Sprints)

1. **Frontend Integration:** Connect frontend login/signup forms to new endpoints
2. **Email Verification:** Add email verification for new accounts
3. **Password Reset:** Implement password reset functionality
4. **Admin Panel:** Create admin interface for role management
5. **Account Management:** User profile editing, password change

---

## Conclusion

Sprint 2, Part 1 successfully implements a user sign-up and login system for students and staff using @uwaterloo.ca email addresses. All objectives have been met, all acceptance criteria satisfied, and comprehensive documentation provided. The system is ready for integration with the frontend and subsequent sprints.

**Status:** ✅ **COMPLETE**

---

*Document created: November 2025*  
*Last updated: November 2025*  
*Team 15: Ruhani, Sheehan, Aidan, Neng, Theni*

