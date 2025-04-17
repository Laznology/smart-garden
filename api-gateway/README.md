# Smart Garden API Gateway

Gateway untuk menyimpan data yang di-stream dari MQTT topic ke dalam database MySQL menggunakan Prisma ORM.

## Fitur

- Koneksi ke MQTT broker (menggunakan EMQX public broker)
- Subscribe ke topic sensor
- Penyimpanan data otomatis ke MySQL database
- Menggunakan Prisma ORM untuk database operations
- TypeScript untuk type safety

## Prerequisite

- Node.js
- MySQL Server
- npm/yarn

## Setup

1. Clone repository
2. Install dependencies:
```bash
npm install
```

3. Copy file .env.example ke .env dan sesuaikan konfigurasi:
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/smart_garden"

# MQTT Configuration
MQTT_BROKER="broker.emqx.io"
MQTT_PORT=1883
MQTT_CLIENT_ID="smart_garden_gateway"
MQTT_TOPICS="sensors/p5/dev"
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

5. Jalankan database migration:
```bash
npx prisma migrate dev
```

## Menjalankan Aplikasi

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Database Schema

```prisma
model SensorData {
  id        Int      @id @default(autoincrement())
  topic     String
  payload   Json
  createdAt DateTime @default(now())

  @@index([topic])
  @@index([createdAt])
}
```

## Struktur Project

```
api-gateway/
├── src/
│   ├── config/
│   │   └── mqtt.ts
│   ├── services/
│   │   └── mqtt.service.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── .env
└── package.json
