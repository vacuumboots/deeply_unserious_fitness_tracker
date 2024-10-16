from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import csv
from datetime import datetime, timedelta
import os

DATABASE_PATH = '/app/data/data.db'

def connect_db():
    return sqlite3.connect(DATABASE_PATH)

app = Flask(__name__)
CORS(app)

# Create table if it doesn't exist
def create_table():
    with connect_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS exercise (id INTEGER PRIMARY KEY, date TEXT, pull_ups INTEGER, push_ups INTEGER)''')
        conn.commit()

create_table()

@app.route('/api/submit', methods=['POST'])
def submit():
    data = request.get_json()

    # Validate date, pull_ups, and push_ups
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
    
    with connect_db() as conn:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO exercise (date, pull_ups, push_ups) VALUES (?, ?, ?)', (date, pull_ups, push_ups))
        conn.commit()
    return jsonify({'message': 'Data submitted successfully'}), 200

@app.route('/api/pullups/last7days', methods=['GET'])
def get_last_7_days_pullups():
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=6)

    with connect_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT date, SUM(pull_ups) as total_pull_ups
            FROM exercise
            WHERE date BETWEEN ? AND ?
            GROUP BY date
            ORDER BY date
        ''', (start_date, end_date))
        data = cursor.fetchall()
    
    response = [{'date': row[0], 'total_pull_ups': row[1]} for row in data]
    return jsonify(response)

@app.route('/api/pullups/monthly', methods=['GET'])
def get_monthly_pullups_summary():
    with connect_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT strftime('%Y-%m', date) as month, SUM(pull_ups) as total_pull_ups
            FROM exercise
            GROUP BY month
            ORDER BY month
        ''')
        data = cursor.fetchall()

    response = [{'month': row[0], 'total_pull_ups': row[1]} for row in data]
    return jsonify(response)

@app.route('/api/export', methods=['GET'])
def export():
    with connect_db() as conn:
        cursor = conn.cursor()
        total_records_query = 'SELECT COUNT(*) FROM exercise'
        cursor.execute(total_records_query)
        total_records = cursor.fetchone()[0]

        page_size = 100
        data = []

        for offset in range(0, total_records, page_size):
            cursor.execute('SELECT * FROM exercise LIMIT ? OFFSET ?', (page_size, offset))
            data.extend(cursor.fetchall())
    
    with open('exercise_data.csv', 'w', newline='') as csvfile:
        csv_writer = csv.writer(csvfile)
        csv_writer.writerow(['ID', 'Date', 'Pull-Ups', 'Push-Ups'])
        csv_writer.writerows(data)
    
    return send_file('exercise_data.csv', as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)