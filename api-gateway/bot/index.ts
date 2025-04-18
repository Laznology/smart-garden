import {TelegramClient} from "telegramsjs";
import {telegramConfig} from "./config/telegram";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

const bot = new TelegramClient(telegramConfig.token, {pollingTimeout: 1000});
console.log("Telegram bot started");

bot.on("ready", async ({user}) => {
    await user?.setCommands([
        {command: "start", description: "Memulai bot"},
        {command: "help", description: "Bantuan"},
        {command: 'addtopic', description: "Menambahkan topic yang disubscribe"},
        {command: 'removetopic', description: "Menghapus topic yang disubscribe"},
        {command: 'listtopic', description: "Menampilkan topic yang disubscribe"},

    ])
    console.log(`Bot Login sebagai ${user?.username}`);
})

bot.on("message", async (message) => {
    if(message.content?.startsWith("/addtopic")) {
        const commandArgs = message.content.replace("/addtopic", "").trim();
        const args = [];
        let currentArg = "";
        let insideBracket = false;

        for (let i = 0; i < commandArgs.length; i++) {
            const char = commandArgs[i];

            if (char === '[') {
                insideBracket = true;
                continue;
            } else if (char === ']') {
                insideBracket = false;
                if (currentArg.trim()) {
                    args.push(currentArg.trim());
                    currentArg = "";
                }
                continue;
            }

            if (!insideBracket && char === ' ') {
                if (currentArg.trim()) {
                    args.push(currentArg.trim());
                    currentArg = "";
                }
            } else {
                currentArg += char;
            }
        }

        if (currentArg.trim()) {
            args.push(currentArg.trim());
        }

        if (args.length < 3) {
            await message.reply(
                "Format salah. Gunakan: /addtopic [nama-farm] [nama-topic] [topic-url]"
            );
            return;
        }

        const [farmName, topicName, topicUrl] = args;

        const sudahAda = await prisma.topic.findFirst({
            where: { url: topicUrl }
        });

        if (sudahAda) {
            await message.reply("Topic sudah ada");
        } else {
            await prisma.topic.create({
                data: {
                    name: topicName,
                    url: topicUrl
                }
            });
            await prisma.farm.create({
                data: {
                    name: farmName
                }
            })

            await message.reply(
                `Topic berhasil ditambahkan:\nFarm: ${farmName}\nName: ${topicName}\nURL: ${topicUrl}`
            );
        }
    }
})

bot.login()