import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MQTT Configuration
MQTT_BROKER = os.getenv('MQTT_BROKER', 'localhost')
MQTT_PORT = int(os.getenv('MQTT_PORT', 1883))
MQTT_TOPIC_SENSOR = 'hidroponik/sensors/#'
MQTT_TOPIC_CONTROL = 'hidroponik/control/#'

# Database Configuration
DATABASE_PATH = 'data/hidroponik.db'

# Telegram Configuration
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN', '')

# AI Model Configuration
MODEL_PATH = 'models/hidroponik_model.pkl'

# Sensor Thresholds
THRESHOLDS = {
    'ph': {
        'min': 5.5,
        'max': 7.0
    },
    'temperature': {
        'min': 20,
        'max': 30
    },
    'nutrient': {
        'min': 500,
        'max': 1500
    }
}

# Action Commands
COMMANDS = {
    'PUMP_ON': 'ON',
    'PUMP_OFF': 'OFF',
    'NUTRIENT_PUMP_ON': 'NON',
    'NUTRIENT_PUMP_OFF': 'NOFF',
}
