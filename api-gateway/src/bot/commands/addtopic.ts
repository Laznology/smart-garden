import { TelegramClient } from "telegramsjs";
import { MQTTService } from "../../services/mqtt-service";
import { dbService } from "../../services/database-service";

export async function addTopicCommand(
    bot: TelegramClient,
    message: any,
    args: string[],
    mqttService: MQTTService
) {
    const chatId = message.chat?.id;
    if (!chatId) return;

    if (args.length !== 3) {
        await bot.sendMessage({
            chatId,
            text: "❌ Format salah! Gunakan:\n/addtopic [farm_id] [sensor_type] [topic]\n\nContoh:\n/addtopic farm1 humidity src/dev/humi"
        });
        return;
    }

    const [farmId, sensorType, topic] = args;

    // Validate sensor type
    const validSensorTypes = ["humidity", "temperature", "soil"];
    if (!validSensorTypes.includes(sensorType)) {
        await bot.sendMessage({
            chatId,
            text: `❌ Tipe sensor tidak valid. Gunakan: ${validSensorTypes.join(", ")}`
        });
        return;
    }

    try {
        // Save topic to database
        await dbService.addTopic(farmId, sensorType, topic);
        
        // Subscribe to the topic
        await mqttService.client.subscribe(topic);

        await bot.sendMessage({
            chatId,
            text: `✅ Berhasil menambahkan topic:\nFarm: ${farmId}\nSensor: ${sensorType}\nTopic: ${topic}`
        });
    } catch (error) {
        console.error("Error adding topic:", error);
        await bot.sendMessage({
            chatId,
            text: "❌ Gagal menambahkan topic. Mungkin sudah ada topic untuk farm dan sensor yang sama."
        });
    }
}
