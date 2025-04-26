import { TelegramClient } from "telegramsjs";
import { telegramConfig } from "../config/telegram";
import { handleStart } from "./commands/start";
import { handleAddTopic } from "./commands/addtopic";
import { handleList } from "./commands/listtopic";
import { handleRemoveTopic } from "./commands/removetopic";
import { generateContextualResponse } from "../services/gemini-service";
import { MQTTService } from "../services/mqtt-service";

export class Bot {
    private bot: TelegramClient;
    private mqttService: MQTTService;

    private commandHandlers: {
        [command: string]: (bot: TelegramClient, message: any, args: string[], mqttService: MQTTService) => Promise<void>;
    } = {
        "/start": handleStart,
        "/addtopic": handleAddTopic,
        "/listtopic": handleList,
        "/removetopic": handleRemoveTopic,
    };
    
    constructor(mqttService: MQTTService) {
        this.bot = new TelegramClient(telegramConfig.token, { pollingTimeout: 60 });
        this.mqttService = mqttService;
    }

    private async registerCommands() {
        try {
            await this.bot.user?.setCommands([
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

    public async start() {
        this.bot.login();
        console.log('Bot starting...');
        this.bot.on("ready", async (telegram) => {
            await this.registerCommands();
            console.log(`🤖 Bot login sebagai @${telegram.user?.username || ''}`);
        });
        this.bot.on("message", async (message) => {
            const text = message.content?.trim() || "";
            const [command, ...args] = text.split(/\s+/);
            const handler = this.commandHandlers[command.toLowerCase()];
            if (handler) {
                try {
                    await handler(this.bot, message, args, this.mqttService);
                } catch (err) {
                    console.error("❌ Error saat memproses command:", err);
                    if (message.chat) {
                        await this.bot.sendMessage({ chatId: message.chat.id, text: "Terjadi kesalahan saat menjalankan perintah." });
                    } else {
                        console.error("❌ Chat tidak terdefinisi untuk pesan ini.");
                    }
                }
            } else if (text.startsWith("/")) {
                await this.bot.sendMessage({ chatId: message.chat?.id || 0, text: `⚠️ Perintah tidak dikenal. Ketik /help untuk bantuan.` });
            } else {
                try {
                    const placeholder = await this.bot.sendMessage({
                        chatId: message.chat?.id || 0,
                        text: "✍️ Sedang memproses pesan...",
                        parseMode: "MarkdownV2",
                    });
                    const response = await generateContextualResponse(text);
                    
                    await this.bot.editMessageText({
                        chatId: message.chat?.id || 0,
                        messageId: placeholder.id,
                        text: response.trim(),
                        parseMode: "MarkdownV2",
                    });
                    
                } catch (err) {
                    console.error("❌ Error menggunakan Gemini:", err);
                    await this.bot.sendMessage({
                        chatId: message.chat?.id || message.author?.id || 0,
                        text: "Terjadi kesalahan saat menjawab dari AI.",
                    });
                }
            }
        });
    }
}
