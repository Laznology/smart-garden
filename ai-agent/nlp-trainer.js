import { containerBootstrap } from '@nlpjs/core';
import { Nlp } from '@nlpjs/nlp';
import { LangId } from '@nlpjs/lang-id';

// Helper function to escape special characters for Telegram Markdown
function escapeMarkdown(text) {
  // Escape special characters: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return String(text).replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

async function setupNLP() {
  const container = await containerBootstrap();
  container.use(Nlp);
  container.use(LangId);
  
  const nlp = container.get('nlp');
  nlp.settings.autoSave = false;
  nlp.addLanguage('id');

  // Greeting intents
  nlp.addDocument('id', 'halo', 'greeting');
  nlp.addDocument('id', 'hai', 'greeting');
  nlp.addDocument('id', 'hi', 'greeting');
  nlp.addDocument('id', 'selamat pagi', 'greeting');
  nlp.addDocument('id', 'selamat siang', 'greeting');
  nlp.addDocument('id', 'selamat sore', 'greeting');
  nlp.addAnswer('id', 'greeting', formatResponse('greeting'));

  // Status check intents
  nlp.addDocument('id', 'bagaimana kondisi tanaman', 'check_status');
  nlp.addDocument('id', 'gimana kondisi hidroponik', 'check_status');
  nlp.addDocument('id', 'status tanaman', 'check_status');
  nlp.addDocument('id', 'cek kondisi', 'check_status');
  nlp.addAnswer('id', 'check_status', 'Mengambil status tanaman\\.\\.\\.');

  // Show data intents
  nlp.addDocument('id', 'lihat data', 'show_data');
  nlp.addDocument('id', 'tampilkan data', 'show_data');
  nlp.addDocument('id', 'data sensor', 'show_data');
  nlp.addDocument('id', 'berapa data', 'show_data');
  nlp.addAnswer('id', 'show_data', 'Mengambil data sensor\\.\\.\\.');

  // Date check intents
  nlp.addDocument('id', 'data tanggal', 'check_date');
  nlp.addDocument('id', 'data pada tanggal', 'check_date');
  nlp.addDocument('id', 'data di tanggal', 'check_date');
  nlp.addDocument('id', 'tanggal', 'check_date');
  nlp.addAnswer('id', 'check_date', 'Mencari data berdasarkan tanggal\\.\\.\\.');

  // Temperature check intents
  nlp.addDocument('id', 'suhu', 'check_temperature');
  nlp.addDocument('id', 'berapa suhu', 'check_temperature');
  nlp.addDocument('id', 'temperatur', 'check_temperature');
  nlp.addDocument('id', 'cek suhu', 'check_temperature');
  nlp.addAnswer('id', 'check_temperature', 'Mengecek suhu\\.\\.\\.');

  // Humidity check intents
  nlp.addDocument('id', 'kelembaban', 'check_humidity');
  nlp.addDocument('id', 'berapa kelembaban', 'check_humidity');
  nlp.addDocument('id', 'cek kelembaban', 'check_humidity');
  nlp.addAnswer('id', 'check_humidity', 'Mengecek kelembaban\\.\\.\\.');

  // pH check intents
  nlp.addDocument('id', 'ph', 'check_ph');
  nlp.addDocument('id', 'berapa ph', 'check_ph');
  nlp.addDocument('id', 'kadar ph', 'check_ph');
  nlp.addDocument('id', 'cek ph', 'check_ph');
  nlp.addAnswer('id', 'check_ph', 'Mengecek pH\\.\\.\\.');

  // Nutrient check intents
  nlp.addDocument('id', 'nutrisi', 'check_nutrients');
  nlp.addDocument('id', 'kadar nutrisi', 'check_nutrients');
  nlp.addDocument('id', 'berapa nutrisi', 'check_nutrients');
  nlp.addDocument('id', 'cek nutrisi', 'check_nutrients');
  nlp.addAnswer('id', 'check_nutrients', 'Mengecek nutrisi\\.\\.\\.');

  // Train model
  await nlp.train();
  
  return nlp;
}

// Format response berdasarkan intent
export function formatResponse(intent, data) {
  switch (intent) {
    case 'greeting':
      return `🌱 *Selamat datang di Hidroponik AI Assistant\\!*

Saya dapat membantu Anda memantau sistem hidroponik\\. Anda bisa bertanya tentang:
• Status dan kondisi tanaman
• Data sensor terbaru
• Analisis kelembaban dan nutrisi
• Data berdasarkan tanggal
• Dan informasi lainnya

_Silakan ajukan pertanyaan Anda_ 😊`;
    
    case 'check_status':
      if (!data) return '❌ Tidak ada data tersedia';
      return `📊 *Ringkasan Kondisi Tanaman*

• Suhu: *${escapeMarkdown(data.suhuRataRata)}°C*
• Kelembaban: *${escapeMarkdown(data.kelembabanRataRata)}%*
• pH: *${escapeMarkdown(data.phRataRata)}*
• Nutrisi: *${escapeMarkdown(data.nutrisiRataRata)} PPM*

_Data dari ${escapeMarkdown(data.totalData)} pengukuran terakhir_`;
    
    case 'show_data':
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
    
    default:
      return 'Maaf, saya tidak mengerti pertanyaan tersebut\\. Silakan coba dengan kata kunci lain\\.';
  }
}

export default setupNLP;
