"""
Test suite for claims endpoints.
Sprint 3: Item Claiming System (Backend)

Tests cover:
- Creating claims (students and staff)
- Listing claims with filters
- Getting claim details
- Updating claim status (staff only)
- Business logic enforcement:
  - Only one approved claim per item
  - Valid status transitions
  - Item status update on pickup
  - Role-based access control

Author: Team 15
Sprint: 3
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
from app import app, hash_password

@pytest.fixture
def client():
    """Create a test client with isolated test database."""
    # Use a test database
    test_db = os.path.join(os.path.dirname(__file__), '..', 'test_lostfound_claims.db')
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
            name TEXT,
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
            FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS claims (
            claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            claimant_user_id INTEGER NOT NULL,
            claimant_name TEXT NOT NULL,
            claimant_email TEXT NOT NULL,
            claimant_phone TEXT,
            verification_text TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'picked_up')),
            staff_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_by_staff_id INTEGER,
            FOREIGN KEY (item_id) REFERENCES items(item_id),
            FOREIGN KEY (claimant_user_id) REFERENCES users(user_id),
            FOREIGN KEY (processed_by_staff_id) REFERENCES users(user_id)
        )
    ''')
    
    # Create test users
    student_hash = hash_password('student123')
    staff_hash = hash_password('staff123')
    
    cursor.execute('''
        INSERT INTO users (email, name, password_hash, role)
        VALUES (?, ?, ?, ?)
    ''', ('student@uwaterloo.ca', 'Test Student', student_hash, 'student'))
    
    cursor.execute('''
        INSERT INTO users (email, name, password_hash, role)
        VALUES (?, ?, ?, ?)
    ''', ('staff@uwaterloo.ca', 'Test Staff', staff_hash, 'staff'))
    
    # Create test items
    cursor.execute('''
        INSERT INTO items (name, description, category, location_found, pickup_at, date_found, status, found_by_desk, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('Black Wallet', 'Black wallet with student ID', 'cards', 'SLC', 'SLC', '2025-11-20 10:00:00', 'unclaimed', 'SLC', 2))
    
    cursor.execute('''
        INSERT INTO items (name, description, category, location_found, pickup_at, date_found, status, found_by_desk, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('Blue Water Bottle', 'Blue water bottle', 'bottles', 'PAC', 'PAC', '2025-11-21 14:00:00', 'unclaimed', 'PAC', 2))
    
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

def login_staff(client):
    """Helper function to login as staff."""
    response = client.post('/auth/login', json={
        'email': 'staff@uwaterloo.ca',
        'password': 'staff123'
    })
    return response

# ============================================================================
# Test: Create Claim
# ============================================================================

def test_create_claim_success(client):
    """Test creating a claim successfully."""
    # Login as student
    login_student(client)
    
    # Create claim
    response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'This is my black wallet with my student ID and credit card inside',
        'phone': '519-555-0123'
    })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['message'] == 'Claim submitted successfully'
    assert data['claim']['item_id'] == 1
    assert data['claim']['status'] == 'pending'
    assert data['claim']['verification_text'] == 'This is my black wallet with my student ID and credit card inside'

def test_create_claim_missing_fields(client):
    """Test creating a claim with missing fields."""
    login_student(client)
    
    # Missing verification_text
    response = client.post('/api/claims', json={
        'item_id': 1
    })
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Missing required fields' in data['error']

def test_create_claim_invalid_item(client):
    """Test creating a claim for non-existent item."""
    login_student(client)
    
    response = client.post('/api/claims', json={
        'item_id': 999,
        'verification_text': 'This is my item'
    })
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['error'] == 'Item not found'

def test_create_claim_unauthenticated(client):
    """Test creating a claim without authentication."""
    response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'This is my item'
    })
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Authentication required' in data['error']

def test_create_multiple_claims_for_same_item(client):
    """Test creating multiple claims for the same item - should be allowed while pending."""
    login_student(client)
    
    # Create first claim
    response1 = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'First claim'
    })
    assert response1.status_code == 201
    
    # Logout and login as staff to create another claim
    client.post('/auth/logout')
    login_staff(client)
    
    # Create second claim - should work if first is still pending
    response2 = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'Second claim'
    })
    assert response2.status_code == 201

# ============================================================================
# Test: Get Claims
# ============================================================================

def test_get_claims_as_student(client):
    """Test getting claims as a student - should only see own claims."""
    login_student(client)
    
    # Create a claim
    client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    
    # Get claims
    response = client.get('/api/claims')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert 'claims' in data
    assert data['count'] == 1
    assert data['claims'][0]['claimant_email'] == 'student@uwaterloo.ca'

def test_get_claims_as_staff(client):
    """Test getting claims as staff - should see all claims."""
    # Create claim as student
    login_student(client)
    client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    client.post('/auth/logout')
    
    # Login as staff and get all claims
    login_staff(client)
    response = client.get('/api/claims')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['count'] >= 1

def test_get_claims_with_status_filter(client):
    """Test filtering claims by status."""
    login_student(client)
    
    # Create claim
    client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    
    # Get pending claims
    response = client.get('/api/claims?status=pending')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert all(claim['status'] == 'pending' for claim in data['claims'])

def test_get_claims_unauthenticated(client):
    """Test getting claims without authentication."""
    response = client.get('/api/claims')
    assert response.status_code == 401

# ============================================================================
# Test: Get Claim Details
# ============================================================================

def test_get_claim_details_as_owner(client):
    """Test getting claim details as the claim owner."""
    login_student(client)
    
    # Create claim
    create_response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    claim_id = json.loads(create_response.data)['claim']['claim_id']
    
    # Get claim details
    response = client.get(f'/api/claims/{claim_id}')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['claim']['claim_id'] == claim_id
    assert 'item' in data['claim']
    assert data['claim']['item']['category'] == 'cards'

def test_get_claim_details_as_staff(client):
    """Test getting claim details as staff."""
    # Create claim as student
    login_student(client)
    create_response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    claim_id = json.loads(create_response.data)['claim']['claim_id']
    client.post('/auth/logout')
    
    # Get claim as staff
    login_staff(client)
    response = client.get(f'/api/claims/{claim_id}')
    assert response.status_code == 200

def test_get_claim_details_unauthorized(client):
    """Test getting claim details for someone else's claim as student."""
    # Create claim as student
    login_student(client)
    create_response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    claim_id = json.loads(create_response.data)['claim']['claim_id']
    client.post('/auth/logout')
    
    # Try to get as different student
    client.post('/auth/register', json={
        'email': 'student2@uwaterloo.ca',
        'name': 'Student Two',
        'password': 'password123',
        'confirmPassword': 'password123'
    })
    
    # Login as the new student
    client.post('/auth/login', json={
        'email': 'student2@uwaterloo.ca',
        'password': 'password123'
    })
    
    response = client.get(f'/api/claims/{claim_id}')
    assert response.status_code == 403

def test_get_claim_details_not_found(client):
    """Test getting non-existent claim."""
    login_student(client)
    
    response = client.get('/api/claims/999')
    assert response.status_code == 404

# ============================================================================
# Test: Update Claim Status (Staff Only)
# ============================================================================

def test_approve_claim_success(client):
    """Test approving a claim."""
    # Create claim as student
    login_student(client)
    create_response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet with ID inside'
    })
    claim_id = json.loads(create_response.data)['claim']['claim_id']
    client.post('/auth/logout')
    
    # Approve as staff
    login_staff(client)
    response = client.patch(f'/api/claims/{claim_id}', json={
        'status': 'approved',
        'staff_notes': 'Verified student ID matches'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['new_status'] == 'approved'

def test_reject_claim_success(client):
    """Test rejecting a claim."""
    # Create claim as student
    login_student(client)
    create_response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    claim_id = json.loads(create_response.data)['claim']['claim_id']
    client.post('/auth/logout')
    
    # Reject as staff
    login_staff(client)
    response = client.patch(f'/api/claims/{claim_id}', json={
        'status': 'rejected',
        'staff_notes': 'Description does not match item'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['new_status'] == 'rejected'

def test_pickup_claim_updates_item_status(client):
    """Test that marking claim as picked_up updates item status to claimed."""
    # Create and approve claim
    login_student(client)
    create_response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    claim_id = json.loads(create_response.data)['claim']['claim_id']
    client.post('/auth/logout')
    
    login_staff(client)
    
    # Approve claim first
    client.patch(f'/api/claims/{claim_id}', json={
        'status': 'approved'
    })
    
    # Mark as picked up
    response = client.patch(f'/api/claims/{claim_id}', json={
        'status': 'picked_up'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['item_updated'] is True
    
    # Verify item status is now 'claimed'
    items_response = client.get('/api/items')
    items_data = json.loads(items_response.data)
    item = next((i for i in items_data['items'] if i['item_id'] == 1), None)
    assert item['status'] == 'claimed'

def test_cannot_approve_multiple_claims_for_same_item(client):
    """Test that only one claim can be approved per item."""
    # Create two claims for same item
    login_student(client)
    create_response1 = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'First claim'
    })
    claim_id1 = json.loads(create_response1.data)['claim']['claim_id']
    client.post('/auth/logout')
    
    login_staff(client)
    create_response2 = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'Second claim'
    })
    claim_id2 = json.loads(create_response2.data)['claim']['claim_id']
    
    # Approve first claim
    response1 = client.patch(f'/api/claims/{claim_id1}', json={
        'status': 'approved'
    })
    assert response1.status_code == 200
    
    # Try to approve second claim - should fail
    response2 = client.patch(f'/api/claims/{claim_id2}', json={
        'status': 'approved'
    })
    assert response2.status_code == 409
    data = json.loads(response2.data)
    assert 'already approved' in data['error']

def test_cannot_modify_picked_up_claim(client):
    """Test that picked_up claims cannot be modified."""
    # Create, approve, and pick up claim
    login_student(client)
    create_response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    claim_id = json.loads(create_response.data)['claim']['claim_id']
    client.post('/auth/logout')
    
    login_staff(client)
    client.patch(f'/api/claims/{claim_id}', json={'status': 'approved'})
    client.patch(f'/api/claims/{claim_id}', json={'status': 'picked_up'})
    
    # Try to modify picked_up claim
    response = client.patch(f'/api/claims/{claim_id}', json={
        'status': 'rejected'
    })
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'picked up' in data['error']

def test_update_claim_student_forbidden(client):
    """Test that students cannot update claim status."""
    # Create claim as student
    login_student(client)
    create_response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    claim_id = json.loads(create_response.data)['claim']['claim_id']
    
    # Try to update as student
    response = client.patch(f'/api/claims/{claim_id}', json={
        'status': 'approved'
    })
    
    assert response.status_code == 403

def test_update_claim_invalid_status(client):
    """Test updating claim with invalid status."""
    # Create claim
    login_student(client)
    create_response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'My wallet'
    })
    claim_id = json.loads(create_response.data)['claim']['claim_id']
    client.post('/auth/logout')
    
    # Try to update with invalid status
    login_staff(client)
    response = client.patch(f'/api/claims/{claim_id}', json={
        'status': 'invalid_status'
    })
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Invalid status' in data['error']

def test_update_claim_not_found(client):
    """Test updating non-existent claim."""
    login_staff(client)
    
    response = client.patch('/api/claims/999', json={
        'status': 'approved'
    })
    
    assert response.status_code == 404

# ============================================================================
# Test: Business Logic
# ============================================================================

def test_cannot_create_claim_for_claimed_item_with_approved_claim(client):
    """Test that items with approved claims cannot receive new claims."""
    # Create and approve first claim
    login_student(client)
    create_response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'First claim'
    })
    claim_id = json.loads(create_response.data)['claim']['claim_id']
    client.post('/auth/logout')
    
    login_staff(client)
    client.patch(f'/api/claims/{claim_id}', json={'status': 'approved'})
    client.post('/auth/logout')
    
    # Try to create new claim for same item
    client.post('/auth/register', json={
        'email': 'student2@uwaterloo.ca',
        'name': 'Student Two',
        'password': 'password123',
        'confirmPassword': 'password123'
    })
    
    # Login as the new student
    client.post('/auth/login', json={
        'email': 'student2@uwaterloo.ca',
        'password': 'password123'
    })
    
    response = client.post('/api/claims', json={
        'item_id': 1,
        'verification_text': 'Second claim'
    })
    
    assert response.status_code == 409
    data = json.loads(response.data)
    assert 'already has an approved claim' in data['error']

if __name__ == '__main__':
    pytest.main([__file__, '-v'])

