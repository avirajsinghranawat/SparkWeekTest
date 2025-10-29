"""
Database Setup Script for Quiz Application
This script creates all necessary tables and initializes default data
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def setup_database():
    """Create tables and initialize default data"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("✗ ERROR: DATABASE_URL not found in .env file")
        print("\nPlease create a .env file with your database URL:")
        print("DATABASE_URL=postgresql://username:password@host:port/database")
        return False
    
    try:
        # Connect to database
        print("Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("✓ Connected to database successfully!")
        
        # Read and execute schema.sql
        print("\nCreating tables...")
        with open('schema.sql', 'r') as f:
            schema_sql = f.read()
            cur.execute(schema_sql)
        
        print("✓ Tables created successfully!")
        
        # Verify tables were created
        print("\nVerifying tables...")
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = cur.fetchall()
        
        print("\nCreated tables:")
        for table in tables:
            print(f"  ✓ {table[0]}")
        
        # Check default admin account
        cur.execute("SELECT username FROM admin_config")
        admin = cur.fetchone()
        if admin:
            print(f"\n✓ Default admin account created: {admin[0]}")
            print("  Password: admin123")
            print("  ⚠️  IMPORTANT: Change this password in production!")
        
        # Check quiz locations
        cur.execute("SELECT location, is_open FROM quiz_status ORDER BY location")
        locations = cur.fetchall()
        print(f"\n✓ Quiz locations initialized ({len(locations)} locations):")
        for loc in locations:
            status = "OPEN" if loc[1] else "CLOSED"
            print(f"  • {loc[0]}: {status}")
        
        cur.close()
        conn.close()
        
        print("\n" + "="*50)
        print("✓ Database setup completed successfully!")
        print("="*50)
        print("\nYou can now start the application:")
        print("  python app_postgresql.py")
        print("\nOr rename app_postgresql.py to app.py to replace the JSON version")
        
        return True
        
    except psycopg2.Error as e:
        print(f"\n✗ Database error: {e}")
        print("\nTroubleshooting:")
        print("1. Verify your DATABASE_URL is correct")
        print("2. Ensure the database exists")
        print("3. Check that you have CREATE TABLE permissions")
        return False
    except FileNotFoundError:
        print("\n✗ ERROR: schema.sql file not found")
        print("Please ensure schema.sql is in the same directory as this script")
        return False
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        return False

def test_connection():
    """Test database connection"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return False
    
    try:
        conn = psycopg2.connect(database_url)
        conn.close()
        return True
    except:
        return False

if __name__ == '__main__':
    print("="*50)
    print("Quiz Application - Database Setup")
    print("="*50)
    print()
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("✗ .env file not found!")
        print("\nCreating .env file from template...")
        print("Please edit .env and add your database URL, then run this script again.")
        
        if os.path.exists('.env.example'):
            import shutil
            shutil.copy('.env.example', '.env')
            print("✓ .env file created from .env.example")
        else:
            with open('.env', 'w') as f:
                f.write("# Database Configuration\n")
                f.write("DATABASE_URL=postgresql://username:password@host:port/database\n")
                f.write("\n# Flask Secret Key\n")
                f.write("SECRET_KEY=your-secret-key-here\n")
            print("✓ .env file created")
        
        print("\nEdit .env and set your DATABASE_URL, then run: python setup_db.py")
        exit(1)
    
    # Load environment and setup database
    load_dotenv()
    
    if test_connection():
        setup_database()
    else:
        print("✗ Cannot connect to database")
        print("\nPlease check your .env file and ensure:")
        print("1. DATABASE_URL is correctly formatted")
        print("2. Database server is running")
        print("3. Credentials are correct")
        print("\nExample DATABASE_URL formats:")
        print("  Local: postgresql://postgres:password@localhost:5432/quizdb")
        print("  Railway: postgresql://postgres:PASSWORD@containers-us-west-xxx.railway.app:5432/railway")
        print("  Supabase: postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres")
