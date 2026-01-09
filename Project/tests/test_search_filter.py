"""
Test suite for items search and filtering endpoints.
Sprint 3: Item Searching & Filtering (Backend)

Tests cover:
- Text search across multiple fields
- Category filtering
- Location filtering
- Status filtering
- Sorting (recent/oldest)
- Pagination (page, page_size)
- Pagination metadata (total_count, total_pages)
- Parameter validation
- Combined filters

Author: Team 15
Sprint: 3
"""

import pytest
import json
import os
import sys
import sqlite3
from datetime import datetime, timedelta

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import after path is set
import app as app_module
from app import app, hash_password

@pytest.fixture
def client():
    """Create a test client with isolated test database."""
    # Use a test database
    test_db = os.path.join(os.path.dirname(__file__), '..', 'test_search_filter.db')
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
    
    # Create tables
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
        CREATE TABLE IF NOT EXISTS items (
            item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT,
            category TEXT NOT NULL,
            location_found TEXT NOT NULL,
            pickup_at TEXT NOT NULL,
            date_found TIMESTAMP NOT NULL,
            status TEXT NOT NULL DEFAULT 'unclaimed',
            image_url TEXT,
            found_by_desk TEXT NOT NULL,
            created_by_user_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_location_found ON items(location_found)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_date_found ON items(date_found DESC)')
    
    # Create test user
    student_hash = hash_password('student123')
    cursor.execute('''
        INSERT INTO users (email, name, password_hash, role)
        VALUES (?, ?, ?, ?)
    ''', ('student@uwaterloo.ca', 'Test Student', student_hash, 'student'))
    
    # Create diverse test items
    base_date = datetime.now()
    
    # Different categories
    test_items = [
        ('Black leather wallet', 'cards', 'SLC Main Desk', 'SLC', (base_date - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'SLC'),
        ('Blue water bottle', 'bottles', 'PAC Gym', 'PAC', (base_date - timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'PAC'),
        ('Red winter jacket', 'clothing', 'DC Library', 'SLC', (base_date - timedelta(days=3)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'SLC'),
        ('iPhone 12', 'electronics', 'CIF Building', 'CIF', (base_date - timedelta(days=4)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'CIF'),
        ('Student ID card', 'cards', 'SLC Food Court', 'SLC', (base_date - timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S'), 'claimed', 'SLC'),
        ('Backpack with laptop', 'bags', 'PAC Locker Room', 'PAC', (base_date - timedelta(days=6)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'PAC'),
        ('Textbook - Math 135', 'books', 'MC Building', 'SLC', (base_date - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'SLC'),
        ('Wireless headphones', 'electronics', 'SLC Turnkey Desk', 'SLC', (base_date - timedelta(days=8)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'SLC'),
        ('Keys with keychain', 'keys', 'E7 Building', 'SLC', (base_date - timedelta(days=9)).strftime('%Y-%m-%d %H:%M:%S'), 'claimed', 'SLC'),
        ('Umbrella', 'other', 'SLC Great Hall', 'SLC', (base_date - timedelta(days=10)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'SLC'),
        # More items for pagination testing
        ('Laptop charger', 'electronics', 'DP Library', 'SLC', (base_date - timedelta(days=11)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'SLC'),
        ('Gym towel', 'clothing', 'CIF Gym', 'CIF', (base_date - timedelta(days=12)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'CIF'),
        ('Notebook', 'books', 'QNC Building', 'SLC', (base_date - timedelta(days=13)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'SLC'),
        ('Watch', 'other', 'PAC Main Entrance', 'PAC', (base_date - timedelta(days=14)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'PAC'),
        ('Phone case', 'other', 'SLC Tim Hortons', 'SLC', (base_date - timedelta(days=15)).strftime('%Y-%m-%d %H:%M:%S'), 'unclaimed', 'SLC'),
    ]
    
    for item in test_items:
        cursor.execute('''
            INSERT INTO items (description, category, location_found, pickup_at, date_found, status, found_by_desk)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', item)
    
    conn.commit()
    conn.close()
    
    with app.test_client() as client:
        yield client
    
    # Cleanup
    app_module.DB_PATH = original_db_path
    if os.path.exists(test_db):
        os.remove(test_db)

def login_student(client):
    """Helper function to login as student."""
    response = client.post('/auth/login', json={
        'email': 'student@uwaterloo.ca',
        'password': 'student123'
    })
    return response

# ============================================================================
# Test: Basic Retrieval
# ============================================================================

def test_get_all_items(client):
    """Test retrieving all items without filters."""
    login_student(client)
    
    response = client.get('/api/items')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert 'items' in data
    assert 'pagination' in data
    assert len(data['items']) > 0
    assert data['pagination']['total_count'] == 15  # Total items created

def test_get_items_unauthenticated(client):
    """Test that unauthenticated requests are rejected."""
    response = client.get('/api/items')
    assert response.status_code == 401

# ============================================================================
# Test: Text Search
# ============================================================================

def test_search_by_description(client):
    """Test searching in item descriptions."""
    login_student(client)
    
    response = client.get('/api/items?search=wallet')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) >= 1
    # Should find 'Black leather wallet'
    assert any('wallet' in item['description'].lower() for item in data['items'])

def test_search_by_category(client):
    """Test searching by category text."""
    login_student(client)
    
    response = client.get('/api/items?search=electronics')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) >= 3  # iPhone, headphones, laptop charger
    assert all('electronics' in item['category'].lower() for item in data['items'])

def test_search_by_location(client):
    """Test searching by location."""
    login_student(client)
    
    response = client.get('/api/items?search=SLC')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) >= 5
    assert any('SLC' in item['location_found'] or 'SLC' in item['pickup_at'] for item in data['items'])

def test_search_case_insensitive(client):
    """Test that search is case-insensitive."""
    login_student(client)
    
    response1 = client.get('/api/items?search=WALLET')
    response2 = client.get('/api/items?search=wallet')
    
    data1 = json.loads(response1.data)
    data2 = json.loads(response2.data)
    
    assert len(data1['items']) == len(data2['items'])

def test_search_no_results(client):
    """Test search with no matching results."""
    login_student(client)
    
    response = client.get('/api/items?search=nonexistentitem12345')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) == 0
    assert data['pagination']['total_count'] == 0

# ============================================================================
# Test: Category Filter
# ============================================================================

def test_filter_by_category(client):
    """Test filtering by exact category."""
    login_student(client)
    
    response = client.get('/api/items?category=electronics')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) >= 3
    assert all(item['category'].lower() == 'electronics' for item in data['items'])

def test_filter_by_category_case_insensitive(client):
    """Test that category filter is case-insensitive."""
    login_student(client)
    
    response1 = client.get('/api/items?category=CARDS')
    response2 = client.get('/api/items?category=cards')
    
    data1 = json.loads(response1.data)
    data2 = json.loads(response2.data)
    
    assert len(data1['items']) == len(data2['items'])

# ============================================================================
# Test: Location Filter
# ============================================================================

def test_filter_by_location(client):
    """Test filtering by location (partial match)."""
    login_student(client)
    
    response = client.get('/api/items?location=PAC')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) >= 3  # PAC Gym, PAC Locker Room, PAC Main Entrance
    assert all('pac' in item['location_found'].lower() for item in data['items'])

def test_filter_by_location_partial(client):
    """Test partial location match."""
    login_student(client)
    
    response = client.get('/api/items?location=Library')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) >= 2  # DC Library, DP Library

# ============================================================================
# Test: Status Filter
# ============================================================================

def test_filter_by_status_unclaimed(client):
    """Test filtering by unclaimed status."""
    login_student(client)
    
    response = client.get('/api/items?status=unclaimed')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert all(item['status'] == 'unclaimed' for item in data['items'])
    assert len(data['items']) >= 10

def test_filter_by_status_claimed(client):
    """Test filtering by claimed status."""
    login_student(client)
    
    response = client.get('/api/items?status=claimed')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert all(item['status'] == 'claimed' for item in data['items'])
    assert len(data['items']) == 2  # Student ID, Keys

def test_filter_invalid_status(client):
    """Test filtering with invalid status."""
    login_student(client)
    
    response = client.get('/api/items?status=invalid')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

# ============================================================================
# Test: Sorting
# ============================================================================

def test_sort_recent(client):
    """Test sorting by recent (newest first) - default."""
    login_student(client)
    
    response = client.get('/api/items?sort=recent')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    items = data['items']
    
    # Check items are in descending date order
    for i in range(len(items) - 1):
        date1 = datetime.fromisoformat(items[i]['date_found'].replace('Z', '+00:00'))
        date2 = datetime.fromisoformat(items[i+1]['date_found'].replace('Z', '+00:00'))
        assert date1 >= date2

def test_sort_oldest(client):
    """Test sorting by oldest (oldest first)."""
    login_student(client)
    
    response = client.get('/api/items?sort=oldest')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    items = data['items']
    
    # Check items are in ascending date order
    for i in range(len(items) - 1):
        date1 = datetime.fromisoformat(items[i]['date_found'].replace('Z', '+00:00'))
        date2 = datetime.fromisoformat(items[i+1]['date_found'].replace('Z', '+00:00'))
        assert date1 <= date2

def test_sort_invalid(client):
    """Test sorting with invalid value."""
    login_student(client)
    
    response = client.get('/api/items?sort=invalid')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

# ============================================================================
# Test: Pagination
# ============================================================================

def test_pagination_first_page(client):
    """Test first page of results."""
    login_student(client)
    
    response = client.get('/api/items?page=1&page_size=5')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) == 5
    assert data['pagination']['page'] == 1
    assert data['pagination']['page_size'] == 5
    assert data['pagination']['total_count'] == 15
    assert data['pagination']['total_pages'] == 3

def test_pagination_second_page(client):
    """Test second page of results."""
    login_student(client)
    
    response = client.get('/api/items?page=2&page_size=5')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) == 5
    assert data['pagination']['page'] == 2

def test_pagination_last_page(client):
    """Test last page with partial results."""
    login_student(client)
    
    response = client.get('/api/items?page=3&page_size=7')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) == 1  # 15 total, 7+7+1
    assert data['pagination']['page'] == 3
    assert data['pagination']['total_pages'] == 3

def test_pagination_beyond_last_page(client):
    """Test requesting page beyond available data."""
    login_student(client)
    
    response = client.get('/api/items?page=100&page_size=5')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data['items']) == 0  # No items on this page

def test_pagination_invalid_page(client):
    """Test invalid page number."""
    login_student(client)
    
    response = client.get('/api/items?page=0')
    assert response.status_code == 400

def test_pagination_invalid_page_size(client):
    """Test invalid page size."""
    login_student(client)
    
    response = client.get('/api/items?page_size=0')
    assert response.status_code == 400
    
    response = client.get('/api/items?page_size=200')  # Max is 100
    assert response.status_code == 400

def test_pagination_non_numeric(client):
    """Test non-numeric pagination parameters."""
    login_student(client)
    
    response = client.get('/api/items?page=abc')
    assert response.status_code == 400
    
    response = client.get('/api/items?page_size=xyz')
    assert response.status_code == 400

# ============================================================================
# Test: Combined Filters
# ============================================================================

def test_combined_filters_category_and_status(client):
    """Test combining category and status filters."""
    login_student(client)
    
    response = client.get('/api/items?category=electronics&status=unclaimed')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert all(item['category'].lower() == 'electronics' for item in data['items'])
    assert all(item['status'] == 'unclaimed' for item in data['items'])

def test_combined_search_and_category(client):
    """Test combining search and category filter."""
    login_student(client)
    
    response = client.get('/api/items?search=SLC&category=cards')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert all(item['category'].lower() == 'cards' for item in data['items'])

def test_combined_all_filters(client):
    """Test combining search, category, location, status, sort, and pagination."""
    login_student(client)
    
    response = client.get('/api/items?search=SLC&category=cards&status=unclaimed&sort=recent&page=1&page_size=10')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    # Verify all filters are applied
    for item in data['items']:
        assert item['category'].lower() == 'cards'
        assert item['status'] == 'unclaimed'

def test_combined_location_and_sort(client):
    """Test combining location filter with sorting."""
    login_student(client)
    
    response = client.get('/api/items?location=PAC&sort=oldest')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    items = data['items']
    
    # Verify location filter
    assert all('pac' in item['location_found'].lower() for item in items)
    
    # Verify sorting
    for i in range(len(items) - 1):
        date1 = datetime.fromisoformat(items[i]['date_found'].replace('Z', '+00:00'))
        date2 = datetime.fromisoformat(items[i+1]['date_found'].replace('Z', '+00:00'))
        assert date1 <= date2

# ============================================================================
# Test: Pagination Metadata
# ============================================================================

def test_pagination_metadata_accuracy(client):
    """Test that pagination metadata is accurate."""
    login_student(client)
    
    response = client.get('/api/items?page_size=4')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    pag = data['pagination']
    
    # With 15 items and page_size=4, should have 4 pages (4+4+4+3)
    assert pag['total_count'] == 15
    assert pag['total_pages'] == 4
    assert pag['page_size'] == 4

def test_pagination_metadata_with_filters(client):
    """Test pagination metadata reflects filtered results."""
    login_student(client)
    
    response = client.get('/api/items?status=claimed&page_size=10')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    pag = data['pagination']
    
    # Only 2 claimed items
    assert pag['total_count'] == 2
    assert pag['total_pages'] == 1
    assert len(data['items']) == 2

# ============================================================================
# Test: Default Behavior
# ============================================================================

def test_default_pagination(client):
    """Test default pagination values."""
    login_student(client)
    
    response = client.get('/api/items')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    pag = data['pagination']
    
    # Defaults: page=1, page_size=20
    assert pag['page'] == 1
    assert pag['page_size'] == 20

def test_default_sort_order(client):
    """Test default sort order is recent."""
    login_student(client)
    
    response = client.get('/api/items')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    items = data['items']
    
    # Should be sorted by recent (descending)
    for i in range(len(items) - 1):
        date1 = datetime.fromisoformat(items[i]['date_found'].replace('Z', '+00:00'))
        date2 = datetime.fromisoformat(items[i+1]['date_found'].replace('Z', '+00:00'))
        assert date1 >= date2

if __name__ == '__main__':
    pytest.main([__file__, '-v'])

