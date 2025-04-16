from typing import Dict, Any
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from config import TELEGRAM_TOKEN, COMMANDS
from database.db_handler import DatabaseHandler

class TelegramBotHandler:
    def __init__(self, database: DatabaseHandler):
        """
        Inisialisasi Telegram Bot Handler
        
        Args:
            database: Instance dari DatabaseHandler untuk akses data
        """
        self.database = database
        self.application = Application.builder().token(TELEGRAM_TOKEN).build()
        
        # Register handlers
        self.application.add_handler(CommandHandler("start", self._start_command))
        self.application.add_handler(CommandHandler("help", self._help_command))
        self.application.add_handler(CommandHandler("status", self._status_command))
        self.application.add_handler(CommandHandler("history", self._history_command))
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self._handle_message))
        
    async def start(self):
        """Memulai bot"""
        await self.application.initialize()
        await self.application.start()
        await self.application.run_polling()
        
    async def stop(self):
        """Menghentikan bot"""
        await self.application.stop()
        
    async def _start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler untuk command /start"""
        welcome_message = (
            "Selamat datang di Hidroponik Smart Garden Bot!\n\n"
            "Perintah yang tersedia:\n"
            "/status - Cek status terkini sensor\n"
            "/history - Lihat riwayat 24 jam terakhir\n"
            "/help - Tampilkan bantuan\n\n"
            "Anda juga bisa bertanya langsung seperti:\n"
            "- Bagaimana kondisi pH sekarang?\n"
            "- Kapan terakhir pompa dinyalakan?\n"
            "- Apakah nutrisi cukup?"
        )
        await update.message.reply_text(welcome_message)
        
    async def _help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler untuk command /help"""
        help_message = (
            "Cara menggunakan bot:\n\n"
            "1. Perintah tersedia:\n"
            "   /status - Cek status terkini sensor\n"
            "   /history - Lihat riwayat 24 jam terakhir\n"
            "   /help - Tampilkan bantuan\n\n"
            "2. Pertanyaan langsung:\n"
            "   - 'Berapa suhu sekarang?'\n"
            "   - 'pH terkini?'\n"
            "   - 'Status nutrisi?'\n"
            "   - 'Kapan pompa terakhir nyala?'\n\n"
            "3. Bot akan merespons dengan informasi yang relevan\n"
            "   berdasarkan data sensor dan log aktivitas sistem."
        )
        await update.message.reply_text(help_message)
        
    async def _status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler untuk command /status"""
        sensor_types = ['ph', 'temperature', 'nutrient']
        status_message = "Status Terkini:\n\n"
        
        for sensor_type in sensor_types:
            latest = self.database.get_latest_sensor_value(sensor_type)
            if latest:
                status_message += (
                    f"{sensor_type.capitalize()}:\n"
                    f"Nilai: {latest['value']} {latest['unit']}\n"
                    f"Waktu: {latest['timestamp']}\n\n"
                )
            else:
                status_message += f"{sensor_type.capitalize()}: Data tidak tersedia\n\n"
                
        await update.message.reply_text(status_message)
        
    async def _history_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler untuk command /history"""
        sensor_types = ['ph', 'temperature', 'nutrient']
        history_message = "Riwayat 24 Jam Terakhir:\n\n"
        
        for sensor_type in sensor_types:
            history = self.database.get_sensor_history(sensor_type)
            if not history.empty:
                avg_value = history['value'].mean()
                min_value = history['value'].min()
                max_value = history['value'].max()
                unit = history['unit'].iloc[0]
                
                history_message += (
                    f"{sensor_type.capitalize()}:\n"
                    f"Rata-rata: {avg_value:.2f} {unit}\n"
                    f"Minimum: {min_value:.2f} {unit}\n"
                    f"Maximum: {max_value:.2f} {unit}\n\n"
                )
            else:
                history_message += f"{sensor_type.capitalize()}: Data tidak tersedia\n\n"
                
        # Tambahkan riwayat aksi
        recent_actions = self.database.get_recent_actions(5)
        if recent_actions:
            history_message += "Aksi Terakhir:\n"
            for action in recent_actions:
                history_message += (
                    f"- {action['timestamp']}: "
                    f"{action['action_type']} pada {action['target']} "
                    f"({action['value']})\n"
                )
                
        await update.message.reply_text(history_message)
        
    async def _handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler untuk pesan teks biasa"""
        text = update.message.text.lower()
        response = "Maaf, saya tidak mengerti pertanyaan Anda."
        
        # Cek pertanyaan tentang sensor
        if 'ph' in text:
            latest = self.database.get_latest_sensor_value('ph')
            if latest:
                response = f"pH terkini: {latest['value']} {latest['unit']} (diukur pada {latest['timestamp']})"
                
        elif any(word in text for word in ['suhu', 'temperatur']):
            latest = self.database.get_latest_sensor_value('temperature')
            if latest:
                response = f"Suhu terkini: {latest['value']} {latest['unit']} (diukur pada {latest['timestamp']})"
                
        elif 'nutrisi' in text:
            latest = self.database.get_latest_sensor_value('nutrient')
            if latest:
                response = f"Level nutrisi terkini: {latest['value']} {latest['unit']} (diukur pada {latest['timestamp']})"
                
        # Cek pertanyaan tentang pompa
        elif 'pompa' in text:
            pump_status = self.database.get_last_action_for_target('pump')
            if pump_status:
                response = (
                    f"Status terakhir pompa:\n"
                    f"Aksi: {pump_status['action_type']}\n"
                    f"Waktu: {pump_status['timestamp']}\n"
                    f"Alasan: {pump_status['reason']}"
                )
                
        await update.message.reply_text(response)
