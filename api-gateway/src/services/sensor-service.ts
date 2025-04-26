import MQTTService from './mqtt-service';
import { dbService } from './database-service';

export async function initializeTopics(mqttService : MQTTService) {
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