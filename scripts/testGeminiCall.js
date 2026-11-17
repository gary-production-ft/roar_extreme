import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing Gemini API with key length:', apiKey?.length);
const ai = new GoogleGenAI({ apiKey });

async function testModel(modelName) {
  const start = Date.now();
  try {
    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: 'Hello, what are your gym hours in one short sentence?' }] }],
    });
    let ttft = null;
    let full = '';
    for await (const chunk of stream) {
      if (!ttft) ttft = Date.now() - start;
      full += chunk.text || '';
    }
    const total = Date.now() - start;
    console.log(`[${modelName}] SUCCESS - TTFT: ${ttft}ms, Total: ${total}ms. Answer: ${full.slice(0, 60)}...`);
  } catch (err) {
    const total = Date.now() - start;
    console.log(`[${modelName}] FAILED after ${total}ms: ${err.message}`);
  }
}

async function main() {
  await testModel('gemini-3.5-flash-lite');
  await testModel('gemini-2.5-flash-lite');
  await testModel('gemini-2.5-flash');
}

main();
