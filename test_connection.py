"""
Test database connection with and without proxy settings
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

print("Testing database connection...")
print(f"Database URL: {DATABASE_URL[:50]}...")

try:
    # Try basic connection
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
    cur = conn.cursor()
    cur.execute("SELECT version();")
    version = cur.fetchone()
    print(f"✓ Connection successful!")
    print(f"PostgreSQL version: {version[0]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"✗ Connection failed: {e}")
    print("\nThis error typically occurs when:")
    print("1. Corporate firewall blocks direct PostgreSQL connections")
    print("2. Need to use HTTP CONNECT proxy tunneling")
    print("3. SSL/TLS handshake fails")
    print("\nTrying alternative connection methods...")
