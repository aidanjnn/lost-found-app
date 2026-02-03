"""
UW Lost-and-Found App - Main Flask Application
Sprint 2: User Sign-Up and Login System

This module implements the main Flask application with authentication endpoints.
Supports two user roles:
- Students: Sign up and login with @uwaterloo.ca email and password
- Staff: Sign up and login with @uwaterloo.ca email and password (elevated privileges)

Note: Visitors are no longer supported. Only @uwaterloo.ca email addresses are accepted.

Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
Sprint: 2
"""

from flask import Flask, request, jsonify, session, make_response
from flask_session import Session
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta
import bcrypt
import secrets
from functools import wraps
import csv
from io import StringIO
import json
import email_utils

app = Flask(__name__)

# Enable CORS for frontend - allow local dev and production domains
CORS(app, 
     origins=[
         'http://localhost:3000', 
         'http://127.0.0.1:3000', 
         'http://localhost:5173',
         'https://lost-found-app-chi.vercel.app'
     ],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_KEY_PREFIX'] = 'lostfound:'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# Initialize Flask-Session
Session(app)

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'lostfound.db')

def init_db():
    """
    Initialize the database with required tables for authentication and items.
    Creates Users, Items, and Sessions tables.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table - stores all user accounts (students and staff only)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,  -- Required for all users
            role TEXT NOT NULL CHECK(role IN ('student', 'staff')),
            watcard_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    
    # Items table - stores lost-and-found items
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
    
    def ensure_column(table_name, column_name, column_definition, post_update_sql=None):
        """
        Ensure a column exists on a table. Adds it if missing.
        column_definition should include both the column name and type, e.g. "updated_at TIMESTAMP".
        """
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = {row[1] for row in cursor.fetchall()}
        if column_name not in columns:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_definition}")
            if post_update_sql:
                cursor.execute(post_update_sql)
    
    # Add updated_at and claimed_at columns if they don't exist (for existing databases)
    ensure_column(
        'items',
        'updated_at',
        'updated_at TIMESTAMP',
        "UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL"
    )
    ensure_column('items', 'claimed_at', 'claimed_at TIMESTAMP')
    
    # Add name column if it doesn't exist (Sprint 4 enhancement)
    ensure_column(
        'items',
        'name',
        'name TEXT',
        "UPDATE items SET name = COALESCE(description, category) WHERE name IS NULL OR name = ''"
    )
    
    # Sessions table - tracks active sessions
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
    
    # Claims table - tracks item claims by students
    # Sprint 3: Item Claiming System
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
    
    # Activity Log table - audit trail for staff
    # Sprint 4: Activity Log (Issue #44)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_log (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_name TEXT,
            user_email TEXT,
            user_role TEXT,
            action_type TEXT NOT NULL CHECK(action_type IN (
                'item_added', 'item_updated', 'item_deleted',
                'claim_created', 'claim_approved', 'claim_rejected', 'claim_picked_up',
                'user_registered', 'user_login', 'profile_updated', 'password_changed',
                'data_export'
            )),
            entity_type TEXT CHECK(entity_type IN ('item', 'claim', 'user', 'profile')),
            entity_id INTEGER,
            details TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    # Create indexes for improved query performance
    # Sprint 3: Item Searching & Filtering (Backend)
    
    # Items table indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_location_found ON items(location_found)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_date_found ON items(date_found DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_pickup_at ON items(pickup_at)')
    
    # Composite indexes for common query patterns
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_status_date ON items(status, date_found DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_category_status ON items(category, status)')
    
    # Claims table indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_claims_item_id ON claims(item_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_claims_claimant_user_id ON claims(claimant_user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC)')
    
    # Users table indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)')
    
    # Activity Log table indexes (Sprint 4: Issue #44)
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_action_type ON activity_log(action_type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id)')
    
    # Notifications table - stores in-app notifications for users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL DEFAULT 'info',
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            metadata TEXT,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")
    print("✅ Database indexes created for optimal query performance")
    print("✅ Activity log table created for audit trail")

# Initialize database on startup
init_db()

def get_db_connection():
    """Get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def log_activity(action_type, entity_type=None, entity_id=None, details=None, user_id=None, user_info=None):
    """
    Log an activity to the audit trail.
    Sprint 4: Issue #44 - Activity Log
    
    Args:
        action_type: Type of action performed
        entity_type: Type of entity affected (item, claim, user, profile)
        entity_id: ID of the entity affected
        details: Additional details about the action (JSON string)
        user_id: ID of the user who performed the action
        user_info: Dictionary with user information (name, email, role)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user info from session if not provided
        if user_id is None and session.get('user_id'):
            user_id = session.get('user_id')
            user_info = {
                'name': session.get('name'),
                'email': session.get('email'),
                'role': session.get('role')
            }
        
        # Get IP address
        ip_address = request.remote_addr if request else None
        
        cursor.execute('''
            INSERT INTO activity_log (
                user_id, user_name, user_email, user_role,
                action_type, entity_type, entity_id, details, ip_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            user_info.get('name') if user_info else None,
            user_info.get('email') if user_info else None,
            user_info.get('role') if user_info else None,
            action_type,
            entity_type,
            entity_id,
            details,
            ip_address
        ))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Warning: Failed to log activity: {e}")
        # Don't let logging failures break the application


def serialize_notification_row(row):
    """Convert a notification sqlite row to a dict with parsed metadata."""
    metadata = None
    if row['metadata']:
        try:
            metadata = json.loads(row['metadata'])
        except (json.JSONDecodeError, TypeError):
            metadata = row['metadata']
    return {
        'notification_id': row['notification_id'],
        'user_id': row['user_id'],
        'type': row['type'],
        'title': row['title'],
        'message': row['message'],
        'metadata': metadata,
        'is_read': bool(row['is_read']),
        'created_at': row['created_at'],
        'read_at': row['read_at']
    }


def insert_notification(cursor, user_id, title, message, notification_type='info', metadata=None):
    """
    Insert a notification using an existing DB cursor so it can participate in the current transaction.
    """
    if not user_id:
        return
    metadata_json = json.dumps(metadata) if metadata is not None else None

    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'")
        if cursor.fetchone() is None:
            # Notifications table does not exist in this environment (e.g., tests) – skip gracefully
            return

        cursor.execute('''
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, notification_type, title, message, metadata_json))
    except sqlite3.Error as exc:
        print(f"Warning: skipped notification insert because table is unavailable ({exc})")


def hash_password(password):
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, password_hash):
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

# Create default staff account for testing (password: admin123)
# This runs on every startup to ensure the account exists
def create_default_staff_account():
    """Create default staff account if it doesn't exist, or reset password if it does."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ? AND role = ?', ('admin@uwaterloo.ca', 'staff'))
        existing_user = cursor.fetchone()
        
        # Always create fresh hash
        admin_hash = hash_password('admin123')
        
        # Verify the hash works before storing
        test_verify = verify_password('admin123', admin_hash)
        if not test_verify:
            print("ERROR: Generated password hash does not verify! This is a critical error.")
        
        if not existing_user:
            # Create new admin account
            cursor.execute('''
                INSERT INTO users (email, name, password_hash, role)
                VALUES (?, ?, ?, ?)
            ''', ('admin@uwaterloo.ca', 'Admin User', admin_hash, 'staff'))
            conn.commit()
            print("✅ Default staff account created: admin@uwaterloo.ca / admin123")
            print(f"   Hash verification test: {test_verify}")
        else:
            # Update password hash to ensure it's correct
            cursor.execute('''
                UPDATE users 
                SET password_hash = ?
                WHERE email = ? AND role = ?
            ''', (admin_hash, 'admin@uwaterloo.ca', 'staff'))
            conn.commit()
            print("✅ Default staff account password reset: admin@uwaterloo.ca / admin123")
            print(f"   Hash verification test: {test_verify}")
        conn.close()
    except Exception as e:
        print(f"❌ ERROR: Could not create default staff account: {e}")
        import traceback
        traceback.print_exc()

# Create default staff account on startup
create_default_staff_account()

def validate_uwaterloo_email(email):
    """
    Validate that email is a @uwaterloo.ca email address.
    
    Args:
        email (str): Email address to validate
        
    Returns:
        bool: True if email ends with @uwaterloo.ca, False otherwise
    """
    if not email or not isinstance(email, str):
        return False
    return email.lower().endswith('@uwaterloo.ca') and '@' in email and email.count('@') == 1

def require_auth(f):
    """Decorator to require authentication for endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def require_role(*allowed_roles):
    """Decorator to require specific role(s) for endpoints."""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            user_role = session.get('role')
            user_id = session.get('user_id')
            print(f"🔐 [AUTH] Role check - User ID: {user_id}, Role: {user_role}, Required: {allowed_roles}")
            if user_role not in allowed_roles:
                print(f"❌ [AUTH] Access denied - User role '{user_role}' not in {allowed_roles}")
                return jsonify({'error': f'Insufficient privileges. Required role: {allowed_roles}, your role: {user_role}'}), 403
            print(f"✅ [AUTH] Access granted")
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.route('/auth/login', methods=['POST'])
def login():
    """
    Login endpoint for students and staff.
    Requires @uwaterloo.ca email address and password.
    
    Request body:
    {"email": "user@uwaterloo.ca", "password": "password"}
    
    Returns:
    - 200: Success with user info and session
    - 400: Missing required fields or invalid email domain
    - 401: Invalid credentials
    """
    data = request.get_json()
    
    if not data:
        print("Login attempt: No request body")
        return jsonify({'error': 'Request body required'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    print(f"Login attempt for email: {email}")
    
    if not email or not password:
        print("Login attempt: Missing email or password")
        return jsonify({'error': 'Missing required fields: email and password'}), 400
    
    # Validate email is @uwaterloo.ca
    if not validate_uwaterloo_email(email):
        print(f"Login attempt: Invalid email format: {email}")
        return jsonify({'error': 'Only @uwaterloo.ca email addresses are accepted'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists (student or staff)
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        print(f"Login attempt: User not found: {email}")
        return jsonify({'error': 'Invalid email or password'}), 401
    
    print(f"User found: {user['email']}, Role: {user['role']}")
    
    # Verify password
    try:
        password_valid = verify_password(password, user['password_hash'])
        print(f"Password verification result: {password_valid}")
        if not password_valid:
            print(f"Password verification failed for user: {email}")
            return jsonify({'error': 'Invalid email or password'}), 401
    except Exception as e:
        print(f"Password verification error: {e}")
        print(f"Error type: {type(e).__name__}")
        print(f"User hash type: {type(user['password_hash'])}")
        print(f"User hash value (first 50 chars): {str(user['password_hash'])[:50] if user['password_hash'] else 'None'}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Update last login
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET last_login = ? WHERE user_id = ?', 
                  (datetime.now().isoformat(), user['user_id']))
    conn.commit()
    conn.close()
    
    # Set session
    session['user_id'] = user['user_id']
    session['email'] = user['email']
    session['role'] = user['role']
    session['name'] = user['name']
    session.permanent = True
    
    return jsonify({
        'message': 'Login successful',
        'user': {
            'user_id': user['user_id'],
            'email': user['email'],
            'name': user['name'],
            'role': user['role']
        }
    }), 200

@app.route('/auth/register', methods=['POST'])
def register():
    """
    Registration endpoint for students and staff.
    Only accepts @uwaterloo.ca email addresses.
    Default role is 'student'. Staff role can be assigned by admin or via special flag.
    
    Request body:
    {"email": "user@uwaterloo.ca", "password": "password", "name": "John Doe", "role": "student"}
    
    Optional: "role" field (defaults to "student"). Staff registration may require admin approval.
    
    Returns:
    - 201: Account created successfully
    - 400: Missing fields, validation error, or invalid email domain
    - 409: Email already exists
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body required'}), 400
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role', 'student').lower()  # Default to student
    
    if not email or not password or not name:
        return jsonify({'error': 'Missing required fields: email, password, and name'}), 400
    
    # Validate email is @uwaterloo.ca
    if not validate_uwaterloo_email(email):
        return jsonify({'error': 'Only @uwaterloo.ca email addresses are accepted for registration'}), 400
    
    # Validate role
    if role not in ['student', 'staff']:
        return jsonify({'error': 'Invalid role. Must be "student" or "staff"'}), 400
    
    # Password validation
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if email already exists
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create account (default to student, staff requires explicit role)
    password_hash = hash_password(password)
    cursor.execute('''
        INSERT INTO users (email, name, password_hash, role)
        VALUES (?, ?, ?, ?)
    ''', (email, name, password_hash, role))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Account created successfully',
        'user': {
            'user_id': user_id,
            'email': email,
            'name': name,
            'role': role
        }
    }), 201

@app.route('/auth/logout', methods=['POST'])
@require_auth
def logout():
    """
    Logout endpoint.
    Clears the user's session.
    
    Returns:
    - 200: Logout successful
    - 401: Not authenticated
    """
    user_id = session.get('user_id')
    session.clear()
    
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/auth/verify-session', methods=['GET'])
def verify_session():
    """
    Verify if the current session is valid and return user information.
    
    Returns:
    - 200: Session valid with user info
    - 401: Session invalid or expired
    """
    if 'user_id' not in session:
        return jsonify({'error': 'Session invalid or expired'}), 401
    
    return jsonify({
        'valid': True,
        'user': {
            'user_id': session.get('user_id'),
            'email': session.get('email'),
            'name': session.get('name'),
            'role': session.get('role')
        }
    }), 200

@app.route('/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    """
    Get current authenticated user information.
    
    Returns:
    - 200: User information
    - 401: Not authenticated
    """
    return jsonify({
        'user_id': session.get('user_id'),
        'email': session.get('email'),
        'name': session.get('name'),
        'role': session.get('role')
    }), 200


@app.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    """
    Send password recovery email to user.
    Sprint 4: Issue #42 - Email Notifications
    
    Request body:
    {
        "email": "user@uwaterloo.ca"
    }
    
    Returns:
    - 200: Email sent successfully (always returns success even if email doesn't exist for security)
    - 400: Missing email or invalid format
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body required'}), 400
    
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Validate email format
    if '@' not in email or not email.endswith('@uwaterloo.ca'):
        return jsonify({'error': 'Please provide a valid @uwaterloo.ca email'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find user by email
        cursor.execute('SELECT user_id, name, email, password FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        
        conn.close()
        
        # Always return success for security (don't reveal if email exists)
        # But only send email if user found
        if user:
            # Decrypt password (in production, this would send a reset link instead)
            # For this project, we'll send the actual password as requested
            stored_password_hash = user['password']
            
            # Since we can't decrypt bcrypt hashes, we'll inform user to contact admin
            # In a real scenario, we'd use password reset tokens
            # For this demo, we'll need to store a recoverable password or use reset tokens
            
            # For now, let's send an email telling them to contact support
            # (In production, you'd implement proper password reset tokens)
            try:
                # Note: This sends a message to contact support since we can't retrieve bcrypt password
                # A proper implementation would use password reset tokens
                subject = "Password Recovery - UW Lost & Found"
                html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #6610f2 0%, #520dc2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }}
        .footer {{ text-align: center; padding: 20px; color: #888; font-size: 12px; }}
        .info-box {{ background: #e7f3ff; padding: 15px; border-left: 4px solid #003366; margin: 15px 0; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Recovery Request</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{user['name']}</strong>,</p>
            
            <p>We received a request to recover your password for the UW Lost & Found system.</p>
            
            <div class="info-box">
                <strong>Account Email:</strong> {user['email']}
            </div>
            
            <p><strong>To reset your password:</strong></p>
            <ol>
                <li>Visit the Lost & Found office during business hours</li>
                <li>Present your valid student ID</li>
                <li>Request a password reset from staff</li>
            </ol>
            
            <p>For security reasons, passwords cannot be recovered via email. Staff will help you create a new password.</p>
            
            <p><strong>If you did not request this:</strong> Please ignore this email. Your account is secure.</p>
        </div>
        <div class="footer">
            <p>University of Waterloo Lost & Found System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
                text_body = f"""
UW Lost & Found - Password Recovery Request

Hi {user['name']},

We received a request to recover your password.

Account Email: {user['email']}

To reset your password:
1. Visit the Lost & Found office during business hours
2. Present your valid student ID
3. Request a password reset from staff

For security reasons, passwords cannot be recovered via email.

If you did not request this, please ignore this email.

---
University of Waterloo Lost & Found System
This is an automated message. Please do not reply to this email.
"""
                
                email_utils.send_email(
                    to_email=user['email'],
                    subject=subject,
                    html_body=html_body,
                    text_body=text_body
                )
            except Exception as e:
                print(f"Warning: Failed to send password recovery email: {e}")
        
        # Always return success for security
        return jsonify({
            'message': 'If an account exists with this email, password recovery instructions have been sent.'
        }), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/auth/profile', methods=['PATCH'])
@require_auth
def update_profile():
    """
    Update user profile information (name, email).
    Sprint 4: Issue #43 - User Profile Management
    
    Request body:
    {
        "name": "New Name" (optional),
        "email": "newemail@uwaterloo.ca" (optional)
    }
    
    Returns:
    - 200: Profile updated successfully
    - 400: Validation error
    - 409: Email already in use
    - 500: Database error
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body required'}), 400
    
    user_id = session.get('user_id')
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    
    # At least one field must be provided
    if not name and not email:
        return jsonify({'error': 'Please provide at least one field to update'}), 400
    
    # Validate name if provided
    if name and len(name) < 2:
        return jsonify({'error': 'Name must be at least 2 characters'}), 400
    
    # Validate email if provided
    if email:
        if '@' not in email or not email.endswith('@uwaterloo.ca'):
            return jsonify({'error': 'Email must be a valid @uwaterloo.ca address'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # If email is being changed, check if it's already in use
        if email:
            cursor.execute('SELECT user_id FROM users WHERE email = ? AND user_id != ?', (email, user_id))
            existing_user = cursor.fetchone()
            
            if existing_user:
                conn.close()
                return jsonify({'error': 'This email is already in use by another account'}), 409
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        if name:
            update_fields.append('name = ?')
            update_values.append(name)
        
        if email:
            update_fields.append('email = ?')
            update_values.append(email)
        
        update_values.append(user_id)
        
        # Update user
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE user_id = ?"
        cursor.execute(query, update_values)
        conn.commit()
        
        # Get updated user info
        cursor.execute('SELECT user_id, name, email, role FROM users WHERE user_id = ?', (user_id,))
        updated_user = cursor.fetchone()
        conn.close()
        
        # Update session with new info
        if name:
            session['name'] = name
        if email:
            session['email'] = email
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'user_id': updated_user['user_id'],
                'name': updated_user['name'],
                'email': updated_user['email'],
                'role': updated_user['role']
            }
        }), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to update profile'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/auth/change-password', methods=['POST'])
@require_auth
def change_password():
    """
    Change user password.
    Sprint 4: Issue #43 - User Profile Management
    
    Request body:
    {
        "current_password": "oldpassword",
        "new_password": "newpassword",
        "confirm_password": "newpassword"
    }
    
    Returns:
    - 200: Password changed successfully
    - 400: Validation error
    - 401: Current password incorrect
    - 500: Database error
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body required'}), 400
    
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')
    
    # Validate all fields present
    if not current_password:
        return jsonify({'error': 'Current password is required'}), 400
    if not new_password:
        return jsonify({'error': 'New password is required'}), 400
    if not confirm_password:
        return jsonify({'error': 'Password confirmation is required'}), 400
    
    # Validate new password length
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    # Validate passwords match
    if new_password != confirm_password:
        return jsonify({'error': 'New passwords do not match'}), 400
    
    # Validate new password is different
    if current_password == new_password:
        return jsonify({'error': 'New password must be different from current password'}), 400
    
    user_id = session.get('user_id')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user's current password hash
        cursor.execute('SELECT password, name, email FROM users WHERE user_id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password
        if not bcrypt.checkpw(current_password.encode('utf-8'), user['password']):
            conn.close()
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Hash new password
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        
        # Update password
        cursor.execute('UPDATE users SET password = ? WHERE user_id = ?', (new_password_hash, user_id))
        conn.commit()
        conn.close()
        
        # Send confirmation email (optional)
        try:
            subject = "Password Changed - UW Lost & Found"
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }}
        .footer {{ text-align: center; padding: 20px; color: #888; font-size: 12px; }}
        .success-box {{ background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; border-radius: 4px; }}
        .warning {{ background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Changed Successfully</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{user['name']}</strong>,</p>
            
            <p>Your password for the UW Lost & Found system has been changed successfully.</p>
            
            <div class="success-box">
                <strong>Account Email:</strong> {user['email']}<br>
                <strong>Changed:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            </div>
            
            <div class="warning">
                <strong>⚠️ Did you make this change?</strong><br>
                If you did not change your password, please contact us immediately and reset your password.
            </div>
            
            <p>For your security, you can now use your new password to log in to your account.</p>
        </div>
        <div class="footer">
            <p>University of Waterloo Lost & Found System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
            text_body = f"""
UW Lost & Found - Password Changed

Hi {user['name']},

Your password has been changed successfully.

Account Email: {user['email']}
Changed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

If you did not make this change, please contact us immediately.

---
University of Waterloo Lost & Found System
This is an automated message. Please do not reply to this email.
"""
            
            email_utils.send_email(
                to_email=user['email'],
                subject=subject,
                html_body=html_body,
                text_body=text_body
            )
        except Exception as e:
            print(f"Warning: Failed to send password change confirmation email: {e}")
        
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to change password'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


# ============================================================================
# Test/Health Endpoints
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'service': 'UW Lost-and-Found Auth API'}), 200

# ============================================================================
# Items Endpoints
# ============================================================================

@app.route('/api/items', methods=['GET'])
@require_auth
def get_items():
    """
    Retrieve lost items from the database with advanced filtering, searching, sorting, and pagination.
    Sprint 3: Item Searching & Filtering (Backend)
    Only accessible to authenticated students and staff.
    
    Query Parameters:
    - search: Text search across description, category, location_found (optional)
    - category: Filter by exact category (optional)
    - location: Filter by location_found (case-insensitive partial match) (optional)
    - status: Filter by status (unclaimed, claimed) (optional)
    - sort: Sort order - 'recent' (newest first) or 'oldest' (oldest first), default 'recent' (optional)
    - page: Page number for pagination (default: 1) (optional)
    - page_size: Number of items per page (default: 20, max: 100) (optional)
    
    Returns:
    - 200: Paginated list of items with metadata
    - 400: Invalid parameters
    - 401: Not authenticated
    - 500: Database error
    
    Response format:
    {
        "items": [...],
        "pagination": {
            "page": 1,
            "page_size": 20,
            "total_count": 45,
            "total_pages": 3
        }
    }
    """
    try:
        # Parse query parameters
        search_query = request.args.get('search', '').strip()
        category_filter = request.args.get('category', '').strip()
        location_filter = request.args.get('location', '').strip()
        status_filter = request.args.get('status', '').strip()
        sort_order = request.args.get('sort', 'recent').strip().lower()
        
        # Parse pagination parameters
        try:
            page = int(request.args.get('page', 1))
            page_size = int(request.args.get('page_size', 20))
        except ValueError:
            return jsonify({'error': 'Invalid page or page_size parameter. Must be integers.'}), 400
        
        # Validate parameters
        if page < 1:
            return jsonify({'error': 'Page must be >= 1'}), 400
        
        if page_size < 1 or page_size > 100:
            return jsonify({'error': 'Page size must be between 1 and 100'}), 400
        
        if sort_order not in ['recent', 'oldest']:
            return jsonify({'error': "Sort must be 'recent' or 'oldest'"}), 400
        
        if status_filter and status_filter not in ['unclaimed', 'claimed']:
            return jsonify({'error': "Status must be 'unclaimed' or 'claimed'"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build WHERE clause
        where_clauses = ["status != 'deleted'"]
        params = []
        
        # Text search (searches in description, category, location_found)
        if search_query:
            search_pattern = f'%{search_query}%'
            where_clauses.append('''(
                description LIKE ? OR 
                category LIKE ? OR 
                location_found LIKE ? OR
                pickup_at LIKE ? OR
                found_by_desk LIKE ?
            )''')
            params.extend([search_pattern] * 5)
        
        # Category filter (exact match, case-insensitive)
        if category_filter:
            where_clauses.append('LOWER(category) = LOWER(?)')
            params.append(category_filter)
        
        # Location filter (partial match, case-insensitive)
        if location_filter:
            where_clauses.append('LOWER(location_found) LIKE LOWER(?)')
            params.append(f'%{location_filter}%')
        
        # Status filter
        if status_filter:
            where_clauses.append('status = ?')
            params.append(status_filter)
        
        where_clause = ' AND '.join(where_clauses)
        
        # Count total matching items (for pagination metadata)
        count_query = f'SELECT COUNT(*) as total FROM items WHERE {where_clause}'
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()['total']
        
        # Calculate pagination
        total_pages = (total_count + page_size - 1) // page_size  # Ceiling division
        offset = (page - 1) * page_size
        
        # Determine sort order
        if sort_order == 'recent':
            order_by = 'date_found DESC, created_at DESC'
        else:  # oldest
            order_by = 'date_found ASC, created_at ASC'
        
        # Build main query with pagination
        query = f'''
            SELECT 
                item_id,
                name,
                description,
                category,
                location_found,
                pickup_at,
                date_found,
                status,
                image_url,
                found_by_desk,
                created_at,
                (SELECT status FROM claims WHERE item_id = items.item_id ORDER BY updated_at DESC LIMIT 1) AS latest_claim_status,
                (SELECT claim_id FROM claims WHERE item_id = items.item_id ORDER BY updated_at DESC LIMIT 1) AS latest_claim_id,
                (SELECT claimant_name FROM claims WHERE item_id = items.item_id ORDER BY updated_at DESC LIMIT 1) AS latest_claimant_name,
                (SELECT COUNT(*) FROM claims WHERE item_id = items.item_id AND status = 'pending') AS pending_claims,
                (SELECT COUNT(*) FROM claims WHERE item_id = items.item_id AND status = 'approved') AS approved_claims,
                (SELECT COUNT(*) FROM claims WHERE item_id = items.item_id AND status = 'picked_up') AS picked_up_claims
            FROM items
            WHERE {where_clause}
            ORDER BY {order_by}
            LIMIT ? OFFSET ?
        '''
        
        params.extend([page_size, offset])
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        # Convert rows to list of dictionaries
        items = []
        for row in rows:
            items.append({
                'item_id': row['item_id'],
                'name': row['name'] or row['description'] or row['category'],
                'description': row['description'],
                'category': row['category'],
                'location_found': row['location_found'],
                'pickup_at': row['pickup_at'],
                'date_found': row['date_found'],
                'status': row['status'],
                'image_url': row['image_url'],
                'found_by_desk': row['found_by_desk'],
                'created_at': row['created_at'],
                'latest_claim_status': row['latest_claim_status'],
                'latest_claim_id': row['latest_claim_id'],
                'latest_claimant_name': row['latest_claimant_name'],
                'pending_claims': row['pending_claims'],
                'approved_claims': row['approved_claims'],
                'picked_up_claims': row['picked_up_claims'],
                'is_picked_up': (row['picked_up_claims'] or 0) > 0
            })
        
        return jsonify({
            'items': items,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': total_pages
            }
        }), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to retrieve items'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/items/<int:item_id>', methods=['GET'])
@require_auth
def get_item_by_id(item_id):
    """
    Retrieve a single item by ID.
    Students cannot access deleted items, but staff can so they can verify
    destructive actions (e.g., delete confirmations).
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT 
                item_id,
                name,
                description,
                category,
                location_found,
                pickup_at,
                date_found,
                status,
                image_url,
                found_by_desk,
                created_at,
                updated_at,
                claimed_at
            FROM items
            WHERE item_id = ?
        ''', (item_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({'error': 'Item not found'}), 404

        user_role = session.get('role')
        if row['status'] == 'deleted' and user_role != 'staff':
            return jsonify({'error': 'Item not found'}), 404

        item = {
            'item_id': row['item_id'],
            'name': row['name'],
            'description': row['description'],
            'category': row['category'],
            'location_found': row['location_found'],
            'pickup_at': row['pickup_at'],
            'date_found': row['date_found'],
            'status': row['status'],
            'image_url': row['image_url'],
            'found_by_desk': row['found_by_desk'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
            'claimed_at': row['claimed_at']
        }

        return jsonify({'item': item}), 200

    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to retrieve item'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/api/items', methods=['POST'])
@require_role('staff')
def create_item():
    """
    Create a new lost-and-found item.
    Only accessible to authenticated staff members.
    
    Request body:
    {
        "description": "Lost wallet",
        "category": "cards",
        "location_found": "Library",
        "pickup_at": "SLC",
        "date_found": "2025-11-20 10:00:00",
        "image_url": "https://example.com/image.jpg",
        "found_by_desk": "SLC",
        "status": "unclaimed"
    }
    
    Required fields: category, location_found, pickup_at, date_found, found_by_desk
    Optional fields: description, image_url, status (defaults to 'unclaimed')
    
    Returns:
    - 201: Item created successfully
    - 400: Missing required fields or validation error
    - 403: Not staff (insufficient privileges)
    - 500: Database error
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body required'}), 400
    
    # Validate required fields
    required_fields = ['name', 'category', 'location_found', 'pickup_at', 'date_found', 'found_by_desk']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate pickup_at
    valid_pickup_locations = ['SLC', 'PAC', 'CIF']
    if data.get('pickup_at') not in valid_pickup_locations:
        return jsonify({
            'error': f'Invalid pickup_at. Must be one of: {", ".join(valid_pickup_locations)}'
        }), 400
    
    # Validate status if provided
    if 'status' in data and data['status'] not in ['unclaimed', 'claimed', 'deleted']:
        return jsonify({
            'error': "Invalid status. Must be one of: 'unclaimed', 'claimed', 'deleted'"
        }), 400
    
    # Validate date_found format (should be ISO format or SQLite datetime format)
    date_found = data.get('date_found')
    try:
        # Try to parse the date to ensure it's valid
        if isinstance(date_found, str):
            datetime.fromisoformat(date_found.replace('Z', '+00:00'))
        elif not isinstance(date_found, str):
            return jsonify({'error': 'date_found must be a string in ISO format'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid date_found format. Use ISO format (YYYY-MM-DD HH:MM:SS)'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user ID from session
        user_id = session.get('user_id')
        
        # Insert new item
        current_timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
            INSERT INTO items (
                name,
                description,
                category,
                location_found,
                pickup_at,
                date_found,
                status,
                image_url,
                found_by_desk,
                created_by_user_id,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'),
            data.get('description'),
            data.get('category'),
            data.get('location_found'),
            data.get('pickup_at'),
            data.get('date_found'),
            data.get('status', 'unclaimed'),
            data.get('image_url'),
            data.get('found_by_desk'),
            user_id,
            current_timestamp
        ))
        
        item_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Return created item
        return jsonify({
            'message': 'Item created successfully',
            'item': {
                'item_id': item_id,
                'name': data.get('name'),
                'description': data.get('description'),
                'category': data.get('category'),
                'location_found': data.get('location_found'),
                'pickup_at': data.get('pickup_at'),
                'date_found': data.get('date_found'),
                'status': data.get('status', 'unclaimed'),
                'image_url': data.get('image_url'),
                'found_by_desk': data.get('found_by_desk'),
                'created_by_user_id': user_id,
                'updated_at': current_timestamp
            }
        }), 201
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to create item'}), 500
    except Exception as err:
        print(f"Error: {err}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/items/<int:item_id>', methods=['PUT'])
@require_role('staff')
def update_item(item_id):
    """
    Update an existing lost-and-found item.
    Only accessible to authenticated staff members.
    
    Sprint 4: Edit functionality for items
    
    Returns:
    - 200: Item updated successfully
    - 400: Invalid data
    - 403: Not staff
    - 404: Item not found
    - 500: Database error
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body required'}), 400
    
    # Validate pickup_at if provided
    if 'pickup_at' in data:
        valid_pickup_locations = ['SLC', 'PAC', 'CIF']
        if data.get('pickup_at') not in valid_pickup_locations:
            return jsonify({
                'error': f'Invalid pickup_at. Must be one of: {", ".join(valid_pickup_locations)}'
            }), 400
    
    # Validate status if provided
    if 'status' in data and data['status'] not in ['unclaimed', 'claimed', 'deleted']:
        return jsonify({
            'error': "Invalid status. Must be one of: 'unclaimed', 'claimed', 'deleted'"
        }), 400
    
    try:
        print(f"\n{'='*60}")
        print(f"[UPDATE ITEM] Item ID: {item_id}")
        print(f"[UPDATE ITEM] Received data: {data}")
        print(f"{'='*60}\n")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if item exists
        cursor.execute('SELECT item_id, name FROM items WHERE item_id = ?', (item_id,))
        item = cursor.fetchone()
        
        if not item:
            conn.close()
            return jsonify({'error': 'Item not found'}), 404
        
        print(f"[UPDATE ITEM] Current item name: {item['name']}")
        
        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []
        
        allowed_fields = ['name', 'description', 'category', 'location_found', 'pickup_at', 
                         'date_found', 'status', 'image_url', 'found_by_desk']
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f'{field} = ?')
                update_values.append(data[field])
                print(f"[UPDATE ITEM] Will update {field} = {data[field]}")
        
        if not update_fields:
            conn.close()
            return jsonify({'error': 'No fields to update'}), 400
        
        # Always update the updated_at timestamp
        update_fields.append('updated_at = CURRENT_TIMESTAMP')
        
        # Add item_id to values for WHERE clause
        update_values.append(item_id)
        
        # Execute update
        update_query = f"UPDATE items SET {', '.join(update_fields)} WHERE item_id = ?"
        print(f"[UPDATE ITEM] SQL Query: {update_query}")
        print(f"[UPDATE ITEM] SQL Values: {update_values}")
        
        cursor.execute(update_query, update_values)
        conn.commit()
        
        print(f"[UPDATE ITEM] ✅ Update committed successfully")
        
        # Get updated item
        cursor.execute('SELECT * FROM items WHERE item_id = ?', (item_id,))
        updated_item = dict(cursor.fetchone())
        
        conn.close()
        
        # Log activity
        log_activity(
            user_id=session.get('user_id'),
            action_type='item_updated',
            entity_type='item',
            entity_id=item_id,
            details=f"Updated item: {updated_item.get('description', 'N/A')}"
        )
        
        return jsonify({
            'message': 'Item updated successfully',
            'item': updated_item
        }), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to update item'}), 500
    except Exception as err:
        print(f"Error: {err}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

# ============================================================================
# Archived Items Endpoint - Sprint 3: Pickup Tracking
# ============================================================================

@app.route('/api/items/archived', methods=['GET'])
@require_auth
def get_archived_items():
    """
    Get all archived items (picked up items with completed claims).
    Only accessible to staff members.
    
    Returns items that have been claimed and picked up, including claim details.
    
    Returns:
    - 200: List of archived items with claim information
    - 403: Not staff (insufficient privileges)
    - 500: Database error
    """
    # Check if user is staff
    try:
        user_id = session.get('user_id')
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT role FROM users WHERE user_id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user or user['role'] != 'staff':
            conn.close()
            return jsonify({'error': 'Insufficient privileges. Staff access required.'}), 403
        
        # Get all items with picked_up claims
        query = '''
            SELECT 
                i.item_id,
                i.name,
                i.description,
                i.category,
                i.location_found,
                i.pickup_at,
                i.date_found,
                i.image_url,
                i.found_by_desk,
                i.created_at as item_created_at,
                c.claim_id,
                c.claimant_name,
                c.claimant_email,
                c.claimant_phone,
                c.verification_text,
                c.status as claim_status,
                c.staff_notes,
                c.created_at as claim_created_at,
                c.updated_at as claim_updated_at,
                c.processed_by_staff_id,
                u.name as processed_by_staff_name
            FROM items i
            INNER JOIN claims c ON i.item_id = c.item_id
            LEFT JOIN users u ON c.processed_by_staff_id = u.user_id
            WHERE c.status = 'picked_up' AND i.status != 'deleted'
            ORDER BY c.updated_at DESC
        '''
        
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()
        
        archived_items = []
        for row in rows:
            archived_items.append({
                'item_id': row['item_id'],
                'name': row['name'] or row['description'] or row['category'],
                'description': row['description'],
                'category': row['category'],
                'location_found': row['location_found'],
                'pickup_at': row['pickup_at'],
                'date_found': row['date_found'],
                'image_url': row['image_url'],
                'found_by_desk': row['found_by_desk'],
                'item_created_at': row['item_created_at'],
                'claim': {
                    'claim_id': row['claim_id'],
                    'claimant_name': row['claimant_name'],
                    'claimant_email': row['claimant_email'],
                    'claimant_phone': row['claimant_phone'],
                    'verification_text': row['verification_text'],
                    'status': row['claim_status'],
                    'staff_notes': row['staff_notes'],
                    'created_at': row['claim_created_at'],
                    'updated_at': row['claim_updated_at'],
                    'processed_by_staff_id': row['processed_by_staff_id'],
                    'processed_by_staff_name': row['processed_by_staff_name']
                }
            })
        
        return jsonify({
            'archived_items': archived_items,
            'total_count': len(archived_items)
        }), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to retrieve archived items'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


# ============================================================================
# Analytics Endpoints - Sprint 4: Analytics Dashboard
# ============================================================================

@app.route('/api/analytics/dashboard', methods=['GET'])
@require_auth
@require_role('staff')
def get_analytics_dashboard():
    """
    Get comprehensive analytics data for the staff dashboard.
    Only accessible to authenticated staff.
    
    Returns statistics including:
    - Total items, claims, users
    - Approval rates
    - Items added per week (last 8 weeks)
    - Claims per category
    - Recent activity summary
    - Status breakdown
    
    Returns:
    - 200: Analytics data
    - 403: Not authorized (staff only)
    - 500: Server error
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # === BASIC COUNTS ===
        # Total items (excluding deleted)
        cursor.execute("SELECT COUNT(*) as count FROM items WHERE status != 'deleted'")
        total_items = cursor.fetchone()['count']
        
        # Total claims
        cursor.execute("SELECT COUNT(*) as count FROM claims")
        total_claims = cursor.fetchone()['count']
        
        # Total users
        cursor.execute("SELECT COUNT(*) as count FROM users")
        total_users = cursor.fetchone()['count']
        
        # Total students
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'")
        total_students = cursor.fetchone()['count']
        
        # Total staff
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'staff'")
        total_staff = cursor.fetchone()['count']
        
        # === CLAIMS STATISTICS ===
        # Pending claims
        cursor.execute("SELECT COUNT(*) as count FROM claims WHERE status = 'pending'")
        pending_claims = cursor.fetchone()['count']
        
        # Approved claims
        cursor.execute("SELECT COUNT(*) as count FROM claims WHERE status = 'approved'")
        approved_claims = cursor.fetchone()['count']
        
        # Rejected claims
        cursor.execute("SELECT COUNT(*) as count FROM claims WHERE status = 'rejected'")
        rejected_claims = cursor.fetchone()['count']
        
        # Picked up claims
        cursor.execute("SELECT COUNT(*) as count FROM claims WHERE status = 'picked_up'")
        picked_up_claims = cursor.fetchone()['count']
        
        # Approval rate (approved + picked_up / total)
        approval_rate = 0
        if total_claims > 0:
            approval_rate = ((approved_claims + picked_up_claims) / total_claims) * 100
        
        # === ITEMS STATISTICS ===
        # Unclaimed items
        cursor.execute("SELECT COUNT(*) as count FROM items WHERE status = 'unclaimed'")
        unclaimed_items = cursor.fetchone()['count']
        
        # Claimed items
        cursor.execute("SELECT COUNT(*) as count FROM items WHERE status = 'claimed'")
        claimed_items = cursor.fetchone()['count']
        
        # === ITEMS ADDED PER WEEK (Last 8 weeks) ===
        cursor.execute('''
            SELECT 
                strftime('%Y-%W', created_at) as week,
                COUNT(*) as count,
                MIN(created_at) as week_start
            FROM items
            WHERE status != 'deleted'
            AND created_at >= datetime('now', '-8 weeks')
            GROUP BY strftime('%Y-%W', created_at)
            ORDER BY week_start ASC
        ''')
        items_per_week = []
        for row in cursor.fetchall():
            items_per_week.append({
                'week': row['week'],
                'count': row['count'],
                'week_start': row['week_start']
            })
        
        # === CLAIMS PER CATEGORY ===
        cursor.execute('''
            SELECT 
                i.category,
                COUNT(DISTINCT c.claim_id) as claim_count
            FROM items i
            INNER JOIN claims c ON i.item_id = c.item_id
            WHERE i.status != 'deleted'
            GROUP BY i.category
            ORDER BY claim_count DESC
        ''')
        claims_per_category = []
        for row in cursor.fetchall():
            claims_per_category.append({
                'category': row['category'],
                'count': row['claim_count']
            })
        
        # === ITEMS PER CATEGORY ===
        cursor.execute('''
            SELECT 
                category,
                COUNT(*) as count
            FROM items
            WHERE status != 'deleted'
            GROUP BY category
            ORDER BY count DESC
        ''')
        items_per_category = []
        for row in cursor.fetchall():
            items_per_category.append({
                'category': row['category'],
                'count': row['count']
            })
        
        # === ITEMS PER LOCATION ===
        cursor.execute('''
            SELECT 
                location_found,
                COUNT(*) as count
            FROM items
            WHERE status != 'deleted'
            GROUP BY location_found
            ORDER BY count DESC
        ''')
        items_per_location = []
        for row in cursor.fetchall():
            items_per_location.append({
                'location': row['location_found'],
                'count': row['count']
            })
        
        # === RECENT ACTIVITY (Last 10 actions) ===
        # Combine recent items and recent claims
        cursor.execute('''
            SELECT 
                'item_added' as action_type,
                item_id as entity_id,
                description as entity_description,
                category,
                created_at as timestamp
            FROM items
            WHERE status != 'deleted'
            ORDER BY created_at DESC
            LIMIT 5
        ''')
        recent_items = cursor.fetchall()
        
        cursor.execute('''
            SELECT 
                'claim_submitted' as action_type,
                c.claim_id as entity_id,
                c.claimant_name as entity_description,
                i.category,
                c.created_at as timestamp
            FROM claims c
            INNER JOIN items i ON c.item_id = i.item_id
            ORDER BY c.created_at DESC
            LIMIT 5
        ''')
        recent_claims = cursor.fetchall()
        
        # Merge and sort by timestamp
        recent_activity = []
        for row in recent_items:
            recent_activity.append(dict(row))
        for row in recent_claims:
            recent_activity.append(dict(row))
        
        recent_activity = sorted(recent_activity, key=lambda x: x['timestamp'], reverse=True)[:10]
        
        # === CLAIMS TIMELINE (Last 8 weeks) ===
        cursor.execute('''
            SELECT 
                strftime('%Y-%W', created_at) as week,
                COUNT(*) as count,
                MIN(created_at) as week_start
            FROM claims
            WHERE created_at >= datetime('now', '-8 weeks')
            GROUP BY strftime('%Y-%W', created_at)
            ORDER BY week_start ASC
        ''')
        claims_per_week = []
        for row in cursor.fetchall():
            claims_per_week.append({
                'week': row['week'],
                'count': row['count'],
                'week_start': row['week_start']
            })
        
        conn.close()
        
        # Build response
        analytics_data = {
            'overview': {
                'total_items': total_items,
                'total_claims': total_claims,
                'total_users': total_users,
                'total_students': total_students,
                'total_staff': total_staff,
                'approval_rate': round(approval_rate, 1)
            },
            'claims_breakdown': {
                'pending': pending_claims,
                'approved': approved_claims,
                'rejected': rejected_claims,
                'picked_up': picked_up_claims
            },
            'items_breakdown': {
                'unclaimed': unclaimed_items,
                'claimed': claimed_items
            },
            'charts': {
                'items_per_week': items_per_week,
                'claims_per_week': claims_per_week,
                'claims_per_category': claims_per_category,
                'items_per_category': items_per_category,
                'items_per_location': items_per_location
            },
            'recent_activity': recent_activity
        }
        
        return jsonify(analytics_data), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to retrieve analytics data'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


# ============================================================================
# Notifications Endpoints
# ============================================================================

@app.route('/api/notifications', methods=['GET'])
@require_auth
def get_notifications():
    """
    Retrieve notifications for the logged-in user.
    Optional query params:
      - status: unread | read | all (default unread)
      - limit: number of notifications to return (default 10, max 100)
    """
    try:
        status_filter = request.args.get('status', 'unread').lower()
        limit = request.args.get('limit', 10, type=int)
        if not limit:
            limit = 10
        limit = max(1, min(limit, 100))
        
        user_id = session.get('user_id')
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM notifications WHERE user_id = ?'
        params = [user_id]
        
        if status_filter == 'unread':
            query += ' AND is_read = 0'
        elif status_filter == 'read':
            query += ' AND is_read = 1'
        # 'all' returns everything
        
        query += ' ORDER BY created_at DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        notifications = [serialize_notification_row(row) for row in rows]
        return jsonify({'notifications': notifications}), 200
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to load notifications'}), 500
    except Exception as err:
        print(f"Error: {err}")
        return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/api/notifications/<int:notification_id>/read', methods=['PATCH'])
@require_auth
def mark_notification_read(notification_id):
    """Mark a specific notification as read."""
    try:
        user_id = session.get('user_id')
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE notifications
            SET is_read = 1,
                read_at = CURRENT_TIMESTAMP
            WHERE notification_id = ? AND user_id = ?
        ''', (notification_id, user_id))
        conn.commit()
        updated = cursor.rowcount
        conn.close()
        
        if updated == 0:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify({'message': 'Notification marked as read'}), 200
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to update notification'}), 500
    except Exception as err:
        print(f"Error: {err}")
        return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/api/activity-log', methods=['GET'])
@require_auth
@require_role('staff')
def get_activity_log():
    """
    Get activity log entries for audit trail.
    Sprint 4: Issue #44 - Activity Log
    Staff-only endpoint.
    
    Query Parameters:
    - user_id: Filter by specific user (optional)
    - action_type: Filter by action type (optional)
    - start_date: Filter by start date (optional, format: YYYY-MM-DD)
    - end_date: Filter by end date (optional, format: YYYY-MM-DD)
    - page: Page number (default: 1)
    - page_size: Items per page (default: 50, max: 200)
    
    Returns:
    - 200: Activity log entries with pagination
    - 403: Not authorized (staff only)
    - 500: Server error
    """
    try:
        # Get query parameters
        user_id = request.args.get('user_id', type=int)
        action_type = request.args.get('action_type')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = max(1, request.args.get('page', 1, type=int))
        page_size = min(200, max(1, request.args.get('page_size', 50, type=int)))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build WHERE clause dynamically
        where_clauses = []
        params = []
        
        if user_id:
            where_clauses.append('user_id = ?')
            params.append(user_id)
        
        if action_type:
            where_clauses.append('action_type = ?')
            params.append(action_type)
        
        if start_date:
            where_clauses.append('DATE(created_at) >= ?')
            params.append(start_date)
        
        if end_date:
            where_clauses.append('DATE(created_at) <= ?')
            params.append(end_date)
        
        where_clause = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ''
        
        # Get total count
        count_query = f'SELECT COUNT(*) as count FROM activity_log {where_clause}'
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()['count']
        
        # Get paginated results
        offset = (page - 1) * page_size
        query = f'''
            SELECT * FROM activity_log
            {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        '''
        cursor.execute(query, params + [page_size, offset])
        logs = cursor.fetchall()
        
        conn.close()
        
        # Format results
        log_entries = []
        for log in logs:
            log_entries.append({
                'log_id': log['log_id'],
                'user_id': log['user_id'],
                'user_name': log['user_name'],
                'user_email': log['user_email'],
                'user_role': log['user_role'],
                'action_type': log['action_type'],
                'entity_type': log['entity_type'],
                'entity_id': log['entity_id'],
                'details': log['details'],
                'ip_address': log['ip_address'],
                'created_at': log['created_at']
            })
        
        total_pages = (total_count + page_size - 1) // page_size
        
        return jsonify({
            'logs': log_entries,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
        }), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to retrieve activity log'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/api/items/<int:item_id>', methods=['DELETE'])
@require_auth
@require_role('staff')
def delete_item(item_id):
    """
    Delete an item (soft delete - marks as deleted).
    Sprint 4: Issue #44 - Delete Item Feature
    Staff-only endpoint with audit logging.
    
    Returns:
    - 200: Item deleted successfully
    - 403: Not authorized (staff only)
    - 404: Item not found
    - 500: Server error
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if item exists
        cursor.execute('SELECT * FROM items WHERE item_id = ? AND status != ?', (item_id, 'deleted'))
        item = cursor.fetchone()
        
        if not item:
            conn.close()
            return jsonify({'error': 'Item not found or already deleted'}), 404
        
        # Soft delete the item with timestamp
        cursor.execute('''
            UPDATE items 
            SET status = 'deleted',
                updated_at = CURRENT_TIMESTAMP
            WHERE item_id = ?
        ''', (item_id,))
        
        conn.commit()
        conn.close()
        
        # Log the deletion
        log_activity(
            action_type='item_deleted',
            entity_type='item',
            entity_id=item_id,
            details=f"Deleted item: {item['category']} - {item['description'] or 'No description'}"
        )
        
        return jsonify({
            'message': 'Item deleted successfully',
            'item_id': item_id
        }), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to delete item'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


# ============================================================================
# Data Export Endpoints - Sprint 4: Issue #45
# ============================================================================

@app.route('/api/export/items/csv', methods=['GET'])
@require_auth
@require_role('staff')
def export_items_csv():
    """
    Export all items to CSV format.
    Sprint 4: Issue #45 - Data Export
    Staff-only endpoint.
    
    Query Parameters:
    - status: Filter by status (optional)
    - category: Filter by category (optional)
    
    Returns:
    - 200: CSV file download
    - 403: Not authorized
    - 500: Server error
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query with optional filters
        where_clauses = ["status != 'deleted'"]
        params = []
        
        status = request.args.get('status')
        if status:
            where_clauses.append('status = ?')
            params.append(status)
        
        category = request.args.get('category')
        if category:
            where_clauses.append('category = ?')
            params.append(category)
        
        where_clause = ' AND '.join(where_clauses)
        
        query = f'''
            SELECT 
                item_id, description, category, location_found, pickup_at,
                date_found, status, found_by_desk, created_at
            FROM items
            WHERE {where_clause}
            ORDER BY created_at DESC
        '''
        
        cursor.execute(query, params)
        items = cursor.fetchall()
        conn.close()
        
        # Create CSV in memory
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Item ID', 'Description', 'Category', 'Location Found', 
            'Pickup Location', 'Date Found', 'Status', 'Found By Desk', 'Created At'
        ])
        
        # Write data rows
        for item in items:
            writer.writerow([
                item['item_id'],
                item['description'] or '',
                item['category'],
                item['location_found'],
                item['pickup_at'],
                item['date_found'],
                item['status'],
                item['found_by_desk'],
                item['created_at']
            ])
        
        # Create response
        csv_data = output.getvalue()
        output.close()
        
        response = make_response(csv_data)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=lost_items_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        # Log activity
        log_activity(
            action_type='data_export',
            details=f'Exported {len(items)} items to CSV'
        )
        
        return response
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to export items'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/api/export/claims/csv', methods=['GET'])
@require_auth
@require_role('staff')
def export_claims_csv():
    """
    Export all claims to CSV format.
    Sprint 4: Issue #45 - Data Export
    Staff-only endpoint.
    
    Query Parameters:
    - status: Filter by claim status (optional)
    
    Returns:
    - 200: CSV file download
    - 403: Not authorized
    - 500: Server error
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query with optional filter
        where_clause = ""
        params = []
        
        status = request.args.get('status')
        if status:
            where_clause = "WHERE c.status = ?"
            params.append(status)
        
        query = f'''
            SELECT 
                c.claim_id, c.claimant_name, c.claimant_email, c.claimant_phone,
                c.verification_text, c.status, c.staff_notes, c.created_at, c.updated_at,
                i.item_id, i.description as item_description, i.category, 
                i.location_found, i.pickup_at,
                u.name as processed_by_staff_name
            FROM claims c
            INNER JOIN items i ON c.item_id = i.item_id
            LEFT JOIN users u ON c.processed_by_staff_id = u.user_id
            {where_clause}
            ORDER BY c.created_at DESC
        '''
        
        cursor.execute(query, params)
        claims = cursor.fetchall()
        conn.close()
        
        # Create CSV in memory
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Claim ID', 'Item ID', 'Item Description', 'Category', 'Location Found',
            'Pickup Location', 'Claimant Name', 'Claimant Email', 'Claimant Phone',
            'Verification Text', 'Status', 'Staff Notes', 'Processed By',
            'Submitted At', 'Updated At'
        ])
        
        # Write data rows
        for claim in claims:
            writer.writerow([
                claim['claim_id'],
                claim['item_id'],
                claim['item_description'] or '',
                claim['category'],
                claim['location_found'],
                claim['pickup_at'],
                claim['claimant_name'],
                claim['claimant_email'],
                claim['claimant_phone'] or '',
                claim['verification_text'],
                claim['status'],
                claim['staff_notes'] or '',
                claim['processed_by_staff_name'] or '',
                claim['created_at'],
                claim['updated_at']
            ])
        
        # Create response
        csv_data = output.getvalue()
        output.close()
        
        response = make_response(csv_data)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=claims_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        # Log activity
        log_activity(
            action_type='data_export',
            details=f'Exported {len(claims)} claims to CSV'
        )
        
        return response
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to export claims'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/api/export/activity-log/csv', methods=['GET'])
@require_auth
@require_role('staff')
def export_activity_log_csv():
    """
    Export activity log to CSV format.
    Sprint 4: Issue #45 - Data Export
    Staff-only endpoint.
    
    Query Parameters:
    - action_type: Filter by action type (optional)
    - start_date: Filter by start date (optional)
    - end_date: Filter by end date (optional)
    
    Returns:
    - 200: CSV file download
    - 403: Not authorized
    - 500: Server error
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query with optional filters
        where_clauses = []
        params = []
        
        action_type = request.args.get('action_type')
        if action_type:
            where_clauses.append('action_type = ?')
            params.append(action_type)
        
        start_date = request.args.get('start_date')
        if start_date:
            where_clauses.append('DATE(created_at) >= ?')
            params.append(start_date)
        
        end_date = request.args.get('end_date')
        if end_date:
            where_clauses.append('DATE(created_at) <= ?')
            params.append(end_date)
        
        where_clause = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ''
        
        query = f'''
            SELECT * FROM activity_log
            {where_clause}
            ORDER BY created_at DESC
        '''
        
        cursor.execute(query, params)
        logs = cursor.fetchall()
        conn.close()
        
        # Create CSV in memory
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Log ID', 'User ID', 'User Name', 'User Email', 'User Role',
            'Action Type', 'Entity Type', 'Entity ID', 'Details', 
            'IP Address', 'Created At'
        ])
        
        # Write data rows
        for log in logs:
            writer.writerow([
                log['log_id'],
                log['user_id'] or '',
                log['user_name'] or '',
                log['user_email'] or '',
                log['user_role'] or '',
                log['action_type'],
                log['entity_type'] or '',
                log['entity_id'] or '',
                log['details'] or '',
                log['ip_address'] or '',
                log['created_at']
            ])
        
        # Create response
        csv_data = output.getvalue()
        output.close()
        
        response = make_response(csv_data)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=activity_log_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        # Log activity
        log_activity(
            action_type='data_export',
            details=f'Exported {len(logs)} activity log entries to CSV'
        )
        
        return response
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to export activity log'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500


# ============================================================================
# Claims Endpoints - Sprint 3: Item Claiming System
# ============================================================================

@app.route('/api/claims', methods=['POST'])
@require_auth
def create_claim():
    """
    Create a new claim for a lost item.
    Only authenticated students and staff can create claims.
    
    Request body:
    {
        "item_id": 1,
        "verification_text": "This is my black wallet with student ID inside",
        "phone": "519-555-0123" (optional)
    }
    
    Returns:
    - 201: Claim created successfully
    - 400: Missing required fields or validation error
    - 404: Item not found
    - 409: Item already has an approved/picked up claim
    - 500: Database error
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body required'}), 400
    
    # Validate required fields
    item_id = data.get('item_id')
    verification_text = data.get('verification_text')
    
    if not item_id or not verification_text:
        return jsonify({'error': 'Missing required fields: item_id and verification_text'}), 400
    
    if not verification_text.strip():
        return jsonify({'error': 'verification_text cannot be empty'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user info from session
        user_id = session.get('user_id')
        
        # Get user details
        cursor.execute('SELECT email, name FROM users WHERE user_id = ?', (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Check if item exists and is unclaimed
        cursor.execute('SELECT item_id, status FROM items WHERE item_id = ?', (item_id,))
        item = cursor.fetchone()
        
        if not item:
            conn.close()
            return jsonify({'error': 'Item not found'}), 404
        
        if item['status'] == 'deleted':
            conn.close()
            return jsonify({'error': 'Item no longer available'}), 404
        
        # Check if there's already an approved or picked_up claim for this item
        cursor.execute('''
            SELECT claim_id, status FROM claims 
            WHERE item_id = ? AND status IN ('approved', 'picked_up')
        ''', (item_id,))
        existing_claim = cursor.fetchone()
        
        if existing_claim:
            conn.close()
            return jsonify({
                'error': 'This item already has an approved claim',
                'claim_status': existing_claim['status']
            }), 409
        
        # Check if this user has already submitted a claim for this item (prevent duplicates)
        cursor.execute('''
            SELECT claim_id, status FROM claims 
            WHERE item_id = ? AND claimant_user_id = ? AND status IN ('pending', 'approved')
        ''', (item_id, user_id))
        user_existing_claim = cursor.fetchone()
        
        if user_existing_claim:
            conn.close()
            return jsonify({
                'error': f'You have already submitted a claim for this item (Status: {user_existing_claim["status"]})',
                'claim_id': user_existing_claim['claim_id'],
                'claim_status': user_existing_claim['status']
            }), 409
        
        # Create new claim
        cursor.execute('''
            INSERT INTO claims (
                item_id,
                claimant_user_id,
                claimant_name,
                claimant_email,
                claimant_phone,
                verification_text,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
        ''', (
            item_id,
            user_id,
            user['name'],
            user['email'],
            data.get('phone'),
            verification_text
        ))
        
        claim_id = cursor.lastrowid
        conn.commit()
        
        # Get item description for email
        cursor.execute('SELECT description, category FROM items WHERE item_id = ?', (item_id,))
        item_data = cursor.fetchone()
        item_description = item_data['description'] or f"{item_data['category']} item"
        
        conn.close()
        
        # Send email notification (Sprint 4: Issue #42)
        try:
            email_utils.send_claim_submitted_email(
                claimant_name=user['name'],
                claimant_email=user['email'],
                item_description=item_description,
                claim_id=claim_id
            )
        except Exception as e:
            print(f"Warning: Failed to send claim submitted email: {e}")
        
        return jsonify({
            'message': 'Claim submitted successfully',
            'claim': {
                'claim_id': claim_id,
                'item_id': item_id,
                'claimant_name': user['name'],
                'claimant_email': user['email'],
                'claimant_phone': data.get('phone'),
                'verification_text': verification_text,
                'status': 'pending',
                'created_at': datetime.now().isoformat()
            }
        }), 201
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to create claim'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/claims', methods=['GET'])
@require_auth
def get_claims():
    """
    Get list of claims with optional filters.
    Students can see their own claims, staff can see all claims.
    
    Query parameters:
    - status: Filter by status (pending, approved, rejected, picked_up)
    - item_id: Filter by item ID
    - user_id: Filter by claimant user ID (staff only)
    
    Returns:
    - 200: List of claims
    - 401: Not authenticated
    - 500: Database error
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        user_id = session.get('user_id')
        user_role = session.get('role')
        
        # Build query based on role and filters
        query = '''
            SELECT 
                c.claim_id,
                c.item_id,
                c.claimant_user_id,
                c.claimant_name,
                c.claimant_email,
                c.claimant_phone,
                c.verification_text,
                c.status,
                c.staff_notes,
                c.created_at,
                c.updated_at,
                c.processed_by_staff_id,
                i.name AS item_name,
                i.description AS item_description,
                i.category AS item_category,
                i.pickup_at AS item_pickup_location,
                i.image_url AS item_image_url
            FROM claims c
            LEFT JOIN items i ON c.item_id = i.item_id
            WHERE 1=1
        '''
        params = []
        
        # Students can only see their own claims
        if user_role == 'student':
            query += ' AND c.claimant_user_id = ?'
            params.append(user_id)
        
        # Filter by status
        status_filter = request.args.get('status')
        if status_filter:
            query += ' AND c.status = ?'
            params.append(status_filter)
        
        # Filter by item_id
        item_id_filter = request.args.get('item_id')
        if item_id_filter:
            query += ' AND c.item_id = ?'
            params.append(item_id_filter)
        
        # Filter by user_id (staff only)
        user_id_filter = request.args.get('user_id')
        if user_id_filter and user_role == 'staff':
            query += ' AND c.claimant_user_id = ?'
            params.append(user_id_filter)
        
        query += ' ORDER BY c.created_at DESC'
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        # Convert rows to list of dictionaries
        claims = []
        for row in rows:
            claims.append({
                'claim_id': row['claim_id'],
                'item_id': row['item_id'],
                'claimant_user_id': row['claimant_user_id'],
                'claimant_name': row['claimant_name'],
                'claimant_email': row['claimant_email'],
                'claimant_phone': row['claimant_phone'],
                'verification_text': row['verification_text'],
                'status': row['status'],
                'staff_notes': row['staff_notes'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
                'processed_by_staff_id': row['processed_by_staff_id'],
                'item_description': row['item_description'],
                'item_category': row['item_category'],
                'item_pickup_location': row['item_pickup_location'],
                'item_name': row['item_name'] or row['item_description'] or row['item_category'],
                'item_image_url': row['item_image_url']
            })
        
        return jsonify({
            'claims': claims,
            'count': len(claims)
        }), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to retrieve claims'}), 500
    except Exception as err:
        print(f"Error: {err}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/claims/<int:claim_id>', methods=['GET'])
@require_auth
def get_claim(claim_id):
    """
    Get details of a specific claim.
    Students can only view their own claims, staff can view any claim.
    
    Returns:
    - 200: Claim details
    - 403: Not authorized to view this claim
    - 404: Claim not found
    - 500: Database error
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        user_id = session.get('user_id')
        user_role = session.get('role')
        
        # Get claim details with item information
        cursor.execute('''
            SELECT 
                c.claim_id,
                c.item_id,
                c.claimant_user_id,
                c.claimant_name,
                c.claimant_email,
                c.claimant_phone,
                c.verification_text,
                c.status,
                c.staff_notes,
                c.created_at,
                c.updated_at,
                c.processed_by_staff_id,
                i.name AS item_name,
                i.description AS item_description,
                i.category AS item_category,
                i.location_found AS item_location_found,
                i.pickup_at AS item_pickup_location,
                i.date_found AS item_date_found,
                i.image_url AS item_image_url,
                i.status AS item_status
            FROM claims c
            LEFT JOIN items i ON c.item_id = i.item_id
            WHERE c.claim_id = ?
        ''', (claim_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({'error': 'Claim not found'}), 404
        
        # Students can only view their own claims
        if user_role == 'student' and row['claimant_user_id'] != user_id:
            return jsonify({'error': 'Not authorized to view this claim'}), 403
        
        claim = {
            'claim_id': row['claim_id'],
            'item_id': row['item_id'],
            'claimant_user_id': row['claimant_user_id'],
            'claimant_name': row['claimant_name'],
            'claimant_email': row['claimant_email'],
            'claimant_phone': row['claimant_phone'],
            'verification_text': row['verification_text'],
            'status': row['status'],
            'staff_notes': row['staff_notes'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
            'processed_by_staff_id': row['processed_by_staff_id'],
            'item': {
                'name': row['item_name'] or row['item_description'] or row['item_category'],
                'description': row['item_description'],
                'category': row['item_category'],
                'location_found': row['item_location_found'],
                'pickup_at': row['item_pickup_location'],
                'date_found': row['item_date_found'],
                'image_url': row['item_image_url'],
                'status': row['item_status']
            }
        }
        
        return jsonify({'claim': claim}), 200
        
    except sqlite3.Error as err:
        print(f"Database Error: {err}")
        return jsonify({'error': 'Failed to retrieve claim'}), 500
    except Exception as err:
        print(f"Error: {err}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/claims/<int:claim_id>', methods=['PATCH'])
@require_role('staff')
def update_claim(claim_id):
    """
    Update a claim's status (staff only).
    Handles claim approval, rejection, and pickup.
    
    Request body:
    {
        "status": "approved" | "rejected" | "picked_up",
        "staff_notes": "Optional notes about the decision"
    }
    
    Status transitions:
    - pending → approved/rejected
    - approved → picked_up/rejected
    - rejected → approved (can reconsider)
    - picked_up is final (cannot change)
    
    When status changes to 'picked_up', the item's status is also updated to 'claimed'.
    Only one claim can be approved per item.
    
    Returns:
    - 200: Claim updated successfully
    - 400: Invalid status or transition
    - 404: Claim not found
    - 409: Conflict with business rules
    - 500: Database error
    """
    print(f"\n{'='*60}")
    print(f"🔵 [UPDATE_CLAIM] PATCH /api/claims/{claim_id}")
    print(f"🔵 [UPDATE_CLAIM] Staff ID: {session.get('user_id')}")
    print(f"🔵 [UPDATE_CLAIM] Staff Role: {session.get('role')}")
    
    data = request.get_json()
    print(f"🔵 [UPDATE_CLAIM] Request data: {data}")
    
    if not data:
        print(f"❌ [UPDATE_CLAIM] No request body")
        return jsonify({'error': 'Request body required'}), 400
    
    new_status = data.get('status')
    staff_notes = data.get('staff_notes', '')
    print(f"🔵 [UPDATE_CLAIM] New status: {new_status}, Notes: {staff_notes}")
    
    if not new_status:
        return jsonify({'error': 'Missing required field: status'}), 400
    
    # Validate status
    valid_statuses = ['pending', 'approved', 'rejected', 'picked_up']
    if new_status not in valid_statuses:
        return jsonify({
            'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
        }), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        staff_id = session.get('user_id')
        
        # Get current claim status
        cursor.execute('SELECT claim_id, item_id, status, claimant_user_id FROM claims WHERE claim_id = ?', (claim_id,))
        claim = cursor.fetchone()
        
        if not claim:
            conn.close()
            return jsonify({'error': 'Claim not found'}), 404
        
        current_status = claim['status']
        item_id = claim['item_id']
        claimant_user_id = claim['claimant_user_id']
        
        # Validate status transition
        # picked_up is final - cannot be changed
        if current_status == 'picked_up':
            conn.close()
            return jsonify({
                'error': 'Cannot modify a claim that has been picked up'
            }), 400
        
        # If approving, check if there's already an approved claim for this item
        if new_status == 'approved':
            cursor.execute('''
                SELECT claim_id FROM claims 
                WHERE item_id = ? AND status IN ('approved', 'picked_up') AND claim_id != ?
            ''', (item_id, claim_id))
            existing_approved = cursor.fetchone()
            
            if existing_approved:
                conn.close()
                return jsonify({
                    'error': 'Another claim for this item is already approved',
                    'existing_claim_id': existing_approved['claim_id']
                }), 409
        
        # Get claimant and item info for email notification
        cursor.execute('''
            SELECT 
                c.claimant_name,
                c.claimant_email,
                c.claimant_user_id,
                i.description,
                i.category,
                i.pickup_at
            FROM claims c
            INNER JOIN items i ON c.item_id = i.item_id
            WHERE c.claim_id = ?
        ''', (claim_id,))
        email_data = cursor.fetchone()
        
        auto_rejected_claims = []
        item_description = 'the item'
        pickup_location = None
        if email_data:
            item_description = email_data['description'] or (f"{email_data['category']} item" if email_data['category'] else 'the item')
            pickup_location = email_data['pickup_at']
        
        # Update claim status
        cursor.execute('''
            UPDATE claims 
            SET status = ?, 
                staff_notes = ?, 
                processed_by_staff_id = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE claim_id = ?
        ''', (new_status, staff_notes, staff_id, claim_id))
        
        # If status is picked_up, update item status to claimed with timestamp
        if new_status == 'picked_up':
            try:
                cursor.execute('''
                    UPDATE items 
                    SET status = 'claimed',
                        updated_at = CURRENT_TIMESTAMP,
                        claimed_at = CURRENT_TIMESTAMP
                    WHERE item_id = ?
                ''', (item_id,))
            except sqlite3.OperationalError as exc:
                if 'no such column' in str(exc):
                    cursor.execute('''
                        UPDATE items
                        SET status = 'claimed'
                        WHERE item_id = ?
                    ''', (item_id,))
                else:
                    raise
        
        # Auto-reject other claims if one is approved
        if new_status == 'approved':
            cursor.execute('''
                SELECT claim_id, claimant_user_id, claimant_name, claimant_email
                FROM claims
                WHERE item_id = ? AND claim_id != ? AND status IN ('pending', 'approved')
            ''', (item_id, claim_id))
            conflicting_claims = cursor.fetchall()
            auto_note = 'Automatically rejected because another claimant was verified for this item.'
            
            for other in conflicting_claims:
                cursor.execute('''
                    UPDATE claims
                    SET status = 'rejected',
                        staff_notes = CASE
                            WHEN staff_notes IS NULL OR TRIM(staff_notes) = '' THEN ?
                            ELSE staff_notes || '\n' || ?
                        END,
                        processed_by_staff_id = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE claim_id = ?
                ''', (auto_note, auto_note, staff_id, other['claim_id']))
                
                metadata = {
                    'claim_id': other['claim_id'],
                    'item_id': item_id,
                    'status': 'rejected',
                    'auto': True
                }
                insert_notification(
                    cursor,
                    other['claimant_user_id'],
                    'Claim Update',
                    f'Another claimant was approved for {item_description}, so your claim was automatically rejected.',
                    'warning',
                    metadata
                )
                
                auto_rejected_claims.append({
                    'claim_id': other['claim_id'],
                    'claimant_name': other['claimant_name'],
                    'claimant_email': other['claimant_email'],
                    'claimant_user_id': other['claimant_user_id']
                })
        
        # Notification for the main claimant
        notification_user_id = email_data['claimant_user_id'] if email_data else claimant_user_id
        if notification_user_id:
            notif_metadata = {'claim_id': claim_id, 'item_id': item_id, 'status': new_status}
            notif_title_map = {
                'approved': 'Claim Approved',
                'rejected': 'Claim Rejected',
                'picked_up': 'Claim Completed'
            }
            notif_message_map = {
                'approved': f'Great news! Your claim for {item_description} was approved.',
                'rejected': f'Your claim for {item_description} was not approved. Please review staff notes for details.',
                'picked_up': f'{item_description.capitalize()} has been marked as picked up. Thank you!'
            }
            notif_type_map = {
                'approved': 'success',
                'picked_up': 'success',
                'rejected': 'warning'
            }
            insert_notification(
                cursor,
                notification_user_id,
                notif_title_map.get(new_status, 'Claim Update'),
                notif_message_map.get(new_status, f'Your claim status changed to {new_status}.'),
                notif_type_map.get(new_status, 'info'),
                notif_metadata
            )
        
        conn.commit()
        conn.close()
        
        # Send email notification based on status (Sprint 4: Issue #42)
        if email_data:
            claimant_name = email_data['claimant_name']
            claimant_email = email_data['claimant_email']
            
            try:
                if new_status == 'approved':
                    email_utils.send_claim_approved_email(
                        claimant_name=claimant_name,
                        claimant_email=claimant_email,
                        item_description=item_description,
                        claim_id=claim_id,
                        pickup_location=pickup_location
                    )
                elif new_status == 'rejected':
                    email_utils.send_claim_rejected_email(
                        claimant_name=claimant_name,
                        claimant_email=claimant_email,
                        item_description=item_description,
                        claim_id=claim_id,
                        staff_notes=staff_notes
                    )
                elif new_status == 'picked_up':
                    email_utils.send_claim_picked_up_email(
                        claimant_name=claimant_name,
                        claimant_email=claimant_email,
                        item_description=item_description,
                        claim_id=claim_id
                    )
            except Exception as e:
                print(f"Warning: Failed to send email notification for claim {claim_id}: {e}")
        
        if auto_rejected_claims:
            for rejected in auto_rejected_claims:
                if not rejected['claimant_email']:
                    continue
                try:
                    email_utils.send_claim_rejected_email(
                        claimant_name=rejected['claimant_name'],
                        claimant_email=rejected['claimant_email'],
                        item_description=item_description,
                        claim_id=rejected['claim_id'],
                        staff_notes='Automatically rejected because another claimant was verified for this item.'
                    )
                except Exception as e:
                    print(f"Warning: Failed to send auto-rejection email for claim {rejected['claim_id']}: {e}")
        
        print(f"✅ [UPDATE_CLAIM] Claim updated successfully to: {new_status}")
        print(f"{'='*60}\n")
        return jsonify({
            'message': f'Claim {new_status} successfully',
            'claim_id': claim_id,
            'new_status': new_status,
            'item_updated': new_status == 'picked_up'
        }), 200
        
    except sqlite3.Error as err:
        print(f"❌ [UPDATE_CLAIM] Database Error: {err}")
        print(f"{'='*60}\n")
        return jsonify({'error': 'Failed to update claim'}), 500
    except Exception as err:
        print(f"Error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/', methods=['GET'])
def index():
    """Root endpoint with API information."""
    return jsonify({
        'service': 'UW Lost-and-Found App - API',
        'version': '3.0.0',
        'sprint': 'Sprint 3',
        'endpoints': {
            'POST /auth/login': 'Login (student/staff with @uwaterloo.ca email)',
            'POST /auth/register': 'Register student/staff account (@uwaterloo.ca only)',
            'POST /auth/logout': 'Logout',
            'GET /auth/verify-session': 'Verify session',
            'GET /auth/me': 'Get current user',
            'GET /api/items': 'Get all lost items (authenticated)',
            'POST /api/items': 'Create new item (staff only)',
            'POST /api/claims': 'Create a claim for an item (authenticated)',
            'GET /api/claims': 'Get claims (filtered by role)',
            'GET /api/claims/:id': 'Get claim details',
            'PATCH /api/claims/:id': 'Update claim status (staff only)',
            'GET /health': 'Health check'
        }
    }), 200

if __name__ == '__main__':
    # Use port 5001 by default to avoid AirPlay Receiver conflict on macOS
    # Port 5000 is often taken by macOS AirPlay Receiver
    # To use port 5000, disable AirPlay: System Preferences → General → AirDrop & Handoff
    port = 5001
    print(f"🚀 Starting backend on port {port}")
    print("💡 If you want to use port 5000, disable AirPlay Receiver in System Preferences")
    app.run(debug=True, host='0.0.0.0', port=port)

