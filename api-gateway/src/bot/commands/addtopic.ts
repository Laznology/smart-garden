import { TelegramClient } from "telegramsjs";
import { dbService } from "../../services/database-service";
import { MQTTService } from "../../services/mqtt-service";
import { Farm } from "@prisma/client"; 

export async function handleAddTopic(
  bot: TelegramClient,
  message: any,
  args: string[],
  mqttService: MQTTService
) {
  if (args.length < 3) { 
    await bot.sendMessage({
      chatId: message.chat.id,
      text: "Format: /addtopic [nama farm] [nama-sensor] [topic-url]"
    });
    return;
  }

  const cleanArg = (arg: string) => arg.replace(/^\[|\]$/g, '');

  const topicUrl = cleanArg(args[args.length - 1]);
  const sensorType = cleanArg(args[args.length - 2]);
  const farmName = args.slice(0, args.length - 2).map(cleanArg).join(' ');

  try {
    let farm: Farm | null = await dbService.getFarmByName(farmName);
    if (!farm) {

      farm = await dbService.createFarm(farmName);
      console.log(`✅ Farm baru "${farmName}" berhasil dibuat.`);
      // Send a message confirming farm creation (optional)
      // await bot.sendMessage({
      //   chatId: message.chat.id,
      //   text: `ℹ️ Farm "${farmName}" tidak ditemukan, farm baru telah dibuat.`
      // });
    }

    // Validasi sensor type
    const validSensorTypes = ['temperature', 'humidity', 'soil_moisture', 'light'];
    if (!validSensorTypes.includes(sensorType)) {
      await bot.sendMessage({
        chatId: message.chat.id,
        text: `Tipe sensor tidak valid. Pilih salah satu: ${validSensorTypes.join(', ')}`
      });
      return;
    }

    await mqttService.subscribeTopic(topicUrl);
    
    await dbService.createTopic({
      name: `${farm.name}-${sensorType}`,
      url: topicUrl,
      farm_id: farm.id,
      sensor_type: sensorType
    });

    // Set handler untuk topic baru
    mqttService.setTopicHandler(topicUrl, async (_topic, payload) => {
      console.log(`[${new Date().toISOString()}] Pesan masuk (${topicUrl}):`, JSON.stringify(payload)); 
      try {
        if (typeof payload === 'number') { 
          await dbService.saveSensorReading(farm!.id, sensorType, payload); 

          console.log(`✅ Data disimpan: ${farm!.name}, ${sensorType}, Value: ${payload}`); 
        } else {
          console.error(`❌ Payload aneh di ${topicUrl}. Payload:`, JSON.stringify(payload), `Harusnya angka.`); 
        }
      } catch (error) {
        console.error(`❌ Gagal simpan data dari ${topicUrl}:`, error);
      }
    });

    await bot.sendMessage({
      chatId: message.chat.id,
      text: `✅ Berhasil menambahkan topic untuk ${farm.name} sensor ${sensorType}` 
    });

  } catch (error) {
    console.error("Error adding topic:", error);
    await bot.sendMessage({
      chatId: message.chat.id,
      text: "❌ Gagal menambahkan topic"
    });
  }
}
