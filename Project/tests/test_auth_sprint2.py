"""
Test suite for authentication endpoints - Sprint 2.
Sprint 2: User Sign-Up and Login System

Tests cover:
- Student registration with @uwaterloo.ca email
- Staff registration with @uwaterloo.ca email
- Email validation (only @uwaterloo.ca accepted)
- Login for students and staff
- Session management
- Role-based access control
- Error handling

Author: Team 15
Sprint: 2
"""

import pytest
import json
import os
import sys
import sqlite3
from datetime import datetime

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import after path is set
import app as app_module
from app import app, hash_password, verify_password, validate_uwaterloo_email

@pytest.fixture
def client():
    """Create a test client with isolated test database."""
    # Use a test database
    test_db = os.path.join(os.path.dirname(__file__), '..', 'test_lostfound_sprint2.db')
    app.config['TESTING'] = True
    app.config['DATABASE'] = test_db
    
    # Initialize test database
    if os.path.exists(test_db):
        os.remove(test_db)
    
    # Temporarily replace DB_PATH for testing
    original_db_path = app_module.DB_PATH
    app_module.DB_PATH = test_db
    
    # Initialize database
    conn = sqlite3.connect(test_db)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('student', 'staff')),
            watcard_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    conn.commit()
    conn.close()
    
    with app.test_client() as client:
        with app.app_context():
            yield client
    
    # Cleanup
    if os.path.exists(test_db):
        os.remove(test_db)
    app_module.DB_PATH = original_db_path

@pytest.fixture
def sample_student():
    """Create a sample student account data for testing."""
    return {
        'email': 'student@uwaterloo.ca',
        'password': 'testpassword123',
        'name': 'Test Student'
    }

@pytest.fixture
def sample_staff():
    """Create a sample staff account data for testing."""
    return {
        'email': 'staff@uwaterloo.ca',
        'password': 'staffpassword123',
        'name': 'Test Staff'
    }

# ============================================================================
# Email Validation Tests
# ============================================================================

def test_validate_uwaterloo_email_valid(client):
    """Test email validation with valid @uwaterloo.ca emails."""
    assert validate_uwaterloo_email('user@uwaterloo.ca') == True
    assert validate_uwaterloo_email('student.name@uwaterloo.ca') == True
    assert validate_uwaterloo_email('STAFF@UWATERLOO.CA') == True  # Case insensitive

def test_validate_uwaterloo_email_invalid(client):
    """Test email validation rejects non-uwaterloo emails."""
    assert validate_uwaterloo_email('user@gmail.com') == False
    assert validate_uwaterloo_email('user@example.com') == False
    assert validate_uwaterloo_email('user@uwaterloo.edu') == False
    assert validate_uwaterloo_email('notanemail') == False
    assert validate_uwaterloo_email('') == False
    assert validate_uwaterloo_email(None) == False

# ============================================================================
# Registration Tests
# ============================================================================

def test_register_student_success(client, sample_student):
    """Test successful student registration with @uwaterloo.ca email."""
    response = client.post('/auth/register', 
                          data=json.dumps(sample_student),
                          content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['message'] == 'Account created successfully'
    assert data['user']['email'] == sample_student['email']
    assert data['user']['role'] == 'student'

def test_register_staff_success(client, sample_staff):
    """Test successful staff registration with @uwaterloo.ca email."""
    staff_data = {**sample_staff, 'role': 'staff'}
    response = client.post('/auth/register', 
                          data=json.dumps(staff_data),
                          content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['message'] == 'Account created successfully'
    assert data['user']['email'] == sample_staff['email']
    assert data['user']['role'] == 'staff'

def test_register_defaults_to_student(client, sample_student):
    """Test that registration defaults to student role if not specified."""
    response = client.post('/auth/register', 
                          data=json.dumps(sample_student),
                          content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['user']['role'] == 'student'

def test_register_rejects_non_uwaterloo_email(client):
    """Test registration rejects non-@uwaterloo.ca emails."""
    response = client.post('/auth/register',
                          data=json.dumps({
                              'email': 'user@gmail.com',
                              'password': 'password123',
                              'name': 'Test User'
                          }),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert '@uwaterloo.ca' in data['error'].lower()

def test_register_missing_fields(client):
    """Test registration with missing fields."""
    response = client.post('/auth/register',
                          data=json.dumps({'email': 'user@uwaterloo.ca'}),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Missing required fields' in data['error']

def test_register_duplicate_email(client, sample_student):
    """Test registration with duplicate email."""
    # Register first time
    client.post('/auth/register',
                data=json.dumps(sample_student),
                content_type='application/json')
    
    # Try to register again
    response = client.post('/auth/register',
                          data=json.dumps(sample_student),
                          content_type='application/json')
    assert response.status_code == 409
    data = json.loads(response.data)
    assert 'already registered' in data['error']

def test_register_weak_password(client):
    """Test registration with weak password."""
    response = client.post('/auth/register',
                          data=json.dumps({
                              'email': 'user@uwaterloo.ca',
                              'password': 'short',
                              'name': 'Test User'
                          }),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    # Password must be at least 6 characters
    assert 'at least 6 characters' in data['error']

def test_register_invalid_role(client, sample_student):
    """Test registration with invalid role."""
    invalid_data = {**sample_student, 'role': 'visitor'}
    response = client.post('/auth/register',
                          data=json.dumps(invalid_data),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Invalid role' in data['error']

# ============================================================================
# Login Tests
# ============================================================================

def test_login_student_success(client, sample_student):
    """Test successful student login."""
    # Register first
    client.post('/auth/register',
                data=json.dumps(sample_student),
                content_type='application/json')
    
    # Login
    response = client.post('/auth/login',
                          data=json.dumps({
                              'email': sample_student['email'],
                              'password': sample_student['password']
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Login successful'
    assert data['user']['role'] == 'student'
    assert data['user']['email'] == sample_student['email']

def test_login_staff_success(client, sample_staff):
    """Test successful staff login."""
    # Register first
    staff_data = {**sample_staff, 'role': 'staff'}
    client.post('/auth/register',
                data=json.dumps(staff_data),
                content_type='application/json')
    
    # Login
    response = client.post('/auth/login',
                          data=json.dumps({
                              'email': sample_staff['email'],
                              'password': sample_staff['password']
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Login successful'
    assert data['user']['role'] == 'staff'

def test_login_rejects_non_uwaterloo_email(client):
    """Test login rejects non-@uwaterloo.ca emails."""
    response = client.post('/auth/login',
                          data=json.dumps({
                              'email': 'user@gmail.com',
                              'password': 'password123'
                          }),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert '@uwaterloo.ca' in data['error'].lower()

def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    response = client.post('/auth/login',
                          data=json.dumps({
                              'email': 'nonexistent@uwaterloo.ca',
                              'password': 'wrongpassword'
                          }),
                          content_type='application/json')
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Invalid email or password' in data['error']

def test_login_missing_fields(client):
    """Test login with missing fields."""
    response = client.post('/auth/login',
                          data=json.dumps({'email': 'user@uwaterloo.ca'}),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Missing required fields' in data['error']

def test_login_wrong_password(client, sample_student):
    """Test login with wrong password."""
    # Register first
    client.post('/auth/register',
                data=json.dumps(sample_student),
                content_type='application/json')
    
    # Login with wrong password
    response = client.post('/auth/login',
                          data=json.dumps({
                              'email': sample_student['email'],
                              'password': 'wrongpassword'
                          }),
                          content_type='application/json')
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Invalid email or password' in data['error']

# ============================================================================
# Session Management Tests
# ============================================================================

def test_verify_session_valid(client, sample_student):
    """Test session verification with valid session."""
    # Register and login
    client.post('/auth/register',
                data=json.dumps(sample_student),
                content_type='application/json')
    client.post('/auth/login',
                data=json.dumps({
                    'email': sample_student['email'],
                    'password': sample_student['password']
                }),
                content_type='application/json')
    
    # Verify session
    response = client.get('/auth/verify-session')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['valid'] is True
    assert data['user']['email'] == sample_student['email']

def test_verify_session_invalid(client):
    """Test session verification without session."""
    response = client.get('/auth/verify-session')
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'invalid or expired' in data['error']

def test_get_current_user(client, sample_student):
    """Test getting current user information."""
    # Register and login
    client.post('/auth/register',
                data=json.dumps(sample_student),
                content_type='application/json')
    client.post('/auth/login',
                data=json.dumps({
                    'email': sample_student['email'],
                    'password': sample_student['password']
                }),
                content_type='application/json')
    
    # Get current user
    response = client.get('/auth/me')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['email'] == sample_student['email']
    assert data['role'] == 'student'

def test_logout_success(client, sample_student):
    """Test successful logout."""
    # Register and login
    client.post('/auth/register',
                data=json.dumps(sample_student),
                content_type='application/json')
    client.post('/auth/login',
                data=json.dumps({
                    'email': sample_student['email'],
                    'password': sample_student['password']
                }),
                content_type='application/json')
    
    # Logout
    response = client.post('/auth/logout')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Logout successful'
    
    # Verify session is cleared
    response = client.get('/auth/verify-session')
    assert response.status_code == 401

# ============================================================================
# Role Persistence Tests
# ============================================================================

def test_role_persists_across_session(client, sample_staff):
    """Test that staff role persists across authenticated session."""
    # Register as staff
    staff_data = {**sample_staff, 'role': 'staff'}
    client.post('/auth/register',
                data=json.dumps(staff_data),
                content_type='application/json')
    
    # Login
    client.post('/auth/login',
                data=json.dumps({
                    'email': sample_staff['email'],
                    'password': sample_staff['password']
                }),
                content_type='application/json')
    
    # Verify role persists
    response = client.get('/auth/me')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['role'] == 'staff'
    
    # Verify again
    response = client.get('/auth/verify-session')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['user']['role'] == 'staff'

# ============================================================================
# Error Handling Tests
# ============================================================================

def test_login_missing_request_body(client):
    """Test login without request body."""
    response = client.post('/auth/login',
                          content_type='application/json')
    # Flask returns 400 for missing request body - that's sufficient validation
    assert response.status_code == 400

def test_register_missing_request_body(client):
    """Test register without request body."""
    response = client.post('/auth/register',
                          content_type='application/json')
    # Flask returns 400 for missing request body - that's sufficient validation
    assert response.status_code == 400

# ============================================================================
# Health Check Tests
# ============================================================================

def test_health_check(client):
    """Test health check endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'

