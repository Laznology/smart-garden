import { TelegramClient } from "telegramsjs";
import { TelegramMessage } from "../../types/telegram";
import { dbService } from "../../services/database-service";
import { MQTTService } from "../../services/mqtt-service";

export async function handleRemoveTopic(bot: TelegramClient, message: TelegramMessage, args: string[]) {
  const chatId = message.chat?.id ?? 0;
  
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
    const mqttConfig = {
      broker: process.env.MQTT_BROKER || 'broker.emqx.io',
      port: parseInt(process.env.MQTT_PORT || '1883', 10),
      clientId: `smart_garden_bot_${Math.random().toString(16).slice(2, 8)}`,
      options: {
        keepalive: 60,
        reconnectPeriod: 1000,
        clean: true
      }
    };

    const mqttService = new MQTTService(mqttConfig, false);
    if (!topic.url) {
      throw new Error('URL topic tidak ditemukan');
    }
    await mqttService.unsubscribeTopic(topic.url);
    
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
