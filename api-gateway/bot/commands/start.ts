import {TelegramClient} from "telegramsjs";
export async function handleStart(bot: TelegramClient, message:any) {
    if(message.author){
        await bot.sendMessage({allowPaidBroadcast: true, chatId: message.author.id, text: "Hello, World!"});
    }
}