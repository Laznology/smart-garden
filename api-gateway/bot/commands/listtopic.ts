import { TelegramClient } from "telegramsjs";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

export async function handleList(bot: TelegramClient, message: any): Promise<void> {
    const list = await prisma.topic.findMany();

    if (list.length === 0) {
        await bot.sendMessage({ chatId: message.chat.id, text: "Tidak ada topik yang terdaftar." });
        return;
    }

    let markdownMessage = "*Daftar Topik:*\n";
    list.forEach((topic, index) => {
        markdownMessage += `${index + 1}. *Nama:* ${topic.name || "Tidak ada"}, *URL:* ${topic.url}\n`;
    });

    await bot.sendMessage({
        chatId: message.chat.id,
        text: markdownMessage,
        parseMode: "MarkdownV2"
    });
}