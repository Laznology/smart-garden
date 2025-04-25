import { TelegramClient } from "telegramsjs";
import { TelegramMessage } from "../../types/telegram";
import { dbService } from "../../services/database-service";

export async function handleList(bot: TelegramClient, message: TelegramMessage) {
  const chatId = message.chat?.id ?? 0;
  
  try {
    const topics = await dbService.getAllTopics();
    
    if (topics.length === 0) {
      await bot.sendMessage({
        chatId,
        text: "ℹ️ Belum ada topic yang terdaftar. Gunakan /addtopic untuk menambahkan topic sensor."
      });
      return;
    }
    
    // Format list topic untuk ditampilkan
    let messageText = "📋 Daftar Topic Terdaftar:\n\n";
    
    for (const topic of topics) {
      if (topic.name && topic.url) {
        const parts = topic.name.split('/');
        const farmName = parts[0] || 'Unknown';
        const sensorType = parts[1] || 'Unknown';
        
        messageText += `🏡 Farm: ${farmName}\n`;
        messageText += `📟 Sensor: ${sensorType}\n`;
        messageText += `🔗 Topic: ${topic.url}\n`;
        messageText += `📅 Terdaftar: ${topic.updatedAt.toLocaleString("id-ID")}\n\n`;
      }
    }
    
    await bot.sendMessage({
      chatId,
      text: messageText
    });
    
  } catch (error) {
    console.error("❌ Error saat menampilkan daftar topic:", error);
    await bot.sendMessage({
      chatId,
      text: "❌ Terjadi kesalahan saat mengambil daftar topic."
    });
  }
}
