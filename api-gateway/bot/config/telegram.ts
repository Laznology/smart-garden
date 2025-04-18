import dotenv from 'dotenv';


dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if(!BOT_TOKEN){
    console.error('TOKEN BOT TIDAK TERSEDIA!');
    process.exit(1);
}

export const telegramConfig = {
    token: BOT_TOKEN
}
