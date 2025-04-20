import { TelegramClient } from "telegramsjs";
import { telegramConfig } from "./config/telegram";
import { handleStart } from "./commands/start";
import { handleAddTopic } from "./commands/addtopic";
import { handleList } from "./commands/listtopic";
import { handleRemoveTopic } from "./commands/removetopic";
import { initMqttClient } from "./services/mqtt-service";
import { generateContextualResponse } from "./services/gemini-service";

const bot = new TelegramClient(telegramConfig.token, { pollingTimeout: 60 });

async function registerCommands(bot: TelegramClient) {
    try {
        await bot.user?.setCommands([
            { command: "start", description: "Memulai bot" },
            { command: "help", description: "Bantuan" },
            { command: "addtopic", description: "/addtopic [nama-farm] [nama-sensor] [topic-url]" },
            { command: "removetopic", description: "/removetopic [nama-sensor]" },
            { command: "listtopic", description: "/listtopic Menampilkan topic yang disubscribe" },
        ]);
        console.log("✅ Perintah Telegram berhasil didaftarkan.");
    } catch (error) {
        console.error("❌ Gagal mendaftarkan perintah Telegram:", error);
    }
}

const commandHandlers: {
    [command: string]: (bot: TelegramClient, message: any, args: string[]) => Promise<any | void>;
} = {
    "/start": handleStart,
    "/addtopic": handleAddTopic,
    "/listtopic": handleList,
    "/removetopic": handleRemoveTopic,
};

bot.on("ready", async ({ user }) => {
    await registerCommands(bot);
    console.log(`🤖 Bot login sebagai @${user?.username}`);
    
    // Inisialisasi MQTT Client
    await initMqttClient(process.env.MQTT_BROKER_URL || "mqtt://localhost:1883");
});

bot.on("message", async (message) => {
    const text = message.content?.trim() || "";
    const [command, ...args] = text.split(/\s+/);

    const handler = commandHandlers[command.toLowerCase()];
    if (handler) {
        try {
            await handler(bot, message, args);
        } catch (err) {
            console.error("❌ Error saat memproses command:", err);
            if (message.chat) {
                await bot.sendMessage({ chatId: message.chat.id, text: "Terjadi kesalahan saat menjalankan perintah." });
            } else {
                console.error("❌ Chat tidak terdefinisi untuk pesan ini.");
            }
        }
    } else if (text.startsWith("/")) {
        await bot.sendMessage({ chatId: message.chat?.id || 0, text: `⚠️ Perintah tidak dikenal. Ketik /help untuk bantuan.` });
    } else {
        try {
            const placeholder = await bot.sendMessage({
                chatId: message.chat?.id || 0,
                text: "✍️ Generate...",
            });

            // Gunakan Gemini service dengan data dari database, tanpa streaming
            const response = await generateContextualResponse(text);
            
            // Update pesan dengan respons yang sudah lengkap
            await bot.editMessageText({
                chatId: message.chat?.id || 0,
                messageId: placeholder.id,
                text: response.trim(),
            });
            
        } catch (err) {
            console.error("❌ Error menggunakan Gemini:", err);
            await bot.sendMessage({
                chatId: message.chat?.id || message.author?.id || 0,
                text: "Terjadi kesalahan saat menjawab dari AI.",
            });
        }
    }
});

bot.login();
