import { TelegramClient } from "telegramsjs";
import { telegramConfig } from "./config/telegram";
import { handleStart } from "./commands/start";
// import { handleHelp } from "./commands/help";
// import { handleAddTopic } from "./commands/addtopic";
import {handleList } from "./commands/listtopic";


const bot = new TelegramClient(telegramConfig.token, { pollingTimeout: 1000 });
console.log("Telegram bot started");

async function registerCommands(bot: TelegramClient) {
    try {
        await bot.user?.setCommands([
            { command: "start", description: "Memulai bot" },
            { command: "help", description: "Bantuan" },
            { command: 'addtopic', description: "/addtopic [nama-farm] [nama-sensor] [topic-url]" },
            { command: 'removetopic', description: "/removetopic [nama-sensor]" },
            { command: 'listtopic', description: "/listtopic Menampilkan topic yang disubscribe" },
        ]);
        console.log("Perintah Telegram berhasil didaftarkan.");
    } catch (error) {
        console.error("Gagal mendaftarkan perintah Telegram:", error);
    }
}

bot.on("ready", async ({ user }) => {
    await registerCommands(bot);
    console.log(`Bot Login sebagai ${user?.username}`);
});

const commandHandlers: { [command: string]: (message: any) => Promise<void> } = {
    "/start": (message) => handleStart(bot, message),
    "/listtopic": (message) => handleList(bot, message),
};

bot.on("message", async (message) => {
    const handler = commandHandlers[message.content?.split(" ")[0] ?? ""]; // Ambil handler berdasarkan perintah
    if (handler) {
        await handler(message);
    }
});


bot.login();