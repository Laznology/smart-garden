import { TelegramClient } from "telegramsjs";
import { MQTTService } from "../../services/mqtt-service";

export async function handleStart(
  bot: TelegramClient, 
  message: any, 
  _args: string[],
  mqttService: MQTTService
) {
  const welcomeMessage = `
🌱 Selamat datang di Smart Garden Bot!

Berikut adalah daftar perintah yang tersedia:

📝 Manajemen Topic
/addtopic [nama farm] [nama-sensor] [topic-url]
  ➜ Menambahkan topic baru untuk monitoring sensor. Jika farm belum ada, akan dibuat otomatis.
  ➜ Contoh: /addtopic Kebun Belakang temperature sensor/kebunbelakang/temp

/removetopic [nama-sensor]
  ➜ Menghapus topic yang sudah tidak digunakan
  ➜ Contoh: /removetopic Kebun Belakang-temperature

/listtopic
  ➜ Menampilkan semua topic yang sedang dimonitor

💡 Tipe sensor yang didukung:
• temperature - Suhu
• humidity - Kelembaban udara
• soil_moisture - Kelembaban tanah
• light - Intensitas cahaya

❓ Anda juga dapat bertanya tentang kondisi kebun dengan mengirim pertanyaan langsung.
Contoh: "Bagaimana kondisi suhu di Kebun Belakang?"

Status MQTT: ${mqttService.getConnectionStatus() ? "🟢 Terhubung" : "🔴 Terputus"}
`;

  await bot.sendMessage({
    chatId: message.chat.id,
    text: welcomeMessage
  });
}
