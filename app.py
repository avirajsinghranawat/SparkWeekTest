from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import os
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from psycopg2.pool import SimpleConnectionPool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))
CORS(app)

# Database connection pool
db_pool = None

def get_db_pool():
    """Initialize database connection pool"""
    global db_pool
    if db_pool is None:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL not found in environment variables. Please create a .env file.")
        
        # Optimized for 100+ concurrent users
        db_pool = SimpleConnectionPool(
            minconn=5,
            maxconn=100,  # Handle 100+ concurrent database operations
            dsn=database_url
        )
    return db_pool

def get_db_connection():
    """Get a connection from the pool"""
    pool = get_db_pool()
    return pool.getconn()

def return_db_connection(conn):
    """Return a connection to the pool"""
    pool = get_db_pool()
    pool.putconn(conn)

def execute_query(query, params=None, fetch=True, fetchone=False):
    """Execute a database query with connection pooling"""
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            
            if fetch:
                result = cur.fetchone() if fetchone else cur.fetchall()
                conn.commit()
                return result
            else:
                conn.commit()
                return None
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Database error: {e}")
        raise e
    finally:
        if conn:
            return_db_connection(conn)

def check_and_initialize_database():
    """Check if database is initialized, if not, run setup"""
    try:
        # Try to query a table that should exist
        query = "SELECT COUNT(*) as count FROM admin_config"
        result = execute_query(query, fetch=True, fetchone=True)
        
        # If we get here, database is initialized
        print("✓ Database already initialized")
        return True
        
    except Exception as e:
        print(f"⚠ Database not initialized. Running setup...")
        
        try:
            # Run database initialization
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Read and execute schema.sql
            schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
            with open(schema_path, 'r') as f:
                schema_sql = f.read()
                cur.execute(schema_sql)
            
            conn.commit()
            cur.close()
            return_db_connection(conn)
            
            print("✓ Database initialized successfully!")
            return True
            
        except Exception as setup_error:
            print(f"✗ Failed to initialize database: {setup_error}")
            return False

# ===========================
# Helper Functions
# ===========================

def calculate_score(location, answers):
    """Calculate score based on answers and questions"""
    query = "SELECT id, question_type, correct_answer, points FROM questions WHERE location = %s"
    questions = execute_query(query, (location,), fetch=True)
    
    total_score = 0
    for question in questions:
        question_id = str(question['id'])
        if question_id in answers:
            user_answer = answers[question_id]
            correct_answer = question['correct_answer']
            question_type = question['question_type']
            
            # Handle multiple choice - points per correct option
            if question_type == 'multiple' and isinstance(correct_answer, list):
                # Award points for each correct option selected
                if isinstance(user_answer, list):
                    correct_selections = set(correct_answer)
                    user_selections = set(user_answer)
                    
                    # Count how many correct options the user selected
                    correctly_selected = len(correct_selections & user_selections)
                    
                    # Points per correct option
                    total_score += correctly_selected * question['points']
            elif isinstance(correct_answer, list):
                # Other list-based questions (if any) - full points for exact match
                if sorted(user_answer) == sorted(correct_answer):
                    total_score += question['points']
            else:
                # Single choice, true/false, or text - direct comparison
                if user_answer == correct_answer:
                    total_score += question['points']
    
    return total_score

# ===========================
# Routes
# ===========================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/participant')
def participant():
    return render_template('participant.html')

# ===========================
# Admin API Endpoints
# ===========================

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    query = "SELECT * FROM admin_config WHERE username = %s AND password = %s"
    admin = execute_query(query, (username, password), fetch=True, fetchone=True)
    
    if admin:
        session['admin_logged_in'] = True
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    return jsonify({'success': True})

@app.route('/api/admin/check', methods=['GET'])
def check_admin():
    return jsonify({'logged_in': session.get('admin_logged_in', False)})

@app.route('/api/admin/quiz-status', methods=['GET'])
def get_quiz_status():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    query = "SELECT location, is_open FROM quiz_status ORDER BY location"
    statuses = execute_query(query, fetch=True)
    
    result = {row['location']: row['is_open'] for row in statuses}
    return jsonify(result)

@app.route('/api/admin/quiz-status', methods=['POST'])
def update_quiz_status():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    location = data.get('location')
    is_open = data.get('is_open')
    
    query = """
    INSERT INTO quiz_status (location, is_open, updated_at) 
    VALUES (%s, %s, CURRENT_TIMESTAMP)
    ON CONFLICT (location) 
    DO UPDATE SET is_open = %s, updated_at = CURRENT_TIMESTAMP
    """
    execute_query(query, (location, is_open, is_open), fetch=False)
    
    return jsonify({'success': True})

@app.route('/api/admin/participants/<location>', methods=['GET'])
def get_participants(location):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    query = """
    SELECT sso, name, email, score, submitted_at, answers
    FROM participants 
    WHERE location = %s
    ORDER BY score DESC, submitted_at ASC
    """
    participants = execute_query(query, (location,), fetch=True)
    
    result = []
    for p in participants:
        result.append({
            'sso': p['sso'],
            'name': p['name'],
            'email': p['email'],
            'score': p['score'],
            'submitted_at': p['submitted_at'].isoformat() if p['submitted_at'] else None,
            'answers': p['answers']
        })
    
    return jsonify(result)

@app.route('/api/admin/participants/<location>/<sso>', methods=['DELETE'])
def delete_participant(location, sso):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # Delete from participants table
        query1 = "DELETE FROM participants WHERE location = %s AND sso = %s"
        execute_query(query1, (location, sso), fetch=False)
        
        # Delete from sso_tracker
        query2 = "DELETE FROM sso_tracker WHERE sso = %s"
        execute_query(query2, (sso,), fetch=False)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/questions/<location>', methods=['GET'])
def get_questions(location):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    query = """
    SELECT id, question_text, question_type, options, correct_answer, points
    FROM questions 
    WHERE location = %s
    ORDER BY id
    """
    questions = execute_query(query, (location,), fetch=True)
    
    result = []
    for q in questions:
        result.append({
            'id': q['id'],
            'question': q['question_text'],
            'type': q['question_type'],
            'options': q['options'],
            'correct_answer': q['correct_answer'],
            'points': q['points']
        })
    
    return jsonify(result)

@app.route('/api/admin/questions/<location>', methods=['POST'])
def add_question(location):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    
    query = """
    INSERT INTO questions (location, question_text, question_type, options, correct_answer, points)
    VALUES (%s, %s, %s, %s, %s, %s)
    RETURNING id
    """
    
    result = execute_query(
        query,
        (
            location,
            data['question'],
            data['type'],
            Json(data.get('options')),
            Json(data['correct_answer']),
            data.get('points', 1)
        ),
        fetch=True,
        fetchone=True
    )
    
    return jsonify({'success': True, 'id': result['id']})

@app.route('/api/admin/questions/<location>/<int:question_id>', methods=['PUT'])
def update_question(location, question_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    
    query = """
    UPDATE questions 
    SET question_text = %s, question_type = %s, options = %s, correct_answer = %s, points = %s
    WHERE id = %s AND location = %s
    """
    
    execute_query(
        query,
        (
            data['question'],
            data['type'],
            Json(data.get('options')),
            Json(data['correct_answer']),
            data.get('points', 1),
            question_id,
            location
        ),
        fetch=False
    )
    
    return jsonify({'success': True})

@app.route('/api/admin/questions/<location>/<int:question_id>', methods=['DELETE'])
def delete_question(location, question_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    query = "DELETE FROM questions WHERE id = %s AND location = %s"
    execute_query(query, (question_id, location), fetch=False)
    
    return jsonify({'success': True})

# ===========================
# Participant API Endpoints
# ===========================

@app.route('/api/quiz-status/<location>', methods=['GET'])
def get_location_quiz_status(location):
    query = "SELECT is_open FROM quiz_status WHERE location = %s"
    result = execute_query(query, (location,), fetch=True, fetchone=True)
    
    if result:
        return jsonify({'is_open': result['is_open']})
    return jsonify({'is_open': False})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    sso = data.get('sso', '').strip()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    location = data.get('location')
    
    # Validate SSO (exactly 9 digits)
    import re
    if not re.match(r'^\d{9}$', sso):
        return jsonify({
            'success': False,
            'message': 'SSO must be exactly 9 digits'
        }), 400
    
    # Validate email (must end with @gevernova.com)
    if not re.match(r'^[a-zA-Z0-9._%+-]+@gevernova\.com$', email):
        return jsonify({
            'success': False,
            'message': 'Email must be a valid GE Vernova email address (@gevernova.com)'
        }), 400
    
    # Check if SSO already exists
    query_sso = "SELECT sso, name, email, location FROM sso_tracker WHERE sso = %s"
    existing_sso = execute_query(query_sso, (sso,), fetch=True, fetchone=True)
    
    # Check if Email already exists
    query_email = "SELECT sso, name, email, location FROM sso_tracker WHERE email = %s"
    existing_email = execute_query(query_email, (email,), fetch=True, fetchone=True)
    
    # If SSO exists, validate it's the same person
    if existing_sso:
        if existing_sso['email'] != email or existing_sso['name'] != name:
            return jsonify({
                'success': False,
                'message': 'This SSO is already registered with different details. SSO, Email, and Name must match your previous registration.'
            }), 400
    
    # If Email exists, validate it's the same person
    if existing_email:
        if existing_email['sso'] != sso or existing_email['name'] != name:
            return jsonify({
                'success': False,
                'message': 'This Email is already registered with different details. SSO, Email, and Name must match your previous registration.'
            }), 400
    
    # If person exists, check if they already submitted
    if existing_sso:
        existing_location = existing_sso['location']
        
        # Check if quiz was submitted
        query_submitted = "SELECT submitted_at FROM participants WHERE sso = %s AND location = %s"
        participant = execute_query(query_submitted, (sso, existing_location), fetch=True, fetchone=True)
        
        if participant and participant['submitted_at']:
            return jsonify({
                'success': False,
                'message': f'You have already completed the quiz for {existing_location}. You cannot take another quiz.'
            }), 400
        else:
            return jsonify({
                'success': True,
                'can_resume': True,
                'location': existing_location,
                'message': f'Welcome back! Resuming your quiz for {existing_location}...'
            })
    
    # New registration
    try:
        # Add to sso_tracker
        query_tracker = "INSERT INTO sso_tracker (sso, name, email, location) VALUES (%s, %s, %s, %s)"
        execute_query(query_tracker, (sso, name, email, location), fetch=False)
        
        # Add to participants
        query_participant = """
        INSERT INTO participants (sso, name, email, location, answers, score)
        VALUES (%s, %s, %s, %s, %s, 0)
        """
        execute_query(query_participant, (sso, name, email, location, Json({})), fetch=False)
        
        return jsonify({'success': True, 'can_resume': False})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/questions/<location>', methods=['GET'])
def get_quiz_questions(location):
    sso = request.args.get('sso')
    
    if not sso:
        return jsonify({'error': 'SSO required'}), 400
    
    # Verify SSO is registered for this location
    query_check = "SELECT * FROM participants WHERE sso = %s AND location = %s"
    participant = execute_query(query_check, (sso, location), fetch=True, fetchone=True)
    
    if not participant:
        return jsonify({'error': 'Not registered'}), 403
    
    # Check if already submitted
    if participant['submitted_at']:
        return jsonify({'error': 'Quiz already submitted'}), 403
    
    # Get questions (without correct answers)
    query_questions = """
    SELECT id, question_text, question_type, options, correct_answer, points
    FROM questions 
    WHERE location = %s
    ORDER BY id
    """
    questions = execute_query(query_questions, (location,), fetch=True)
    
    result = {
        'questions': [],
        'existing_answers': participant['answers']
    }
    
    for q in questions:
        question_data = {
            'id': q['id'],
            'question': q['question_text'],
            'type': q['question_type'],
            'options': q['options'],
            'points': q['points']
        }
        
        # For multiple choice, include the number of correct answers (but not the actual answers)
        if q['question_type'] == 'multiple' and q['correct_answer']:
            if isinstance(q['correct_answer'], list):
                question_data['max_selections'] = len(q['correct_answer'])
            else:
                question_data['max_selections'] = 1
        
        result['questions'].append(question_data)
    
    return jsonify(result)

@app.route('/api/save-answer', methods=['POST'])
def save_answer():
    data = request.json
    sso = data.get('sso')
    location = data.get('location')
    question_id = str(data.get('question_id'))
    answer = data.get('answer')
    
    # Get current answers
    query_get = "SELECT answers FROM participants WHERE sso = %s AND location = %s"
    participant = execute_query(query_get, (sso, location), fetch=True, fetchone=True)
    
    if not participant:
        return jsonify({'success': False, 'message': 'Not registered'}), 403
    
    # Update answers
    answers = participant['answers']
    answers[question_id] = answer
    
    query_update = "UPDATE participants SET answers = %s WHERE sso = %s AND location = %s"
    execute_query(query_update, (Json(answers), sso, location), fetch=False)
    
    return jsonify({'success': True})

@app.route('/api/submit', methods=['POST'])
def submit_quiz():
    data = request.json
    sso = data.get('sso')
    location = data.get('location')
    
    # Get participant
    query_get = "SELECT answers FROM participants WHERE sso = %s AND location = %s"
    participant = execute_query(query_get, (sso, location), fetch=True, fetchone=True)
    
    if not participant:
        return jsonify({'success': False, 'message': 'Not registered'}), 403
    
    # Calculate score
    score = calculate_score(location, participant['answers'])
    
    # Update participant with score and submission time
    query_update = """
    UPDATE participants 
    SET score = %s, submitted_at = CURRENT_TIMESTAMP 
    WHERE sso = %s AND location = %s
    """
    execute_query(query_update, (score, sso, location), fetch=False)
    
    return jsonify({'success': True, 'score': score})

if __name__ == '__main__':
    try:
        # Test database connection on startup
        get_db_pool()
        print("✓ Database connection successful!")
        
        # Check and initialize database if needed
        check_and_initialize_database()
        
        print("\n" + "=" * 60)
        print("🚀 QUIZ APPLICATION - OPTIMIZED FOR 100+ USERS")
        print("=" * 60)
        
        # Get network IP addresses
        import socket
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Try to use production server (Waitress) if available
        try:
            from waitress import serve
            print("✓ Using Waitress production server")
            print("✓ Capacity: 100-150 concurrent users")
            print("✓ Threads: 16")
            print("✓ Connection pool: 100 database connections")
            print("=" * 60)
            print("📡 ACCESS LINKS:")
            print(f"   Local:   http://127.0.0.1:5000")
            print(f"   Network: http://{local_ip}:5000")
            print("\n   👥 SHARE THIS WITH USERS:")
            print(f"   → http://{local_ip}:5000")
            print("=" * 60)
            print("\nPress CTRL+C to stop\n")
            
            # Run production server
            serve(
                app,
                host='0.0.0.0',
                port=5000,
                threads=16,
                channel_timeout=120,
                connection_limit=500,
                cleanup_interval=10,
                asyncore_use_poll=True
            )
        except ImportError:
            # Fallback to Flask built-in server
            print("⚠ Waitress not installed - using Flask development server")
            print("✓ Capacity: 50-80 concurrent users")
            print("✓ Threading enabled")
            print("=" * 60)
            print("📡 ACCESS LINKS:")
            print(f"   Local:   http://127.0.0.1:5000")
            print(f"   Network: http://{local_ip}:5000")
            print("\n   👥 SHARE THIS WITH USERS:")
            print(f"   → http://{local_ip}:5000")
            print("=" * 60)
            print("\n💡 For 100+ users, install waitress:")
            print("   pip install waitress")
            print("\nPress CTRL+C to stop\n")
            
            app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
            
    except Exception as e:
        print(f"✗ Error: {e}")
        print("\nPlease ensure:")
        print("1. PostgreSQL database is running")
        print("2. .env file exists with correct DATABASE_URL")
        print("3. Database is accessible")

# Initialize database when app is loaded (for production servers like Gunicorn)
try:
    get_db_pool()
    check_and_initialize_database()
except Exception as e:
    print(f"⚠ Warning: Database initialization failed: {e}")
