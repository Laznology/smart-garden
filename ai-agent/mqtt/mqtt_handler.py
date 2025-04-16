import json
from typing import Callable, Dict, Any
import paho.mqtt.client as mqtt
from config import MQTT_BROKER, MQTT_PORT, MQTT_TOPIC_SENSOR, MQTT_TOPIC_CONTROL
from database.db_handler import DatabaseHandler

class MQTTHandler:
    def __init__(self, database: DatabaseHandler, ai_callback: Callable[[Dict[str, Any]], None]):
        """
        Inisialisasi MQTT Handler
        
        Args:
            database: Instance dari DatabaseHandler untuk menyimpan data
            ai_callback: Callback function untuk memproses data dengan AI
        """
        self.client = mqtt.Client()
        self.database = database
        self.ai_callback = ai_callback
        
        # Setup callbacks
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        
        # Connect to broker
        self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
        
    def start(self):
        """Memulai loop MQTT client"""
        self.client.loop_start()
        
    def stop(self):
        """Menghentikan MQTT client"""
        self.client.loop_stop()
        self.client.disconnect()
        
    def _on_connect(self, client, userdata, flags, rc):
        """Callback ketika terhubung ke broker"""
        print(f"Terhubung ke MQTT broker dengan kode: {rc}")
        
        # Subscribe ke topik sensor
        self.client.subscribe(MQTT_TOPIC_SENSOR)
        print(f"Berlangganan ke topik: {MQTT_TOPIC_SENSOR}")
        
    def _on_message(self, client, userdata, msg):
        """Callback ketika menerima pesan"""
        try:
            # Decode pesan JSON
            payload = json.loads(msg.payload.decode())
            
            # Ekstrak informasi sensor
            sensor_type = payload.get('type')
            value = payload.get('value')
            unit = payload.get('unit')
            
            if all([sensor_type, value is not None, unit]):
                # Simpan ke database
                self.database.save_sensor_data(sensor_type, value, unit)
                
                # Kirim data ke AI untuk analisis
                sensor_data = {
                    'type': sensor_type,
                    'value': value,
                    'unit': unit
                }
                self.ai_callback(sensor_data)
                
            else:
                print(f"Format pesan tidak valid: {payload}")
                
        except json.JSONDecodeError:
            print(f"Error decoding JSON dari pesan: {msg.payload}")
        except Exception as e:
            print(f"Error memproses pesan: {str(e)}")
            
    def publish_control(self, target: str, command: str):
        """
        Mengirim perintah kontrol ke aktuator
        
        Args:
            target: Target aktuator (e.g., 'pump', 'nutrient_pump')
            command: Perintah yang akan dikirim (e.g., 'ON', 'OFF')
        """
        topic = f"{MQTT_TOPIC_CONTROL}/{target}"
        payload = json.dumps({
            'command': command,
            'timestamp': str(datetime.now())
        })
        
        self.client.publish(topic, payload)
        print(f"Mengirim perintah {command} ke {target}")
