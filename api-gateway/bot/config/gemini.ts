import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// Pastikan API key tersedia
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY tidak ditemukan di environment variables.");
  process.exit(1);
}

// Inisialisasi Gemini API
export const gemini = new GoogleGenerativeAI(apiKey);
export const geminiModel = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });