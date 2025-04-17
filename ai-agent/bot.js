import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { getLatestData, getDataByDate, getSummary } from './db.js';
import setupNLP, { formatResponse } from './nlp-trainer.js';

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
let nlp;

// Inisialisasi bot
const bot = new TelegramBot(token, { polling: true });

// Helper function untuk escape karakter Markdown
function escapeMarkdown(text) {
  return text.toString().replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

// Parse tanggal dari teks
function parseDateFromText(text) {
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{4})?/;
  const match = text.match(dateRegex);
  
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
    return new Date(year, month - 1, day);
  }
  
  return null;
}

// Format respons sensor untuk Telegram
function formatSensorResponse(data) {
  if (!data || !data.length) return '❌ Tidak ada data tersedia';
  
  let response = '📈 *Data Sensor Terkini*\n\n';
  data.slice(0, 3).forEach(row => {
    response += `⏰ *${escapeMarkdown(row.timestamp)}*\n`;
    response += `• Suhu: *${escapeMarkdown(row.suhu)}°C*\n`;
    response += `• Kelembaban: *${escapeMarkdown(row.kelembaban)}%*\n`;
    response += `• pH: *${escapeMarkdown(row.ph)}*\n`;
    response += `• Nutrisi: *${escapeMarkdown(row.nutrisi)} PPM*\n`;
    response += `• Status: _${escapeMarkdown(row.status_tanaman)}_\n\n`;
  });
  
  return response;
}

// Format ringkasan untuk Telegram
function formatSummaryResponse(data) {
  if (!data) return '❌ Tidak ada data tersedia';
  
  return `📊 *Ringkasan Kondisi Tanaman*

• Suhu: *${escapeMarkdown(data.suhuRataRata)}°C*
• Kelembaban: *${escapeMarkdown(data.kelembabanRataRata)}%*
• pH: *${escapeMarkdown(data.phRataRata)}*
• Nutrisi: *${escapeMarkdown(data.nutrisiRataRata)} PPM*

_Data dari ${escapeMarkdown(data.totalData)} pengukuran terakhir_`;
}

// Handle pesan masuk
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase();

  try {
    // Analisis teks menggunakan NLP
    const result = await nlp.process('id', text);
    const intent = result.intent;

    // Handle berdasarkan intent
    switch (intent) {
      case 'greeting':
        const welcomeText = `🌱 *Selamat datang di Hidroponik AI Assistant\\!*

Saya dapat membantu Anda memantau sistem hidroponik\\. Anda bisa bertanya tentang:
• Status dan kondisi tanaman
• Data sensor terbaru
• Analisis kelembaban dan nutrisi
• Data berdasarkan tanggal
• Dan informasi lainnya

_Silakan ajukan pertanyaan Anda_ 😊`;
        await bot.sendMessage(chatId, welcomeText, { parse_mode: 'MarkdownV2' });
        break;

      case 'check_status':
        const summary = await getSummary();
        await bot.sendMessage(chatId, formatSummaryResponse(summary), { parse_mode: 'MarkdownV2' });
        break;

      case 'show_data':
        const data = await getLatestData(3);
        await bot.sendMessage(chatId, formatSensorResponse(data), { parse_mode: 'MarkdownV2' });
        break;

      case 'check_temperature':
        const tempData = await getLatestData(1);
        if (tempData.length > 0) {
          await bot.sendMessage(
            chatId,
            `🌡️ *Suhu saat ini:* ${escapeMarkdown(tempData[0].suhu)}°C`,
            { parse_mode: 'MarkdownV2' }
          );
        }
        break;

      case 'check_humidity':
        const humidData = await getLatestData(1);
        if (humidData.length > 0) {
          await bot.sendMessage(
            chatId,
            `💧 *Kelembaban saat ini:* ${escapeMarkdown(humidData[0].kelembaban)}%`,
            { parse_mode: 'MarkdownV2' }
          );
        }
        break;

      case 'check_ph':
        const phData = await getLatestData(1);
        if (phData.length > 0) {
          await bot.sendMessage(
            chatId,
            `🧪 *pH saat ini:* ${escapeMarkdown(phData[0].ph)}`,
            { parse_mode: 'MarkdownV2' }
          );
        }
        break;

      case 'check_nutrients':
        const nutrientData = await getLatestData(1);
        if (nutrientData.length > 0) {
          await bot.sendMessage(
            chatId,
            `🌿 *Nutrisi saat ini:* ${escapeMarkdown(nutrientData[0].nutrisi)} PPM`,
            { parse_mode: 'MarkdownV2' }
          );
        }
        break;

      case 'check_date':
        const date = parseDateFromText(text);
        if (date) {
          const dateData = await getDataByDate(date);
          await bot.sendMessage(chatId, formatSensorResponse(dateData), { parse_mode: 'MarkdownV2' });
        } else {
          await bot.sendMessage(
            chatId,
            '❌ Format tanggal tidak valid\\. Gunakan format DD/MM/YYYY',
            { parse_mode: 'MarkdownV2' }
          );
        }
        break;

      default:
        await bot.sendMessage(
          chatId,
          'Maaf, saya tidak mengerti pertanyaan tersebut\\. Silakan coba dengan kata kunci lain\\.',
          { parse_mode: 'MarkdownV2' }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    await bot.sendMessage(
      chatId,
      '❌ Terjadi kesalahan saat memproses pesan\\. Silakan coba lagi\\.',
      { parse_mode: 'MarkdownV2' }
    );
  }
}

// Setup bot dan NLP
async function startBot() {
  try {
    // Setup NLP
    nlp = await setupNLP();
    console.log('NLP model trained and ready');

    // Listen for messages
    bot.on('message', handleMessage);
    console.log('Bot is running...');
  } catch (error) {
    console.error('Error starting bot:', error);
  }
}

export default startBot;
