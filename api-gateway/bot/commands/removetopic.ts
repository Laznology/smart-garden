import { TelegramClient } from "telegramsjs";
import { dbService } from "../services/database-service";
import { unsubscribeFromTopic } from "../services/mqtt-service";

export async function handleRemoveTopic(bot: TelegramClient, message: any, args: string[]) {
  const chatId = message.chat?.id || 0;
  
  if (args.length < 2) {
    await bot.sendMessage({
      chatId,
      text: "⚠️ Format perintah salah. Gunakan: /removetopic [nama-farm] [nama-sensor]"
    });
    return;
  }
  
  const [farmName, sensorType] = args;
  const topicName = `${farmName}/${sensorType}`;
  
  try {
    // Cek apakah topic ada di database
    const topic = await dbService.getTopicByName(topicName);
    
    if (!topic) {
      await bot.sendMessage({
        chatId,
        text: `⚠️ Topic untuk farm "${farmName}" dan sensor "${sensorType}" tidak ditemukan.`
      });
      return;
    }
    
    // Unsubscribe dari topic
    await unsubscribeFromTopic(topicName);
    
    await bot.sendMessage({
      chatId,
      text: `✅ Berhasil menghapus topic "${topicName}" dan berhenti menerima data dari: ${topic.url}`
    });
    
  } catch (error) {
    console.error("❌ Error saat menghapus topic:", error);
    await bot.sendMessage({
      chatId,
      text: "❌ Terjadi kesalahan saat menghapus topic. Silakan coba lagi."
    });
  }
} 