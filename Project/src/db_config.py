"""
Database Configuration Module
Provides database connection abstraction for SQLite (development) and PostgreSQL (production).

Usage:
    from db_config import get_db_connection, init_db, DB_TYPE
"""

import os
import sqlite3
from urllib.parse import urlparse

# Detect database type from DATABASE_URL environment variable
DATABASE_URL = os.getenv('DATABASE_URL', '')

def get_db_type():
    """Determine database type from DATABASE_URL."""
    if DATABASE_URL and DATABASE_URL.startswith('postgres'):
        return 'postgresql'
    return 'sqlite'

DB_TYPE = get_db_type()

# SQLite database path (for development)
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'lostfound.db')


def get_db_connection():
    """
    Get a database connection based on environment.
    Returns SQLite connection in development, PostgreSQL in production.
    """
    if DB_TYPE == 'postgresql':
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        # Parse DATABASE_URL (Render provides this)
        url = urlparse(DATABASE_URL)
        conn = psycopg2.connect(
            host=url.hostname,
            port=url.port,
            database=url.path[1:],  # Remove leading slash
            user=url.username,
            password=url.password,
            cursor_factory=RealDictCursor
        )
        return conn
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn


def get_placeholder():
    """Return the correct placeholder for SQL queries."""
    return '%s' if DB_TYPE == 'postgresql' else '?'


def convert_query(query):
    """
    Convert SQLite-style query to PostgreSQL-style if needed.
    Replaces ? with %s for PostgreSQL.
    """
    if DB_TYPE == 'postgresql':
        return query.replace('?', '%s')
    return query


def init_db():
    """
    Initialize the database with required tables.
    Handles both SQLite and PostgreSQL syntax differences.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if DB_TYPE == 'postgresql':
        # PostgreSQL schema
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
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
                item_id SERIAL PRIMARY KEY,
                name TEXT,
                description TEXT,
                category TEXT NOT NULL,
                location_found TEXT NOT NULL,
                pickup_at TEXT NOT NULL CHECK(pickup_at IN ('SLC', 'PAC', 'CIF')),
                date_found TIMESTAMP NOT NULL,
                status TEXT NOT NULL DEFAULT 'unclaimed' CHECK(status IN ('unclaimed', 'claimed', 'deleted')),
                image_url TEXT,
                found_by_desk TEXT NOT NULL,
                created_by_user_id INTEGER REFERENCES users(user_id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                claimed_at TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id),
                role TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS claims (
                claim_id SERIAL PRIMARY KEY,
                item_id INTEGER NOT NULL REFERENCES items(item_id),
                claimant_user_id INTEGER NOT NULL REFERENCES users(user_id),
                claimant_name TEXT NOT NULL,
                claimant_email TEXT NOT NULL,
                claimant_phone TEXT,
                verification_text TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'picked_up')),
                staff_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_by_staff_id INTEGER REFERENCES users(user_id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activity_log (
                log_id SERIAL PRIMARY KEY,
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id),
                type TEXT NOT NULL DEFAULT 'info',
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                metadata TEXT,
                is_read INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at TIMESTAMP
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
        
    else:
        # SQLite schema (existing code)
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                claimed_at TIMESTAMP,
                FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
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
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    
    conn.commit()
    conn.close()
    print(f"Database initialized successfully (using {DB_TYPE})")


# Export for use in app.py
__all__ = ['get_db_connection', 'init_db', 'convert_query', 'get_placeholder', 'DB_TYPE', 'DB_PATH']
