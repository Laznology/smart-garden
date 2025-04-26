import { TelegramClient } from "telegramsjs";
import { dbService } from "../../services/database-service";
import { MQTTService } from "../../services/mqtt-service";

export async function handleRemoveTopic(
  bot: TelegramClient,
  message: any,
  args: string[],
  mqttService: MQTTService
) {
  if (args.length !== 1) {
    await bot.sendMessage({
      chatId: message.chat.id,
      text: "Format: /removetopic [nama-sensor]"
    });
    return;
  }

  const [topicName] = args;

  try {
    const topic = await dbService.getTopicByName(topicName);
    if (!topic) {
      await bot.sendMessage({
        chatId: message.chat.id,
        text: `Topic dengan nama "${topicName}" tidak ditemukan.`
      });
      return;
    }

    await mqttService.unsubscribeTopic(topic.url);
    
    mqttService.removeTopicHandler(topic.url);
    
    await dbService.deleteTopic(topic.id);

    await bot.sendMessage({
      chatId: message.chat.id,
      text: `✅ Berhasil menghapus topic ${topicName}`
    });

  } catch (error) {
    console.error("Error removing topic:", error);
    await bot.sendMessage({
      chatId: message.chat.id,
      text: "❌ Gagal menghapus topic"
    });
  }
}
