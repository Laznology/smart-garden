import { TelegramClient } from "telegramsjs";
import { TelegramMessage } from "../../src/types/telegram";
import { dbService } from "../services/database-service";
import { MQTTService } from "../../src/services/shared/mqtt.service";

export async function handleAddTopic(bot: TelegramClient, message: TelegramMessage, args: string[]) {
    const chatId = message.chat?.id ?? 0;
    
    if (args.length < 3) {
        await bot.sendMessage({
            chatId,
            text: "⚠️ Format perintah salah. Gunakan: /addtopic [nama-farm] [nama-sensor] [topic-url]"
        });
        return;
    }
    
    const [farmName, sensorType, topicUrl] = args;
    
    try {
        // Cek apakah topic dengan nama tersebut sudah ada
        const topicName = `${farmName}/${sensorType}`;
        const existingTopic = await dbService.getTopicByName(topicName);
        
        if (existingTopic) {
            await bot.sendMessage({
                chatId,
                text: `⚠️ Topic "${topicName}" sudah terdaftar. Gunakan nama lain atau hapus yang lama terlebih dahulu.`
            });
            return;
        }
        
        // Tambahkan topic baru ke database dan subscribe
        await dbService.createTopic(topicName, topicUrl);
        
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
        await mqttService.subscribeTopic(topicUrl);
        
        // Cek atau buat farm jika belum ada
        const farm = await dbService.getFarmByName(farmName);
        if (!farm) {
            await dbService.createFarm(farmName);
        }
        
        await bot.sendMessage({
            chatId,
            text: `✅ Berhasil menambahkan sensor baru!\n\n🏡 Farm: ${farmName}\n📟 Sensor: ${sensorType}\n🔗 Topic: ${topicUrl}`
        });
        
    } catch (error) {
        console.error("❌ Error saat menambahkan topic:", error);
        await bot.sendMessage({
            chatId,
            text: "❌ Terjadi kesalahan saat menambahkan sensor. Silakan coba lagi."
        });
    }
}
