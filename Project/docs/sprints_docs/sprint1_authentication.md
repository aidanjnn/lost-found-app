# Sprint 1: User Authentication and Login Process

**Sprint:** 1  
**Issue:** #22 - Create User Authentication and Login Process  
**Status:** ✅ Completed  
**Date:** November 2025  
**Team:** Ruhani, Sheehan, Aidan, Neng, Theni

---

## Overview

This sprint implements the initial authentication flow for the UW Lost-and-Found web application. The system supports three distinct user roles with different authentication methods:

- **Students:** WatIAM Single Sign-On (SSO) - stub implementation
- **Visitors:** Email-based registration and login with password
- **Staff:** Login with elevated privileges using email/password

---

## Objectives Completed

✅ **Define authentication requirements for all user roles**
- Students: WatIAM SSO integration (stub for development)
- Visitors: Email + password authentication with account creation
- Staff: Email + password with elevated privileges

✅ **Select authentication methods**
- Students: WatIAM SSO (OAuth stub - ready for production integration)
- Visitors: Email-based registration and login
- Staff: Password-based login with role-based access control

✅ **Build backend structure for sessions and role-based access control**
- Flask-Session for session management
- SQLite database for user storage
- Role-based decorators for endpoint protection
- Session persistence across requests

✅ **Develop basic login/logout workflow**
- `/auth/login` endpoint supporting all three roles
- `/auth/logout` endpoint with session clearing
- `/auth/verify-session` for session validation
- `/auth/register` for visitor account creation

---

## Implementation Details

### Technology Stack

- **Backend Framework:** Flask 3.1.2
- **Session Management:** Flask-Session 0.8.0
- **Password Hashing:** bcrypt 4.2.0
- **Database:** SQLite3 (can be migrated to PostgreSQL for production)
- **Security:** Werkzeug for session signing

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT,  -- NULL for students using WatIAM
    role TEXT NOT NULL CHECK(role IN ('student', 'visitor', 'staff')),
    watcard_number TEXT,
    driver_license TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
)
```

#### Sessions Table
```sql
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
)
```

### API Endpoints

#### POST `/auth/login`
Authenticates users based on their role.

**Request Body Examples:**

**Student:**
```json
{
  "role": "student",
  "watiam_id": "student@uwaterloo.ca"
}
```

**Visitor:**
```json
{
  "role": "visitor",
  "email": "visitor@example.com",
  "password": "password123"
}
```

**Staff:**
```json
{
  "role": "staff",
  "email": "staff@uwaterloo.ca",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "visitor"
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `401`: Invalid credentials
- `400`: Invalid role

#### POST `/auth/register`
Creates a new visitor account.

**Request Body:**
```json
{
  "email": "visitor@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "Account created successfully",
  "user": {
    "user_id": 1,
    "email": "visitor@example.com",
    "name": "John Doe",
    "role": "visitor"
  }
}
```

**Error Responses:**
- `400`: Missing fields, invalid email format, weak password
- `409`: Email already registered

#### POST `/auth/logout`
Clears the current user's session.

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Error Response:**
- `401`: Not authenticated

#### GET `/auth/verify-session`
Verifies if the current session is valid.

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "visitor"
  }
}
```

**Error Response:**
- `401`: Session invalid or expired

#### GET `/auth/me`
Returns information about the currently authenticated user.

**Response (200):**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "role": "visitor"
}
```

**Error Response:**
- `401`: Not authenticated

---

## Authentication Flow Diagrams

### Student Authentication Flow (WatIAM SSO Stub)

```
┌─────────┐
│ Student │
└────┬────┘
     │
     │ 1. POST /auth/login
     │    {role: "student", watiam_id: "student@uwaterloo.ca"}
     ▼
┌─────────────────┐
│   Flask App     │
│  /auth/login    │
└────┬────────────┘
     │
     │ 2. Check if student exists in DB
     ▼
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└────┬────────────┘
     │
     │ 3a. If exists: Retrieve user
     │ 3b. If not: Create new student account
     ▼
┌─────────────────┐
│  Create Session │
│  Set role=student│
└────┬────────────┘
     │
     │ 4. Return user info + session cookie
     ▼
┌─────────┐
│ Student │ (Authenticated)
└─────────┘

Note: In production, this would integrate with WatIAM OAuth:
- Redirect to WatIAM login page
- Receive OAuth callback with user info
- Create/update student account
- Establish session
```

### Visitor Authentication Flow

```
┌─────────┐
│ Visitor │
└────┬────┘
     │
     │ 1. POST /auth/register
     │    {email, password, name}
     ▼
┌─────────────────┐
│   Flask App      │
│  /auth/register  │
└────┬────────────┘
     │
     │ 2. Validate input
     │    - Email format
     │    - Password strength (min 8 chars)
     │    - Check for duplicate email
     ▼
┌─────────────────┐
│   Hash Password │
│   (bcrypt)      │
└────┬────────────┘
     │
     │ 3. Store in database
     ▼
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└────┬────────────┘
     │
     │ 4. Return success
     ▼
┌─────────┐
│ Visitor │ (Account Created)
└────┬────┘
     │
     │ 5. POST /auth/login
     │    {role: "visitor", email, password}
     ▼
┌─────────────────┐
│   Flask App     │
│  /auth/login    │
└────┬────────────┘
     │
     │ 6. Verify password
     ▼
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└────┬────────────┘
     │
     │ 7. Create session
     ▼
┌─────────┐
│ Visitor │ (Authenticated)
└─────────┘
```

### Staff Authentication Flow

```
┌────────┐
│ Staff  │
└────┬───┘
     │
     │ 1. POST /auth/login
     │    {role: "staff", email, password}
     ▼
┌─────────────────┐
│   Flask App     │
│  /auth/login    │
└────┬────────────┘
     │
     │ 2. Verify credentials
     │    - Check email exists
     │    - Verify password hash
     │    - Confirm role is "staff"
     ▼
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└────┬────────────┘
     │
     │ 3. Create session with elevated privileges
     ▼
┌────────┐
│ Staff  │ (Authenticated with elevated privileges)
└────────┘

Note: Staff accounts are created by administrators,
not through public registration.
```

---

## Session Management

### Session Configuration

- **Type:** File-based sessions (Flask-Session)
- **Lifetime:** 24 hours
- **Security:** Signed sessions using SECRET_KEY
- **Persistence:** Sessions persist across server restarts

### Session Data Structure

```python
session = {
    'user_id': 1,
    'email': 'user@example.com',
    'name': 'User Name',
    'role': 'visitor'  # or 'student' or 'staff'
}
```

### Role-Based Access Control

The application includes decorators for protecting endpoints:

```python
@require_auth  # Requires any authenticated user
def protected_endpoint():
    pass

@require_role('staff')  # Requires staff role
def admin_endpoint():
    pass

@require_role('student', 'visitor')  # Requires student OR visitor
def user_endpoint():
    pass
```

---

## Security Features

### Password Security
- **Hashing Algorithm:** bcrypt with automatic salt generation
- **Minimum Length:** 8 characters
- **Storage:** Passwords are never stored in plain text

### Session Security
- **Signed Sessions:** All sessions are cryptographically signed
- **Session Expiration:** Automatic expiration after 24 hours
- **Secure Cookies:** Sessions use secure cookie flags in production

### Input Validation
- **Email Format:** Basic email validation
- **Required Fields:** All required fields are validated
- **SQL Injection Prevention:** Parameterized queries
- **Role Validation:** Roles are checked against allowed values

---

## Error Handling

The API provides comprehensive error handling:

### HTTP Status Codes
- **200:** Success
- **201:** Created (registration)
- **400:** Bad Request (validation errors, missing fields)
- **401:** Unauthorized (invalid credentials, no session)
- **403:** Forbidden (insufficient privileges)
- **409:** Conflict (duplicate email)

### Error Response Format
```json
{
  "error": "Descriptive error message"
}
```

---

## Testing

### Test Coverage

Comprehensive test suite in `tests/test_auth.py` covering:

✅ **Registration Tests**
- Successful visitor registration
- Missing fields validation
- Duplicate email handling
- Weak password validation

✅ **Login Tests**
- Student login (WatIAM stub)
- Visitor login
- Staff login
- Invalid credentials handling
- Missing fields handling

✅ **Session Management Tests**
- Session verification
- Get current user
- Logout functionality
- Unauthorized access handling

✅ **Error Handling Tests**
- Invalid role handling
- Missing role field
- Health check endpoint

### Running Tests

```bash
# Install dependencies
pip install -r requirements.txt
pip install pytest

# Run tests
pytest tests/test_auth.py -v
```

---

## Default Test Accounts

For development and testing, a default staff account is created:

- **Email:** admin@uwaterloo.ca
- **Password:** admin123
- **Role:** staff

**⚠️ IMPORTANT:** Change this password in production!

---

## WatIAM Integration Notes

### Current Implementation (Stub)

The current implementation uses a stub for WatIAM SSO. Students can log in by providing their WatIAM email, and the system will:
1. Check if a student account exists
2. Create one if it doesn't exist
3. Establish a session

### Production Integration

To integrate with actual WatIAM OAuth:

1. **Register Application** with UW IT for OAuth credentials
2. **Install OAuth Library:** `pip install authlib` or `flask-oauthlib`
3. **Configure OAuth:**
   ```python
   from authlib.integrations.flask_client import OAuth
   
   oauth = OAuth(app)
   watiam = oauth.register(
       name='watiam',
       client_id=os.getenv('WATIAM_CLIENT_ID'),
       client_secret=os.getenv('WATIAM_CLIENT_SECRET'),
       server_metadata_url='https://watiam.uwaterloo.ca/.well-known/openid-configuration',
       client_kwargs={'scope': 'openid email profile'}
   )
   ```
4. **Update Login Flow:**
   - Redirect to WatIAM login
   - Handle OAuth callback
   - Extract user info from token
   - Create/update student account

---

## File Structure

```
Project/
├── src/
│   └── app.py                 # Main Flask application with auth endpoints
├── tests/
│   └── test_auth.py           # Comprehensive test suite
├── docs/
│   └── sprint1_authentication.md  # This documentation
├── requirements.txt           # Python dependencies
└── lostfound.db              # SQLite database (created on first run)
```

---

## Acceptance Criteria Status

✅ **Students can log in using WatIAM (stub if SSO unavailable)**
- Implemented with stub that creates student accounts on first login
- Ready for production WatIAM OAuth integration

✅ **Visitors can create accounts and sign in**
- Registration endpoint with validation
- Login endpoint with password verification
- Full account lifecycle support

✅ **Staff can sign in with elevated privileges**
- Staff login endpoint
- Role-based access control decorators
- Session includes role information

✅ **Roles persist across authenticated sessions**
- Flask-Session stores role in session
- Session persists for 24 hours
- Role available in all authenticated requests

---

## Deliverables Completed

✅ **Authentication flow diagram (students, visitors, staff)**
- Documented in this file with ASCII diagrams
- Shows complete flow for each user type

✅ **Working login + logout API endpoints**
- `/auth/login` - Supports all three roles
- `/auth/logout` - Clears session
- `/auth/register` - Visitor account creation
- `/auth/verify-session` - Session validation
- `/auth/me` - Current user info

✅ **Session validation and role-permission logic**
- Session management with Flask-Session
- Role-based decorators (`@require_auth`, `@require_role`)
- Session verification endpoint
- Role persistence across requests

✅ **Basic error handling (invalid credentials, missing fields)**
- Comprehensive error responses
- Proper HTTP status codes
- Descriptive error messages
- Input validation

✅ **Documentation for setup and use of authentication routes**
- This comprehensive documentation file
- API endpoint documentation
- Authentication flow diagrams
- Security notes
- Testing instructions

---

## Next Steps (Future Sprints)

1. **WatIAM OAuth Integration:** Replace stub with actual OAuth flow
2. **Password Reset:** Implement password reset functionality for visitors
3. **Email Verification:** Add email verification for visitor accounts
4. **Two-Factor Authentication:** Optional 2FA for staff accounts
5. **Session Refresh:** Implement token refresh mechanism
6. **Rate Limiting:** Add rate limiting to prevent brute force attacks
7. **Audit Logging:** Log all authentication events for security

---

## Notes for Developers

### Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
cd src
python app.py
```

The application will:
- Initialize the database on first run
- Create a default staff account (admin@uwaterloo.ca / admin123)
- Start on http://localhost:5000

### Environment Variables

Create a `.env` file for production:

```env
SECRET_KEY=your-secret-key-here
FLASK_ENV=production
DATABASE_URL=sqlite:///lostfound.db
```

### Database Migration

To migrate from SQLite to PostgreSQL:

1. Install `psycopg2` or `psycopg2-binary`
2. Update `DB_PATH` to use PostgreSQL connection string
3. Update table creation SQL for PostgreSQL syntax
4. Run migration script

---

## Conclusion

Sprint 1 successfully implements a complete authentication system for the UW Lost-and-Found application. All objectives have been met, all acceptance criteria satisfied, and comprehensive documentation provided. The system is ready for integration with the main application in subsequent sprints.

**Status:** ✅ **COMPLETE**

---

*Document created: November 2025*  
*Last updated: November 2025*  
*Team 15: Ruhani, Sheehan, Aidan, Neng, Theni*

