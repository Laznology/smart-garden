import { TelegramClient } from "telegramsjs";
import { TelegramMessage } from "../../types/telegram";

export async function handleStart(bot: TelegramClient, message: TelegramMessage) {
    if (message.chat && message.author?.id) {
        await bot.sendMessage({
            allowPaidBroadcast: true,
            chatId: message.author.id,
            parseMode: 'Markdown', 
            text: `👋 *Hello, saya adalah asisten AI untuk hidroponik!* 🌱

Saya di sini untuk membantu Anda mengelola kebun hidroponik dengan lebih mudah. Anda bisa bertanya tentang:
- 🌿 *Tips pertumbuhan tanaman*
- 💧 *Pengelolaan sistem hidroponik*
- 🧑‍🔬 *Pemantauan dan analisis data tanaman*
- 🛠️ *Pemeliharaan alat dan perangkat*

_Bot ini selalu siap membantu Anda mengoptimalkan kebun hidroponik Anda._  
Cukup kirimkan pertanyaan atau instruksi, dan saya akan memberikan jawaban terbaik untuk Anda!

Apa yang bisa saya bantu hari ini?`

        });
    }
}
