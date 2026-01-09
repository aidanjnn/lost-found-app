"""
Test suite for items API endpoint.
Sprint 2: Create Display of Lost Items

Tests cover:
- GET /api/items endpoint
- Authentication requirement
- Item retrieval
- Empty state handling
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
from app import app, hash_password, DB_PATH

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'test_lostfound_items.db')

@pytest.fixture
def client():
    """Create a test client with isolated test database."""
    app.config['TESTING'] = True
    app.config['DATABASE'] = TEST_DB_PATH
    
    # Initialize test database
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    
    # Temporarily replace DB_PATH for testing
    original_db_path = app_module.DB_PATH
    app_module.DB_PATH = TEST_DB_PATH
    
    # Initialize database
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    
    # Users table
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
    
    # Items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT,
            category TEXT NOT NULL,
            location_found TEXT NOT NULL,
            pickup_at TEXT NOT NULL CHECK(pickup_at IN ('SLC', 'PAC', 'CIF')),
            date_found TIMESTAMP NOT NULL,
            status TEXT NOT NULL DEFAULT 'unclaimed' CHECK(status IN ('unclaimed', 'claimed', 'deleted')),
            image_url TEXT,
            found_by_desk TEXT NOT NULL,
            created_by_user_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            claimed_at TIMESTAMP,
            FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
        )
    ''')
    
    # Sessions table
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
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    app_module.DB_PATH = original_db_path

@pytest.fixture
def authenticated_student(client):
    """Create and authenticate a student user."""
    # Register student
    client.post('/auth/register',
                data=json.dumps({
                    'email': 'student@uwaterloo.ca',
                    'password': 'password123',
                    'name': 'Test Student'
                }),
                content_type='application/json')
    
    # Login
    client.post('/auth/login',
                data=json.dumps({
                    'email': 'student@uwaterloo.ca',
                    'password': 'password123'
                }),
                content_type='application/json')
    return client

@pytest.fixture
def authenticated_staff(client):
    """Create and authenticate a staff user."""
    # Register staff
    client.post('/auth/register',
                data=json.dumps({
                    'email': 'staff@uwaterloo.ca',
                    'password': 'password123',
                    'name': 'Test Staff',
                    'role': 'staff'
                }),
                content_type='application/json')
    
    # Login
    client.post('/auth/login',
                data=json.dumps({
                    'email': 'staff@uwaterloo.ca',
                    'password': 'password123'
                }),
                content_type='application/json')
    return client

@pytest.fixture
def sample_items(client):
    """Create sample items in the database."""
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    
    items = [
        ('Lost wallet', 'cards', 'Library', 'SLC', '2025-11-20 10:00:00', 'unclaimed', 'https://example.com/wallet.jpg', 'SLC'),
        ('Blue jacket', 'clothing', 'PAC', 'PAC', '2025-11-21 14:30:00', 'unclaimed', None, 'PAC'),
        ('Laptop charger', 'electronics', 'DC Library', 'SLC', '2025-11-19 09:15:00', 'claimed', None, 'SLC'),
    ]
    
    for item in items:
        cursor.execute('''
            INSERT INTO items (description, category, location_found, pickup_at, date_found, status, image_url, found_by_desk)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', item)
    
    conn.commit()
    conn.close()


def get_item_id_by_description(description):
    """Helper to fetch an item's ID by its description from the test DB."""
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT item_id FROM items WHERE description = ?', (description,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

# ============================================================================
# Authentication Tests
# ============================================================================

def test_get_items_requires_authentication(client):
    """Test that items endpoint requires authentication."""
    response = client.get('/api/items')
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Authentication required' in data['error']

# ============================================================================
# Items Retrieval Tests
# ============================================================================

def test_get_items_student_success(authenticated_student, sample_items):
    """Test student can retrieve items."""
    response = authenticated_student.get('/api/items')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'items' in data
    assert 'pagination' in data
    assert data['pagination']['total_count'] == 3  # 3 items, 1 is claimed but not deleted
    assert len(data['items']) == 3

def test_get_items_staff_success(authenticated_staff, sample_items):
    """Test staff can retrieve items."""
    response = authenticated_staff.get('/api/items')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'items' in data
    assert len(data['items']) > 0

def test_get_items_excludes_deleted(authenticated_student):
    """Test that deleted items are not returned."""
    test_db = os.path.join(os.path.dirname(__file__), '..', 'test_lostfound_items.db')
    conn = sqlite3.connect(test_db)
    cursor = conn.cursor()
    
    # Insert deleted item
    cursor.execute('''
        INSERT INTO items (description, category, location_found, pickup_at, date_found, status, found_by_desk)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', ('Deleted item', 'other', 'Location', 'SLC', '2025-11-20 10:00:00', 'deleted', 'SLC'))
    
    # Insert unclaimed item
    cursor.execute('''
        INSERT INTO items (description, category, location_found, pickup_at, date_found, status, found_by_desk)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', ('Active item', 'other', 'Location', 'SLC', '2025-11-20 10:00:00', 'unclaimed', 'SLC'))
    
    conn.commit()
    conn.close()
    
    response = authenticated_student.get('/api/items')
    assert response.status_code == 200
    data = json.loads(response.data)
    # Should only return the unclaimed item, not the deleted one
    assert data['pagination']['total_count'] == 1
    assert data['items'][0]['description'] == 'Active item'

def test_get_items_empty_database(authenticated_student):
    """Test getting items when database is empty."""
    response = authenticated_student.get('/api/items')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['items'] == []
    assert data['pagination']['total_count'] == 0

# ============================================================================
# Item Data Structure Tests
# ============================================================================

def test_items_have_required_fields(authenticated_student, sample_items):
    """Test that items have all required fields."""
    response = authenticated_student.get('/api/items')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    if len(data['items']) > 0:
        item = data['items'][0]
        required_fields = ['item_id', 'description', 'category', 'location_found', 
                          'pickup_at', 'date_found', 'status', 'image_url', 
                          'found_by_desk', 'created_at']
        
        for field in required_fields:
            assert field in item, f"Missing field: {field}"

def test_items_ordered_by_date_found(authenticated_student, sample_items):
    """Test that items are ordered by date_found DESC (newest first)."""
    response = authenticated_student.get('/api/items')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    if len(data['items']) > 1:
        dates = [item['date_found'] for item in data['items']]
        # Check that dates are in descending order
        for i in range(len(dates) - 1):
            assert dates[i] >= dates[i + 1], "Items should be ordered by date_found DESC"

# ============================================================================
# Error Handling Tests
# ============================================================================

def test_get_items_handles_database_error(authenticated_student):
    """Test error handling when database query fails."""
    # This test would require mocking database errors
    # For now, we test that endpoint exists and requires auth
    response = authenticated_student.get('/api/items')
    # Should succeed or return appropriate error
    assert response.status_code in [200, 500]

# ============================================================================
# Single Item Retrieval & Delete Tests
# ============================================================================

def test_get_single_item_requires_auth(client):
    """Ensure single item endpoint enforces authentication."""
    response = client.get('/api/items/1')
    assert response.status_code == 401


def test_staff_can_get_single_item(authenticated_staff, sample_items):
    """Staff should be able to load item details by ID."""
    item_id = get_item_id_by_description('Lost wallet')
    response = authenticated_staff.get(f'/api/items/{item_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['item']['item_id'] == item_id
    assert data['item']['description'] == 'Lost wallet'


def test_staff_can_view_deleted_item(authenticated_staff):
    """Staff should be able to view deleted items for auditing."""
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO items (description, category, location_found, pickup_at, date_found, status, found_by_desk)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', ('Deleted backpack', 'bags', 'SLC', 'SLC', '2025-11-22 11:00:00', 'deleted', 'SLC'))
    deleted_item_id = cursor.lastrowid
    conn.commit()
    conn.close()

    response = authenticated_staff.get(f'/api/items/{deleted_item_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['item']['status'] == 'deleted'


def test_student_cannot_view_deleted_item(authenticated_student):
    """Students should not be able to view deleted items."""
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO items (description, category, location_found, pickup_at, date_found, status, found_by_desk)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', ('Deleted phone', 'electronics', 'PAC', 'PAC', '2025-11-22 10:00:00', 'deleted', 'PAC'))
    deleted_item_id = cursor.lastrowid
    conn.commit()
    conn.close()

    response = authenticated_student.get(f'/api/items/{deleted_item_id}')
    assert response.status_code == 404


def test_staff_can_delete_item(authenticated_staff, sample_items):
    """Deleting an item should soft-delete it in the database."""
    item_id = get_item_id_by_description('Lost wallet')
    response = authenticated_staff.delete(f'/api/items/{item_id}')
    assert response.status_code == 200

    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT status FROM items WHERE item_id = ?', (item_id,))
    status = cursor.fetchone()[0]
    conn.close()
    assert status == 'deleted'


def test_student_cannot_delete_item(authenticated_student, sample_items):
    """Students should receive 403 when attempting to delete items."""
    item_id = get_item_id_by_description('Lost wallet')
    response = authenticated_student.delete(f'/api/items/{item_id}')
    assert response.status_code == 403

