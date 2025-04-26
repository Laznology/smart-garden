import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if(!BOT_TOKEN){
    console.error('TOKEN BOT TIDAK TERSEDIA! Pastikan variabel TELEGRAM_BOT_TOKEN ada di file .env');
    process.exit(1);
}

export const telegramConfig = {
    token: BOT_TOKEN
}
