import dotenv from 'dotenv';
import { Bot } from './bot/bot';
import { MQTTService } from './services/mqtt-service';
import { dbService } from './services/database-service';
import { mqttConfig } from './config/mqtt';

// Load environment variables
dotenv.config();

// Initialize MQTT Service
const mqttService = new MQTTService(mqttConfig);

// Initialize subscribers from database
async function initializeTopics() {
  try {
    const topics = await dbService.getAllTopics();
    console.log(`Ditemukan ${topics.length} topic di database`);
    
    for (const topic of topics) {
      try {
        await mqttService.subscribeTopic(topic.url);
        console.log(`✅ Berhasil subscribe ke topic: ${topic.url}`);
        
        // Set handler untuk setiap topic
        mqttService.setTopicHandler(topic.url, async (topicUrl, payload) => {
          // Tambahkan log untuk membedakan handler ini
          console.log(`[Initializer Handler] Received message on topic (${topicUrl}):`, JSON.stringify(payload)); 
          try {
            if (typeof payload === 'number') { 
              await dbService.saveSensorReading(
                topic.farm_id,
                topic.sensor_type,
                payload
              );

              console.log(`✅ [Initializer Handler] Data tersimpan untuk farm ${topic.farm.name}, sensor ${topic.sensor_type}, Value: ${payload}`); 
            } else {
              console.error(`❌ [Initializer Handler] Format payload tidak valid untuk topic ${topicUrl}. Payload:`, JSON.stringify(payload), `Expected a number.`); 
            }
          } catch (error) {
            console.error(`❌ [Initializer Handler] Error saat menyimpan data dari topic ${topicUrl}:`, error); 
          }
        });
        
      } catch (error) {
        console.error(`❌ Gagal subscribe ke topic ${topic.url}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Gagal menginisialisasi topic:', error);
  }
}

// Start bot & initialize topics
const bot = new Bot(mqttService);
bot.start();
initializeTopics();

// Cleanup on exit
const cleanup = async () => {
  try {
    await mqttService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error saat cleanup:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  cleanup();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  cleanup();
});

console.log('Smart Garden API Gateway berjalan...');
