from typing import List
import mysql.connector
from datetime import datetime
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from dotenv import load_dotenv
import os

load_dotenv()

class HydroponicDBLoader:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
            'database': os.getenv('DB_NAME')
        }
        
    def load_data(self) -> List[Document]:
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            
            # Query untuk mengambil data hidroponik terbaru (contoh: 100 data terakhir)
            query = """
            SELECT timestamp, suhu, kelembaban, ph, nutrisi, status_tanaman 
            FROM hidroponik_data 
            ORDER BY timestamp DESC 
            LIMIT 100
            """
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            documents = []
            for row in rows:
                timestamp, suhu, kelembaban, ph, nutrisi, status = row
                
                # Format data menjadi teks terstruktur
                content = f"""
                Waktu: {timestamp}
                Suhu: {suhu}°C
                Kelembaban: {kelembaban}%
                pH: {ph}
                Nutrisi: {nutrisi} PPM
                Status Tanaman: {status}
                """
                
                # Buat dokumen dengan metadata lengkap
                doc = Document(
                    page_content=content,
                    metadata={
                        "timestamp": timestamp,
                        "suhu": suhu,
                        "kelembaban": kelembaban,
                        "ph": ph,
                        "nutrisi": nutrisi,
                        "status": status,
                        "source": "hidroponik_database"
                    }
                )
                documents.append(doc)
            
            cursor.close()
            conn.close()
            
            # Split dokumen jika terlalu panjang
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            
            split_docs = text_splitter.split_documents(documents)
            return split_docs
            
        except mysql.connector.Error as err:
            print(f"Error: {err}")
            return []

    def get_latest_summary(self) -> str:
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            
            # Ambil data terbaru untuk ringkasan
            query = """
            SELECT AVG(suhu) as avg_suhu, 
                   AVG(kelembaban) as avg_kelembaban,
                   AVG(ph) as avg_ph,
                   AVG(nutrisi) as avg_nutrisi,
                   MAX(timestamp) as last_update,
                   COUNT(*) as total_records
            FROM hidroponik_data 
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            """
            
            cursor.execute(query)
            row = cursor.fetchone()
            
            if row and row[5] > 0:  # Jika ada data
                summary = f"""
📊 Ringkasan 1 Jam Terakhir:
• Suhu rata-rata: {row[0]:.1f}°C
• Kelembaban rata-rata: {row[1]:.1f}%
• pH rata-rata: {row[2]:.2f}
• Nutrisi rata-rata: {row[3]:.0f} PPM
• Total data: {row[5]} record
• Update terakhir: {row[4]}
                """
            else:
                summary = "⚠️ Tidak ada data dalam 1 jam terakhir"
            
            cursor.close()
            conn.close()
            
            return summary
            
        except mysql.connector.Error as err:
            print(f"Error: {err}")
            return "❌ Error mengambil ringkasan data"

    def get_data_by_date(self, date: datetime) -> List[Document]:
        """Get data for a specific date."""
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            
            query = """
            SELECT timestamp, suhu, kelembaban, ph, nutrisi, status_tanaman 
            FROM hidroponik_data 
            WHERE DATE(timestamp) = DATE(%s)
            ORDER BY timestamp DESC
            """
            
            cursor.execute(query, (date,))
            rows = cursor.fetchall()
            
            documents = []
            for row in rows:
                timestamp, suhu, kelembaban, ph, nutrisi, status = row
                
                content = f"""
                Waktu: {timestamp}
                Suhu: {suhu}°C
                Kelembaban: {kelembaban}%
                pH: {ph}
                Nutrisi: {nutrisi} PPM
                Status Tanaman: {status}
                """
                
                doc = Document(
                    page_content=content,
                    metadata={
                        "timestamp": timestamp,
                        "suhu": suhu,
                        "kelembaban": kelembaban,
                        "ph": ph,
                        "nutrisi": nutrisi,
                        "status": status,
                        "source": "hidroponik_database"
                    }
                )
                documents.append(doc)
            
            cursor.close()
            conn.close()
    
            return documents
            
        except mysql.connector.Error as err:
            print(f"Error: {err}")
            return []
