import startBot from './bot.js';

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

// Start the bot
console.log('Starting Hidroponik AI Bot...');
startBot().catch(error => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down bot...');
  process.exit(0);
});
