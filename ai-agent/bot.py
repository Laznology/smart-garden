import os
from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import Application, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv
from main import analyze_hydroponic_data
from db_loader import HydroponicDBLoader
from telegram_helper import (
    escape_markdown,
    format_sensor_data,
    format_summary,
    parse_date_query,
    safe_markdown_message
)

# Load environment variables
load_dotenv()
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")

# Initialize database loader
db_loader = HydroponicDBLoader()

def get_data_summary(date=None):
    """Get formatted summary of recent data."""
    try:
        summary = db_loader.get_latest_summary()
        docs = db_loader.load_data()
        
        if date:
            # Filter documents by date if specified
            docs = [doc for doc in docs if date.date() == doc.metadata.get('timestamp').date()]
            if not docs:
                return f"❌ Tidak ada data untuk tanggal {date.strftime('%d %B %Y')}"
        
        response = f"""
📊 *Ringkasan Data Hidroponik*

{format_summary(summary)}

📝 *Data Terakhir:* _{len(docs)} record_
"""
        # Format each sensor reading
        for i, doc in enumerate(docs[:3]):
            try:
                # Parse document content into dictionary
                data = {
                    'timestamp': doc.metadata.get('timestamp'),
                    'suhu': doc.metadata.get('suhu'),
                    'kelembaban': doc.metadata.get('kelembaban'),
                    'ph': doc.metadata.get('ph'),
                    'nutrisi': doc.metadata.get('nutrisi'),
                    'status': doc.metadata.get('status', 'Normal')
                }
                response += format_sensor_data(data)
            except Exception:
                response += f"\n{escape_markdown(doc.page_content)}"
        
        if len(docs) > 3:
            response += f"\n\n_{escape_markdown(f'...dan {len(docs)-3} data lainnya')}_"
            
        return response
    except Exception as e:
        return f"❌ Error mengambil data: {escape_markdown(str(e))}"

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle all messages with natural language processing."""
    try:
        message = update.message.text.lower()
        
        # Pesan selamat datang
        if any(word in message for word in ['halo', 'hai', 'hi', 'hello']):
            welcome_text = """
🌱 *Selamat datang di Hidroponik AI Assistant\!*

Saya dapat membantu Anda memantau sistem hidroponik\. Anda bisa bertanya tentang:
• Status dan kondisi tanaman
• Data sensor terbaru
• Analisis kelembaban dan nutrisi
• Rekomendasi perawatan
• Data berdasarkan tanggal tertentu
• Dan informasi lainnya

_Silakan ajukan pertanyaan Anda_ 😊
"""
            await update.message.reply_text(welcome_text, parse_mode=ParseMode.MARKDOWN)
            return

        # Cek query tanggal
        date = parse_date_query(message)
        if date:
            response = get_data_summary(date)
            await update.message.reply_text(response, parse_mode=ParseMode.MARKDOWN)
            return

        # Cek jika user menanyakan tentang data
        if any(phrase in message for phrase in ['data', 'sensor', 'berapa data', 'lihat data']):
            response = get_data_summary()
            await update.message.reply_text(response, parse_mode=ParseMode.MARKDOWN)
            return

        # Untuk pertanyaan lainnya, gunakan LangChain untuk analisis
        result = analyze_hydroponic_data(message)
        # Pastikan response aman untuk Markdown
        safe_result = safe_markdown_message(result)
        await update.message.reply_text(safe_result, parse_mode=ParseMode.MARKDOWN)

    except Exception as e:
        error_message = f"""
❌ *Maaf, terjadi error*

_{escape_markdown(str(e))}_

Silakan coba lagi atau ajukan pertanyaan dengan cara berbeda\.
"""
        # Jika masih error, kirim tanpa Markdown
        try:
            await update.message.reply_text(error_message, parse_mode=ParseMode.MARKDOWN)
        except Exception:
            await update.message.reply_text(f"Error: {str(e)}")

def main():
    """Start the bot."""
    # Create the Application
    application = Application.builder().token(TELEGRAM_TOKEN).build()

    # Handle all messages
    application.add_handler(MessageHandler(filters.TEXT, handle_message))

    # Start the bot
    print("Bot started... Ready to process natural language queries!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
