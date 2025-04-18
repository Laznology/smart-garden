import dotenv from 'dotenv';
import MQTTService from './services/mqtt.service';

// Load environment variables
dotenv.config();

// Create MQTT service instance
const mqttService = new MQTTService();


process.on('SIGTERM', () => {
  console.log('Menerima sinyal SIGTERM, melakukan cleanup...');
  mqttService.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Menerima sinyal SIGINT, melakukan cleanup...');
  mqttService.disconnect();
  process.exit(0);
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  mqttService.disconnect();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  mqttService.disconnect();
  process.exit(1);
});

console.log('Smart Garden API Gateway berjalan...');
