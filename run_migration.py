import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

try:
    # Add name column
    cur.execute("ALTER TABLE sso_tracker ADD COLUMN IF NOT EXISTS name VARCHAR(255)")
    print("✓ Name column added")
    
    # Update with existing data
    cur.execute("UPDATE sso_tracker st SET name = p.name FROM participants p WHERE st.sso = p.sso")
    print("✓ Name data populated")
    
    # Set NOT NULL
    cur.execute("ALTER TABLE sso_tracker ALTER COLUMN name SET NOT NULL")
    print("✓ Name set to NOT NULL")
    
    conn.commit()
    print("\n✓✓✓ Migration successful!")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
finally:
    cur.close()
    conn.close()
