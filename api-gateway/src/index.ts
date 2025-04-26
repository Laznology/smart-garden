import dotenv from 'dotenv';
import { Bot } from './bot/bot';
import { MQTTService } from './services/mqtt-service';
import { mqttConfig } from './config/mqtt';
import { initializeTopics } from './services/sensor-service';

// Load environment variables
dotenv.config();

// Initialize MQTT Service
const mqttService = new MQTTService(mqttConfig);

// Start bot & initialize topics
const bot = new Bot(mqttService);
bot.start();
initializeTopics(mqttService);

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
