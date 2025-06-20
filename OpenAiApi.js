import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAX210b3QvLEVq6hK3e_AkJx8JsvFPhSiQ";

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
