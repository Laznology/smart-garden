import {GoogleGenAI} from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if(!apiKey){
    throw new Error('API KEY TIDAK TERSEDIA!');
}

export const gemini = new GoogleGenAI({apiKey});