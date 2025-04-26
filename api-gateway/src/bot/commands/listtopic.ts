import { TelegramClient } from "telegramsjs";
import { dbService } from "../../services/database-service";
import { MQTTService } from "../../services/mqtt-service";

export async function handleList(
  bot: TelegramClient, 
  message: any, 
  _args: string[], 
  mqttService: MQTTService
) {
  try {
    const topics = await dbService.getAllTopics();
    
    if (topics.length === 0) {
      await bot.sendMessage({
        chatId: message.chat.id,
        text: "Belum ada topic yang disubscribe."
      });
      return;
    }

    const topicsByFarm = topics.reduce((acc, topic) => {
      if (!acc[topic.farm.name]) {
        acc[topic.farm.name] = [];
      }
      acc[topic.farm.name].push({
        name: topic.name,
        sensor: topic.sensor_type,
        url: topic.url,
        isConnected: mqttService.getConnectionStatus()
      });
      return acc;
    }, {} as { [key: string]: Array<{ name: string; sensor: string; url: string; isConnected: boolean }> });

    // Format message
    let responseText = "📡 Daftar Topic Tersubscribe:\n\n";
    
    for (const [farmName, farmTopics] of Object.entries(topicsByFarm)) {
      responseText += `🌾 Farm: ${farmName}\n`;
      for (const topic of farmTopics) {
        const statusEmoji = topic.isConnected ? "🟢" : "🔴";
        responseText += `${statusEmoji} ${topic.sensor}: ${topic.url}\n`;
      }
      responseText += "\n";
    }

    await bot.sendMessage({
      chatId: message.chat.id,
      text: responseText.trim()
    });

  } catch (error) {
    console.error("Error listing topics:", error);
    await bot.sendMessage({
      chatId: message.chat.id,
      text: "❌ Gagal mendapatkan daftar topic"
    });
  }
}
