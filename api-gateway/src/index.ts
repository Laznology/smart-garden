import dotenv from 'dotenv';
import { Bot } from './bot/bot';

// Load environment variables
dotenv.config();
const bot = new Bot();
bot.start();

process.on('SIGTERM', () => {
  console.log('Menerima sinyal SIGTERM, melakukan cleanup...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Menerima sinyal SIGINT, melakukan cleanup...');
  process.exit(0);
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('Smart Garden API Gateway berjalan...');
