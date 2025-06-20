import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use environment variable or fallback to hardcoded key
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAX210b3QvLEVq6hK3e_AkJx8JsvFPhSiQ";

if (!API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function CallGemini(inputText, systemMessage = '') {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const fullPrompt = systemMessage ? `${systemMessage}\n\nUser Question: ${inputText}` : inputText;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
}

export { CallGemini };