import asyncio
import os
from dotenv import load_dotenv
from database.db_handler import DatabaseHandler
from mqtt.mqtt_handler import MQTTHandler
from ai.model_handler import ModelHandler
from telegram.bot_handler import TelegramBotHandler
from config import COMMANDS

class SmartGardenAI:
    def __init__(self):
        """Inisialisasi Smart Garden AI System"""
        # Load environment variables
        load_dotenv()
        
        # Inisialisasi komponen
        self.database = DatabaseHandler()
        self.ai_model = ModelHandler(self.database)
        self.mqtt_handler = MQTTHandler(self.database, self._process_sensor_data)
        self.telegram_bot = TelegramBotHandler(self.database)
        
    def _process_sensor_data(self, sensor_data):
        """
        Callback untuk memproses data sensor
        
        Args:
            sensor_data: Dictionary berisi data sensor
        """
        try:
            # Analisis data dengan AI
            needs_action, action_type, confidence = self.ai_model.analyze_sensor_data(sensor_data)
            
            if needs_action and confidence >= 0.7:  # Threshold confidence
                # Ambil command dari config
                command = COMMANDS.get(action_type)
                if command:
                    # Tentukan target berdasarkan jenis aksi
                    target = 'nutrient_pump' if 'NUTRIENT' in action_type else 'pump'
                    
                    # Kirim perintah ke aktuator
                    self.mqtt_handler.publish_control(target, command)
                    
                    # Simpan log aksi
                    reason = (
                        f"Sensor {sensor_data['type']} menunjukkan nilai {sensor_data['value']} "
                        f"{sensor_data['unit']} (confidence: {confidence:.2f})"
                    )
                    self.database.save_action(action_type, target, command, reason)
                    
            # Update model dengan data baru
            self.ai_model.train_model()
            
        except Exception as e:
            print(f"Error memproses data sensor: {str(e)}")
            
    async def start(self):
        """Memulai Smart Garden AI System"""
        try:
            print("Memulai Smart Garden AI System...")
            
            # Mulai MQTT handler
            self.mqtt_handler.start()
            print("MQTT Handler dimulai")
            
            # Mulai Telegram bot
            await self.telegram_bot.start()
            print("Telegram Bot dimulai")
            
        except Exception as e:
            print(f"Error saat memulai sistem: {str(e)}")
            await self.stop()
            
    async def stop(self):
        """Menghentikan Smart Garden AI System"""
        try:
            # Hentikan MQTT handler
            self.mqtt_handler.stop()
            print("MQTT Handler dihentikan")
            
            # Hentikan Telegram bot
            await self.telegram_bot.stop()
            print("Telegram Bot dihentikan")
            
        except Exception as e:
            print(f"Error saat menghentikan sistem: {str(e)}")
            
async def main():
    """Main entry point"""
    smart_garden = SmartGardenAI()
    
    try:
        await smart_garden.start()
        
        # Jalankan sistem sampai ada interupsi
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print("\nMenerima sinyal interrupt...")
    finally:
        await smart_garden.stop()
        print("Sistem dihentikan")
        
if __name__ == "__main__":
    asyncio.run(main())
