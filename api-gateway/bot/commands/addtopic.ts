import { TelegramClient } from "telegramsjs";

export async function handleAddTopic(bot: TelegramClient, message: any, args: string[]) {
    if (args.length < 3) {
        return bot.sendMessage({
            chatId: message.chat.id,
            text: `⚠️ Format salah!\n\nGunakan:\n/addtopic [nama-farm] [nama-sensor] [topic-url]\n\nContoh:\n/addtopic farm-a suhu sensor/data/suhu`,
        });
    }

    const [farm, sensor, topicUrl] = args.map(arg => arg.trim());


    await bot.sendMessage({
        chatId: message.chat.id,
        text: `✅ Topic berhasil ditambahkan!\n\n🌿 Farm: ${farm}\n📟 Sensor: ${sensor}\n🔗 Topic: ${topicUrl}`,
    });
    return;
}
