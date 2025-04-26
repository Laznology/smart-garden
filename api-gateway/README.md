# Smart Garden API Gateway & Telegram Bot

Gateway untuk menyimpan data sensor dari MQTT ke database MySQL dan menyediakan antarmuka bot Telegram untuk interaksi dan monitoring. Bot ini juga terintegrasi dengan Gemini AI untuk menjawab pertanyaan kontekstual tentang kondisi kebun.

## Fitur

-   Koneksi ke MQTT broker.
-   Subscribe ke topic sensor secara dinamis melalui bot.
-   Penyimpanan data sensor otomatis ke database MySQL menggunakan Prisma ORM.
-   Antarmuka bot Telegram untuk:
    -   Menambah/menghapus topic MQTT.
    -   Menampilkan daftar topic yang dimonitor.
    -   Menampilkan status koneksi MQTT.
    -   Menjawab pertanyaan tentang kondisi kebun menggunakan Gemini AI berdasarkan data sensor terbaru dan historis.
-   TypeScript untuk type safety.

## Prerequisite

-   Node.js (v18 atau lebih baru direkomendasikan)
-   pnpm (package manager)
-   MySQL Server
-   Akun Telegram & Token Bot
-   API Key Google Gemini

## Setup

1.  **Clone repository:**
    ```bash
    git clone <url-repository>
    cd smart-garden/api-gateway
    ```

2.  **Install dependencies:**
    Gunakan `pnpm` untuk menginstall dependensi.
    ```bash
    pnpm install
    ```

3.  **Konfigurasi Environment Variables:**
    Salin file `.env.example` (jika ada) atau buat file baru bernama `.env` di root project dan isi variabel berikut:
    ```env
    # Database MySQL Connection URL
    # Format: mysql://<user>:<password>@<host>:<port>/<database_name>
    DATABASE_URL="mysql://user:password@localhost:3306/smart_garden"

    # MQTT Broker Configuration
    MQTT_BROKER="broker.emqx.io" # Ganti jika menggunakan broker lain
    MQTT_PORT=1883
    MQTT_CLIENT_ID="smart_garden_gateway_unique" # Sebaiknya unik

    # Telegram Bot Token
    TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN"

    # Google Gemini API Key
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```
    Pastikan database `smart_garden` sudah dibuat di MySQL server Anda.

4.  **Generate Prisma Client:**
    Perintah ini menggenerate Prisma Client berdasarkan skema database Anda.
    ```bash
    pnpm prisma generate
    ```

5.  **Jalankan Database Migration:**
    Perintah ini akan membuat tabel-tabel yang diperlukan di database Anda sesuai dengan `prisma/schema.prisma`.
    ```bash
    pnpm prisma migrate dev
    ```
    Saat pertama kali dijalankan, Anda mungkin akan diminta untuk memberi nama migrasi.

## Menjalankan Aplikasi

-   **Development Mode:**
    Menjalankan aplikasi menggunakan `ts-node` dengan hot-reloading (jika diatur).
    ```bash
    pnpm run dev
    ```

-   **Production Mode:**
    Build aplikasi ke JavaScript dan jalankan versi yang sudah di-build.
    ```bash
    pnpm run build
    pnpm start
    ```

## Perintah Bot Telegram

Setelah bot berjalan, Anda dapat berinteraksi dengannya di Telegram:

-   `/start` atau `/help`: Menampilkan pesan selamat datang dan daftar perintah.
-   `/addtopic [nama farm] [tipe-sensor] [topic-url]`: Menambahkan topic MQTT baru untuk dimonitor.
    -   Contoh: `/addtopic KebunDepan temperature sensors/kebundepan/temp`
    -   Tipe sensor yang valid: `temperature`, `humidity`, `soil_moisture`, `light`.
-   `/removetopic [nama-sensor]`: Menghapus topic berdasarkan nama sensor yang dibuat (format: `[nama farm]-[tipe-sensor]`).
    -   Contoh: `/removetopic KebunDepan-temperature`
-   `/listtopic`: Menampilkan semua topic yang sedang dimonitor, dikelompokkan per farm.
-   **Pertanyaan Langsung**: Kirim pertanyaan dalam bahasa natural tentang kondisi kebun. Bot akan menggunakan Gemini AI dan data sensor untuk menjawab.
    -   Contoh: "Bagaimana suhu di Kebun Depan saat ini?"
    -   Contoh: "Apakah tanaman di Kebun Belakang perlu disiram?"

## Database Schema

Skema database didefinisikan dalam file `prisma/schema.prisma`. Model utama meliputi:

-   `Farm`: Informasi tentang kebun/farm.
-   `SensorReading`: Menyimpan data pembacaan sensor individual.
-   `Analytic`: (Jika diimplementasikan) Menyimpan hasil analisis data sensor.
-   `Topic`: Menyimpan informasi tentang topic MQTT yang disubscribe.
-   `Message`: (Jika diimplementasikan) Menyimpan log pesan bot.

## Struktur Project (Ringkasan)

```
api-gateway/
├── prisma/                 # Konfigurasi dan migrasi Prisma
│   └── schema.prisma
├── src/
│   ├── bot/                # Logika dan command bot Telegram
│   │   ├── commands/       # Handler untuk setiap command bot
│   │   └── bot.ts          # Inisialisasi dan event handler bot
│   ├── config/             # File konfigurasi (DB, MQTT, Telegram, Gemini)
│   ├── services/           # Servis (Database, MQTT, Gemini)
│   ├── types/              # Definisi tipe TypeScript
│   └── index.ts            # Entry point aplikasi
├── .env                    # File environment variables (Jangan di-commit)
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── README.md
```
