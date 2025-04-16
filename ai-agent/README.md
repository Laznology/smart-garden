# Smart Garden AI Agent

Sistem AI untuk mengelola taman hidroponik secara otomatis dengan kemampuan monitoring dan kontrol melalui MQTT dan Telegram bot.

## Fitur Utama

1. **Monitoring Sensor**
   - pH
   - Suhu
   - Level nutrisi

2. **Kontrol Otomatis**
   - Kontrol pompa air berdasarkan analisis AI
   - Kontrol pompa nutrisi otomatis
   - Pengambilan keputusan berbasis machine learning

3. **Telegram Bot Interface**
   - Monitoring status real-time
   - Riwayat 24 jam terakhir
   - Tanya jawab dalam bahasa natural

## Persyaratan Sistem

- Python 3.8+
- MQTT Broker (mis. Mosquitto)
- Koneksi internet untuk Telegram Bot
- Perangkat sensor yang mendukung MQTT

## Instalasi

1. Clone repository:
   ```bash
   git clone [repository-url]
   cd smart-garden-ai
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Salin file konfigurasi:
   ```bash
   cp .env.example .env
   ```

4. Update konfigurasi di file `.env`:
   ```env
   MQTT_BROKER=your_mqtt_broker_address
   MQTT_PORT=1883
   TELEGRAM_TOKEN=your_telegram_bot_token
   ```

## Penggunaan

1. Jalankan sistem:
   ```bash
   python main.py
   ```

2. Akses Telegram Bot:
   - Mulai chat dengan bot menggunakan token yang telah dikonfigurasi
   - Gunakan command `/start` untuk melihat panduan penggunaan
   - Gunakan command `/help` untuk melihat daftar perintah lengkap

## Format Data MQTT

### Sensor Data (Subscribe)
Topic: `hidroponik/sensors/<sensor_type>`
```json
{
    "type": "ph|temperature|nutrient",
    "value": 7.0,
    "unit": "pH|C|ppm"
}
```

### Control Commands (Publish)
Topic: `hidroponik/control/<target>`
```json
{
    "command": "ON|OFF",
    "timestamp": "2025-04-16T22:20:00"
}
```

## Perintah Telegram Bot

1. Commands:
   - `/start` - Memulai bot
   - `/help` - Menampilkan bantuan
   - `/status` - Cek status terkini
   - `/history` - Melihat riwayat 24 jam

2. Natural Language Queries:
   - "Berapa pH sekarang?"
   - "Bagaimana suhu terkini?"
   - "Status nutrisi?"
   - "Kapan pompa terakhir nyala?"

## Konfigurasi AI

Sistem menggunakan Random Forest Classifier untuk menganalisis data sensor dan membuat keputusan. Model akan terus belajar dari data baru yang masuk.

Threshold default:
- pH: 5.5 - 7.0
- Suhu: 20°C - 30°C
- Nutrisi: 500 - 1500 ppm

## Struktur Project

```
smart-garden-ai/
├── ai/
│   └── model_handler.py
├── database/
│   └── db_handler.py
├── mqtt/
│   └── mqtt_handler.py
├── telegram/
│   └── bot_handler.py
├── main.py
├── config.py
├── requirements.txt
└── .env
```

## Troubleshooting

1. Koneksi MQTT:
   - Pastikan MQTT broker berjalan
   - Verifikasi alamat dan port broker
   - Cek firewall settings

2. Telegram Bot:
   - Pastikan token valid
   - Verifikasi koneksi internet
   - Cek log untuk error messages

3. Database:
   - Pastikan direktori data ada dan dapat ditulis
   - Backup database secara berkala

## Kontribusi

Silakan berkontribusi dengan membuat pull request atau melaporkan issues.

## Lisensi

MIT License
