import sqlite3
import os
from datetime import datetime
from typing import Dict, List, Any
import pandas as pd
from config import DATABASE_PATH

class DatabaseHandler:
    def __init__(self):
        self.db_path = DATABASE_PATH
        self._create_data_directory()
        self._init_database()

    def _create_data_directory(self):
        """Membuat direktori data jika belum ada"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

    def _init_database(self):
        """Inisialisasi database dan membuat tabel yang diperlukan"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Tabel untuk data sensor
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sensor_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    sensor_type TEXT,
                    value REAL,
                    unit TEXT
                )
            ''')

            # Tabel untuk log aksi
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS action_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    action_type TEXT,
                    target TEXT,
                    value TEXT,
                    reason TEXT
                )
            ''')

            conn.commit()

    def save_sensor_data(self, sensor_type: str, value: float, unit: str):
        """Menyimpan data sensor ke database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO sensor_data (sensor_type, value, unit) VALUES (?, ?, ?)',
                (sensor_type, value, unit)
            )
            conn.commit()

    def save_action(self, action_type: str, target: str, value: str, reason: str):
        """Menyimpan log aksi ke database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO action_logs (action_type, target, value, reason) VALUES (?, ?, ?, ?)',
                (action_type, target, value, reason)
            )
            conn.commit()

    def get_latest_sensor_value(self, sensor_type: str) -> Dict[str, Any]:
        """Mendapatkan nilai sensor terbaru"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'SELECT value, unit, timestamp FROM sensor_data WHERE sensor_type = ? ORDER BY timestamp DESC LIMIT 1',
                (sensor_type,)
            )
            result = cursor.fetchone()
            
            if result:
                return {
                    'value': result[0],
                    'unit': result[1],
                    'timestamp': result[2]
                }
            return None

    def get_sensor_history(self, sensor_type: str, hours: int = 24) -> pd.DataFrame:
        """Mendapatkan history data sensor dalam bentuk DataFrame"""
        with sqlite3.connect(self.db_path) as conn:
            query = f'''
                SELECT timestamp, value, unit 
                FROM sensor_data 
                WHERE sensor_type = ? 
                AND timestamp >= datetime('now', '-{hours} hours')
                ORDER BY timestamp DESC
            '''
            return pd.read_sql_query(query, conn, params=(sensor_type,))

    def get_recent_actions(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Mendapatkan log aksi terbaru"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''
                SELECT timestamp, action_type, target, value, reason 
                FROM action_logs 
                ORDER BY timestamp DESC 
                LIMIT ?
                ''',
                (limit,)
            )
            
            columns = ['timestamp', 'action_type', 'target', 'value', 'reason']
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def get_last_action_for_target(self, target: str) -> Dict[str, Any]:
        """Mendapatkan aksi terakhir untuk target tertentu"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''
                SELECT timestamp, action_type, value, reason 
                FROM action_logs 
                WHERE target = ? 
                ORDER BY timestamp DESC 
                LIMIT 1
                ''',
                (target,)
            )
            result = cursor.fetchone()
            
            if result:
                return {
                    'timestamp': result[0],
                    'action_type': result[1],
                    'value': result[2],
                    'reason': result[3]
                }
            return None
