from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import csv
from datetime import datetime, timedelta
import os
import logging
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps

# Secret key for JWT encoding and decoding (use a secure key in production)

SECRET_KEY = os.environ.get('SECRET_KEY', 'your_default_secret_key') # Replace with a secure key

DATABASE_PATH = '/app/data/data.db'

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def connect_db():
    try:
        return sqlite3.connect(DATABASE_PATH)
    except sqlite3.Error as e:
        logger.error(f"Error connecting to database: {e}")
        return None

app = Flask(__name__)
CORS(app)

# Create tables if they don't exist
def create_table():
    with connect_db() as conn:
        if conn is not None:
            cursor = conn.cursor()
            # Create users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL
                )
            ''')
            # Create exercise table with user_id foreign key
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS exercise (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    pull_ups INTEGER NOT NULL,
                    push_ups INTEGER NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            conn.commit()

create_table()

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # JWT is passed in the request header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'error': 'Token is missing.'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = data['user_id']
            # Attach user_id to the request context
            request.user_id = user_id
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token.'}), 401

        return f(*args, **kwargs)
    return decorated

# User registration endpoint
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Validate inputs
    if not username or not password:
        return jsonify({'error': 'Username and password are required.'}), 400

    with connect_db() as conn:
        if conn is not None:
            cursor = conn.cursor()
            # Check if the username already exists
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            existing_user = cursor.fetchone()
            if existing_user:
                return jsonify({'error': 'Username already exists.'}), 400

            # Hash the password and store the user
            password_hash = generate_password_hash(password)
            cursor.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', (username, password_hash))
            conn.commit()
        else:
            return jsonify({'error': 'Database connection failed'}), 500

    return jsonify({'message': 'User registered successfully.'}), 201

@app.route('/api/users', methods=['GET'])
def get_users():
    with connect_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, username FROM users')
        users = cursor.fetchall()
    return jsonify([{'id': user[0], 'username': user[1]} for user in users]), 200

# User login endpoint
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Validate inputs
    if not username or not password:
        return jsonify({'error': 'Username and password are required.'}), 400

    with connect_db() as conn:
        if conn is not None:
            cursor = conn.cursor()
            cursor.execute('SELECT id, password_hash FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            if user and check_password_hash(user[1], password):
                # Generate JWT token
                token = jwt.encode({
                    'user_id': user[0],
                    'exp': datetime.utcnow() + timedelta(hours=24)
                }, SECRET_KEY, algorithm='HS256')
                return jsonify({'token': token}), 200
            else:
                return jsonify({'error': 'Invalid username or password.'}), 401
        else:
            return jsonify({'error': 'Database connection failed'}), 500

# Submit exercise data endpoint
@app.route('/api/submit', methods=['POST'])
@token_required
def submit():
    data = request.get_json()
    user_id = request.user_id  # Get the authenticated user's ID

    # Validate pull_ups and push_ups
    if 'pull_ups' not in data or not isinstance(data['pull_ups'], int) or data['pull_ups'] < 0:
        return jsonify({'error': 'Invalid pull_ups value'}), 400
    if 'push_ups' not in data or not isinstance(data['push_ups'], int) or data['push_ups'] < 0:
        return jsonify({'error': 'Invalid push_ups value'}), 400

    date = data.get('date', datetime.now().strftime("%Y-%m-%d"))
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return jsonify({'error': 'Invalid date format, expected YYYY-MM-DD'}), 400

    pull_ups = data['pull_ups']
    push_ups = data['push_ups']
    
    logger.debug(f"Received data for submission: user_id={user_id}, date={date}, pull_ups={pull_ups}, push_ups={push_ups}")

    with connect_db() as conn:
        if conn is not None:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO exercise (user_id, date, pull_ups, push_ups)
                VALUES (?, ?, ?, ?)
            ''', (user_id, date, pull_ups, push_ups))
            conn.commit()
            
            # Get updated streak info
            streak_response = get_streak()
            streak_data = streak_response.get_json()
            
            return jsonify({
                'message': 'Data submitted successfully',
                'current_streak': streak_data['current_streak'],
                'longest_streak': streak_data['longest_streak']
            }), 200
        else:
            logger.error("Failed to connect to the database")
            return jsonify({'error': 'Database connection failed'}), 500
    return jsonify({'message': 'Data submitted successfully'}), 200

# Get last 7 days of exercise data
@app.route('/api/pullups/last7days', methods=['GET'])
@token_required
def get_last_7_days_pullups():
    user_id = request.user_id
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=6)

    with connect_db() as conn:
        if conn is not None:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT date, SUM(pull_ups) as total_pull_ups, SUM(push_ups) as total_push_ups
                FROM exercise
                WHERE user_id = ? AND date BETWEEN ? AND ?
                GROUP BY date
                ORDER BY date
            ''', (user_id, start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")))
            data = cursor.fetchall()
        else:
            return jsonify({'error': 'Database connection failed'}), 500

    response = [{'date': row[0], 'total_pull_ups': row[1], 'total_push_ups': row[2]} for row in data]
    logger.debug(f"Last 7 days pull-ups data for user_id={user_id}: {response}")
    return jsonify(response)

# Get monthly exercise summary
@app.route('/api/pullups/monthly', methods=['GET'])
@token_required
def get_monthly_pullups_summary():
    user_id = request.user_id

    with connect_db() as conn:
        if conn is not None:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT strftime('%Y-%m', date) as month, SUM(pull_ups) as total_pull_ups, SUM(push_ups) as total_push_ups
                FROM exercise
                WHERE user_id = ?
                GROUP BY month
                ORDER BY month
            ''', (user_id,))
            data = cursor.fetchall()
        else:
            return jsonify({'error': 'Database connection failed'}), 500

    response = [{'month': row[0], 'total_pull_ups': row[1], 'total_push_ups': row[2]} for row in data]
    logger.debug(f"Monthly pull-ups summary for user_id={user_id}: {response}")
    return jsonify(response)

# Export exercise data to CSV
@app.route('/api/export', methods=['GET'])
@token_required
def export():
    user_id = request.user_id

    with connect_db() as conn:
        if conn is not None:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM exercise WHERE user_id = ?', (user_id,))
            total_records = cursor.fetchone()[0]

            page_size = 100
            data = []

            for offset in range(0, total_records, page_size):
                cursor.execute('SELECT * FROM exercise WHERE user_id = ? LIMIT ? OFFSET ?', (user_id, page_size, offset))
                data.extend(cursor.fetchall())
        else:
            return jsonify({'error': 'Database connection failed'}), 500

    # Prepare CSV file
    filename = f'exercise_data_user_{user_id}.csv'
    with open(filename, 'w', newline='') as csvfile:
        csv_writer = csv.writer(csvfile)
        csv_writer.writerow(['ID', 'User ID', 'Date', 'Pull-Ups', 'Push-Ups'])
        csv_writer.writerows(data)
    
    logger.debug(f"CSV export created successfully for user_id={user_id}")
    return send_file(filename, as_attachment=True)

# Reset user's exercise data
@app.route('/api/reset', methods=['POST'])
@token_required
def reset():
    user_id = request.user_id

    with connect_db() as conn:
        if conn is not None:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM exercise WHERE user_id = ?', (user_id,))
            conn.commit()
            logger.debug(f"User data reset successfully for user_id={user_id}")
        else:
            logger.error("Failed to connect to the database")
            return jsonify({'error': 'Database connection failed'}), 500
    return jsonify({'message': 'Your data has been reset successfully.'}), 200

@app.route('/api/streak', methods=['GET'])
@token_required
def get_streak():
    user_id = request.user_id
    today = datetime.now().date()
    
    with connect_db() as conn:
        if conn is not None:
            cursor = conn.cursor()
            # Get all workout dates for the user, ordered by date
            cursor.execute('''
                SELECT DISTINCT date 
                FROM exercise 
                WHERE user_id = ? 
                ORDER BY date DESC
            ''', (user_id,))
            workout_dates = [datetime.strptime(row[0], "%Y-%m-%d").date() 
                           for row in cursor.fetchall()]
        else:
            return jsonify({'error': 'Database connection failed'}), 500

    if not workout_dates:
        return jsonify({'current_streak': 0, 
                       'longest_streak': 0})

    # Calculate current streak
    current_streak = 0
    latest_workout = workout_dates[0]
    
    # If the latest workout isn't today or yesterday, streak is 0
    if (today - latest_workout).days > 1:
        current_streak = 0
    else:
        current_streak = 1
        for i in range(len(workout_dates) - 1):
            date1 = workout_dates[i]
            date2 = workout_dates[i + 1]
            if (date1 - date2).days == 1:
                current_streak += 1
            else:
                break

    # Calculate longest streak
    longest_streak = 1
    current_count = 1
    
    for i in range(len(workout_dates) - 1):
        date1 = workout_dates[i]
        date2 = workout_dates[i + 1]
        if (date1 - date2).days == 1:
            current_count += 1
            longest_streak = max(longest_streak, current_count)
        else:
            current_count = 1

    return jsonify({
        'current_streak': current_streak,
        'longest_streak': longest_streak
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
