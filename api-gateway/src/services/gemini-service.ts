import { geminiModel } from '../config/gemini';
import { dbService } from './database-service';

interface SensorRecord {
  value: number;
  createdAt: Date;
}

async function getContextData() {
  try {
    const contextData = await dbService.getContextualData();
    
    return JSON.stringify(contextData, null, 2);
  } catch (error) {
    console.error('❌ Error saat mengambil data konteks:', error);
    return "Terjadi kesalahan saat mengambil data.";
  }
}

// Dapatkan data historis farm dan sensor tertentu
export async function getSensorHistory() {
  try {
    
    // Ambil riwayat sensor
    const history = await dbService.getSensorReadingHistory(30);
    
    if (history.length === 0) {
      return `Belum ada data histori untuk sensor.`;
    }
    
    return JSON.stringify(history.map((record: SensorRecord) => ({
      value: record.value,
      timestamp: record.createdAt.toLocaleString("id-ID")
    })), null, 2);
  } catch (error) {
    console.error(`❌ Error saat mengambil riwayat sensor:`, error);
    return "Terjadi kesalahan saat mengambil data historis.";
  }
}

export async function generateContextualResponse(userMessage: string) {
  try {
    const contextData = await getContextData();
    const systemInstruction = `loa
    Kamu adalah asisten bot taman pintar. Kamu memiliki akses ke data sensor terbaru dari kebun.
    Data berikut berisi informasi tentang sensor yang terpasang di kebun:
    ${contextData}
    
    Berdasarkan data tersebut, jawab pertanyaan pengguna dengan memanfaatkan data sensor yang tersedia.
    Berikan rekomendasi atau wawasan berdasarkan data sensor jika relevan.
    Jika diminta info tentang sensor tertentu, prioritaskan informasi dari sensor tersebut.
    Untuk suhu (temperature), berikan interpretasi yang mudah dipahami.
    Untuk kelembaban (humidity), jelaskan apakah tanaman membutuhkan kelembaban tambahan.
    Untuk kelembaban tanah (soil_moisture), jelaskan apakah tanaman membutuhkan penyiraman.
    Untuk tingkat cahaya (light), jelaskan apakah tanaman mendapat cukup sinar matahari.
    `;
    
    const result = await geminiModel.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: "Saya siap membantu Anda dengan taman pintar berdasarkan data sensor." }] },
        { role: "user", parts: [{ text: userMessage }] }
      ],
    });
    
    return result.response.text();
  } catch (error) {
    console.error('❌ Error saat generate respons Gemini:', error);
    return "Maaf, terjadi kesalahan saat memproses permintaan Anda.";
  }
}
