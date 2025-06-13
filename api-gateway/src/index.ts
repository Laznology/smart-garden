import dotenv from 'dotenv';
import { Bot } from './bot/bot';
import { mqttConfig } from './config/mqtt';
import { SensorService } from './services/sensor-service';

// Load environment variables
dotenv.config();

// Initialize MQTT Service with sensor handling
const sensorService = new SensorService(mqttConfig);

// Start bot & initialize topics
const bot = new Bot(sensorService);
bot.start();

// Cleanup on exit
const cleanup = async () => {
  try {
    await sensorService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
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
