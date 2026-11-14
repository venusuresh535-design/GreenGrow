import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();
async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    console.log('Testing with model:', model);
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: 'Hello, what is a good crop for black soil?' }] }],
    });
    console.log('Gemini Response:');
    console.log(res.text);
}
testGemini().catch(console.error);
