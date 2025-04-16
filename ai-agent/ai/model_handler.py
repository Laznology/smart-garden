import pickle
import numpy as np
from typing import Dict, Any, Tuple
from datetime import datetime
import os
from sklearn.ensemble import RandomForestClassifier
from config import MODEL_PATH, THRESHOLDS
from database.db_handler import DatabaseHandler

class ModelHandler:
    def __init__(self, database: DatabaseHandler):
        """
        Inisialisasi AI Model Handler
        
        Args:
            database: Instance dari DatabaseHandler untuk akses data historis
        """
        self.database = database
        self.model = self._load_or_create_model()
        
    def _load_or_create_model(self) -> RandomForestClassifier:
        """Load model yang ada atau buat model baru jika belum ada"""
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                return pickle.load(f)
        
        # Buat model baru jika belum ada
        return RandomForestClassifier(
            n_estimators=100,
            random_state=42
        )
        
    def save_model(self):
        """Simpan model ke file"""
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(self.model, f)
            
    def analyze_sensor_data(self, sensor_data: Dict[str, Any]) -> Tuple[bool, str, float]:
        """
        Menganalisis data sensor dan menentukan apakah perlu mengambil tindakan
        
        Args:
            sensor_data: Dictionary berisi data sensor

        Returns:
            Tuple berisi:
            - bool: Apakah perlu mengambil tindakan
            - str: Jenis tindakan yang direkomendasikan
            - float: Confidence score dari prediksi
        """
        sensor_type = sensor_data['type']
        value = float(sensor_data['value'])
        
        # Cek threshold
        if sensor_type in THRESHOLDS:
            threshold = THRESHOLDS[sensor_type]
            
            # Jika di luar threshold
            if value < threshold['min']:
                if sensor_type == 'nutrient':
                    return True, 'NUTRIENT_PUMP_ON', 0.9
                return True, 'PUMP_ON', 0.9
            elif value > threshold['max']:
                if sensor_type == 'nutrient':
                    return True, 'NUTRIENT_PUMP_OFF', 0.9
                return True, 'PUMP_OFF', 0.9
                
        # Jika masih dalam batas normal
        return False, None, 0.0
        
    def train_model(self, batch_size: int = 1000):
        """
        Melatih model dengan data historis
        
        Args:
            batch_size: Jumlah data yang digunakan untuk training
        """
        # Ambil data historis untuk training
        sensor_types = ['ph', 'temperature', 'nutrient']
        training_data = []
        training_labels = []
        
        for sensor_type in sensor_types:
            history = self.database.get_sensor_history(sensor_type, hours=24)
            if not history.empty:
                # Proses data untuk training
                for _, row in history.iterrows():
                    value = row['value']
                    threshold = THRESHOLDS.get(sensor_type, {})
                    
                    if threshold:
                        # Buat label berdasarkan threshold
                        if value < threshold['min']:
                            label = 1  # Perlu aksi ON
                        elif value > threshold['max']:
                            label = 2  # Perlu aksi OFF
                        else:
                            label = 0  # Tidak perlu aksi
                            
                        training_data.append([value])
                        training_labels.append(label)
        
        if training_data:
            # Update model dengan data baru
            self.model.fit(np.array(training_data), np.array(training_labels))
            self.save_model()
            print(f"Model diupdate dengan {len(training_data)} data points")
            
    def predict_action(self, sensor_data: Dict[str, Any]) -> Tuple[bool, str, float]:
        """
        Memprediksi aksi berdasarkan data sensor menggunakan model
        
        Args:
            sensor_data: Dictionary berisi data sensor

        Returns:
            Tuple berisi:
            - bool: Apakah perlu mengambil tindakan
            - str: Jenis tindakan yang direkomendasikan
            - float: Confidence score dari prediksi
        """
        value = float(sensor_data['value'])
        prediction = self.model.predict_proba([[value]])
        
        # Ambil class dengan probabilitas tertinggi
        max_prob_idx = np.argmax(prediction[0])
        confidence = prediction[0][max_prob_idx]
        
        # Mapping prediksi ke aksi
        if max_prob_idx == 0:  # Tidak perlu aksi
            return False, None, confidence
        elif max_prob_idx == 1:  # Perlu aksi ON
            if sensor_data['type'] == 'nutrient':
                return True, 'NUTRIENT_PUMP_ON', confidence
            return True, 'PUMP_ON', confidence
        else:  # Perlu aksi OFF
            if sensor_data['type'] == 'nutrient':
                return True, 'NUTRIENT_PUMP_OFF', confidence
            return True, 'PUMP_OFF', confidence
