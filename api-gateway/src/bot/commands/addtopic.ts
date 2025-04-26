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
    function isValidValue(value: number, sensorType: string): boolean {
      if (!isFinite(value) || isNaN(value)) return false;
    
      switch(sensorType) {
        case 'temperature':
          return value >= -10 && value <= 50;
        case 'humidity':
          return value >= 0 && value <= 100;
        case 'soil':
        case 'soil_moisture':
          return value >= 0 && value <= 100;
        default:
          return false;
      }
    }

    mqttService.setTopicHandler(topicUrl, async (_topic, payload) => {
      console.log(`[${new Date().toISOString()}] Pesan masuk (${topicUrl}):`, JSON.stringify(payload)); 
      try {
        // Cek format payload
        if (typeof payload !== 'object' || payload === null) {
          console.error(`❌ Format payload tidak valid di ${topicUrl}. Payload:`, JSON.stringify(payload));
          return;
        }

        // Tentukan key yang sesuai dari payload berdasarkan tipe sensor
        const payloadKey = sensorType === 'soil_moisture' ? 'soil' : sensorType;
        const value = payload[payloadKey];

        // Validasi nilai
        if (typeof value !== 'number') {
          console.error(`❌ Nilai ${payloadKey} harus berupa angka di ${topicUrl}`);
          return;
        }

        // Validasi range nilai
        if (!isValidValue(value, payloadKey)) {
          console.error(`❌ Nilai ${payloadKey} (${value}) di luar range yang valid`);
          return;
        }

        // Simpan ke database
        await dbService.saveSensorReading(farm!.id, sensorType, value);
        console.log(`✅ Data tersimpan untuk farm ${farm!.name}, sensor ${sensorType}, Value: ${value}`);
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
