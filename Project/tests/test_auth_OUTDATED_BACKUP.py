"""
Test suite for authentication endpoints.
Sprint 1: User Authentication and Login Process

Tests cover:
- Student login (WatIAM stub)
- Visitor registration and login
- Staff login
- Session management
- Role-based access control
- Error handling

Author: Team 15
Sprint: 1
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
from app import app, hash_password, verify_password

@pytest.fixture
def client():
    """Create a test client with isolated test database."""
    # Use a test database
    test_db = os.path.join(os.path.dirname(__file__), '..', 'test_lostfound.db')
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
            password_hash TEXT,
            role TEXT NOT NULL CHECK(role IN ('student', 'visitor', 'staff')),
            watcard_number TEXT,
            driver_license TEXT,
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
def sample_visitor():
    """Create a sample visitor account for testing."""
    return {
        'email': 'visitor@example.com',
        'password': 'testpassword123',
        'name': 'Test Visitor'
    }

@pytest.fixture
def sample_staff():
    """Create a sample staff account for testing."""
    return {
        'email': 'staff@uwaterloo.ca',
        'password': 'staffpassword123',
        'name': 'Test Staff'
    }

# ============================================================================
# Registration Tests
# ============================================================================

def test_register_visitor_success(client, sample_visitor):
    """Test successful visitor registration."""
    response = client.post('/auth/register', 
                          data=json.dumps(sample_visitor),
                          content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['message'] == 'Account created successfully'
    assert data['user']['email'] == sample_visitor['email']
    assert data['user']['role'] == 'visitor'

def test_register_visitor_missing_fields(client):
    """Test registration with missing fields."""
    response = client.post('/auth/register',
                          data=json.dumps({'email': 'test@example.com'}),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Missing required fields' in data['error']

def test_register_visitor_duplicate_email(client, sample_visitor):
    """Test registration with duplicate email."""
    # Register first time
    client.post('/auth/register',
                data=json.dumps(sample_visitor),
                content_type='application/json')
    
    # Try to register again
    response = client.post('/auth/register',
                          data=json.dumps(sample_visitor),
                          content_type='application/json')
    assert response.status_code == 409
    data = json.loads(response.data)
    assert 'already registered' in data['error']

def test_register_visitor_weak_password(client):
    """Test registration with weak password."""
    response = client.post('/auth/register',
                          data=json.dumps({
                              'email': 'test@example.com',
                              'password': 'short',
                              'name': 'Test User'
                          }),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'at least 8 characters' in data['error']

# ============================================================================
# Login Tests - Visitor
# ============================================================================

def test_login_visitor_success(client, sample_visitor):
    """Test successful visitor login."""
    # Register first
    client.post('/auth/register',
                data=json.dumps(sample_visitor),
                content_type='application/json')
    
    # Login
    response = client.post('/auth/login',
                          data=json.dumps({
                              'role': 'visitor',
                              'email': sample_visitor['email'],
                              'password': sample_visitor['password']
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Login successful'
    assert data['user']['role'] == 'visitor'
    assert data['user']['email'] == sample_visitor['email']

def test_login_visitor_invalid_credentials(client):
    """Test login with invalid credentials."""
    response = client.post('/auth/login',
                          data=json.dumps({
                              'role': 'visitor',
                              'email': 'nonexistent@example.com',
                              'password': 'wrongpassword'
                          }),
                          content_type='application/json')
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Invalid email or password' in data['error']

def test_login_visitor_missing_fields(client):
    """Test login with missing fields."""
    response = client.post('/auth/login',
                          data=json.dumps({'role': 'visitor'}),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Missing required fields' in data['error']

# ============================================================================
# Login Tests - Student (WatIAM Stub)
# ============================================================================

def test_login_student_success(client):
    """Test successful student login with WatIAM stub."""
    response = client.post('/auth/login',
                          data=json.dumps({
                              'role': 'student',
                              'watiam_id': 'student@uwaterloo.ca'
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Login successful'
    assert data['user']['role'] == 'student'
    assert data['user']['email'] == 'student@uwaterloo.ca'

def test_login_student_creates_account(client):
    """Test that student login creates account if doesn't exist."""
    response = client.post('/auth/login',
                          data=json.dumps({
                              'role': 'student',
                              'watiam_id': 'newstudent@uwaterloo.ca'
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['user']['user_id'] is not None

def test_login_student_missing_watiam_id(client):
    """Test student login without WatIAM ID."""
    response = client.post('/auth/login',
                          data=json.dumps({'role': 'student'}),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'watiam_id' in data['error'] or 'email' in data['error']

# ============================================================================
# Login Tests - Staff
# ============================================================================

def test_login_staff_success(client, sample_staff):
    """Test successful staff login."""
    # Create staff account manually (normally done by admin)
    import sqlite3
    test_db = os.path.join(os.path.dirname(__file__), '..', 'test_lostfound.db')
    conn = sqlite3.connect(test_db)
    cursor = conn.cursor()
    password_hash = hash_password(sample_staff['password'])
    cursor.execute('''
        INSERT INTO users (email, name, password_hash, role)
        VALUES (?, ?, ?, ?)
    ''', (sample_staff['email'], sample_staff['name'], password_hash, 'staff'))
    conn.commit()
    conn.close()
    
    # Login
    response = client.post('/auth/login',
                          data=json.dumps({
                              'role': 'staff',
                              'email': sample_staff['email'],
                              'password': sample_staff['password']
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Login successful'
    assert data['user']['role'] == 'staff'

def test_login_staff_invalid_credentials(client):
    """Test staff login with invalid credentials."""
    response = client.post('/auth/login',
                          data=json.dumps({
                              'role': 'staff',
                              'email': 'staff@uwaterloo.ca',
                              'password': 'wrongpassword'
                          }),
                          content_type='application/json')
    assert response.status_code == 401

# ============================================================================
# Session Management Tests
# ============================================================================

def test_verify_session_valid(client, sample_visitor):
    """Test session verification with valid session."""
    # Register and login
    client.post('/auth/register',
                data=json.dumps(sample_visitor),
                content_type='application/json')
    client.post('/auth/login',
                data=json.dumps({
                    'role': 'visitor',
                    'email': sample_visitor['email'],
                    'password': sample_visitor['password']
                }),
                content_type='application/json')
    
    # Verify session
    response = client.get('/auth/verify-session')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['valid'] is True
    assert data['user']['email'] == sample_visitor['email']

def test_verify_session_invalid(client):
    """Test session verification without session."""
    response = client.get('/auth/verify-session')
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'invalid or expired' in data['error']

def test_get_current_user(client, sample_visitor):
    """Test getting current user information."""
    # Register and login
    client.post('/auth/register',
                data=json.dumps(sample_visitor),
                content_type='application/json')
    client.post('/auth/login',
                data=json.dumps({
                    'role': 'visitor',
                    'email': sample_visitor['email'],
                    'password': sample_visitor['password']
                }),
                content_type='application/json')
    
    # Get current user
    response = client.get('/auth/me')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['email'] == sample_visitor['email']
    assert data['role'] == 'visitor'

def test_get_current_user_unauthorized(client):
    """Test getting current user without authentication."""
    response = client.get('/auth/me')
    assert response.status_code == 401

def test_logout_success(client, sample_visitor):
    """Test successful logout."""
    # Register and login
    client.post('/auth/register',
                data=json.dumps(sample_visitor),
                content_type='application/json')
    client.post('/auth/login',
                data=json.dumps({
                    'role': 'visitor',
                    'email': sample_visitor['email'],
                    'password': sample_visitor['password']
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

def test_logout_unauthorized(client):
    """Test logout without authentication."""
    response = client.post('/auth/logout')
    assert response.status_code == 401

# ============================================================================
# Error Handling Tests
# ============================================================================

def test_login_invalid_role(client):
    """Test login with invalid role."""
    response = client.post('/auth/login',
                          data=json.dumps({
                              'role': 'invalid_role',
                              'email': 'test@example.com',
                              'password': 'password'
                          }),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Invalid role' in data['error']

def test_login_missing_role(client):
    """Test login without role field."""
    response = client.post('/auth/login',
                          data=json.dumps({
                              'email': 'test@example.com',
                              'password': 'password'
                          }),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'role' in data['error']

# ============================================================================
# Health Check Tests
# ============================================================================

def test_health_check(client):
    """Test health check endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'

def test_root_endpoint(client):
    """Test root endpoint with API information."""
    response = client.get('/')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'endpoints' in data

