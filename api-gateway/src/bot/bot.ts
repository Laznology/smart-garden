import { TelegramClient } from "telegramsjs";
import { telegramConfig } from "../config/telegram";
import { generateContextualResponse } from "../services/gemini-service";
import { MQTTService } from "../services/mqtt-service";
import { addTopicCommand } from "./commands/addtopic";

function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

export class Bot {
    private bot: TelegramClient;
    private mqttService: MQTTService;

    private commandHandlers: {
        [command: string]: (bot: TelegramClient, message: any, args: string[], mqttService: MQTTService) => Promise<void>;
    };
    
    constructor(mqttService: MQTTService) {
        this.bot = new TelegramClient(telegramConfig.token, { pollingTimeout: 60 });
        this.mqttService = mqttService;
        
        // Initialize command handlers
        this.commandHandlers = {
            "/addtopic": addTopicCommand,
        };
    }

    private async registerCommands() {
        try {
            await this.bot.user?.setCommands([
                { command: "start", description: "Memulai bot" },
                { command: "help", description: "Bantuan" },
                { command: "addtopic", description: "Tambah topic MQTT (format: farm_id sensor_type topic)" },
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
                        text: escapeMarkdown("✍️ Sedang memproses pesan..."),
                        parseMode: "Markdown"
                    });
                    const response = await generateContextualResponse(text);
                    
                    const escapedResponse = escapeMarkdown(response.trim());
                    await this.bot.editMessageText({
                        chatId: message.chat?.id || 0,
                        messageId: placeholder.id,
                        text: escapedResponse,
                        parseMode: "Markdown",
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
