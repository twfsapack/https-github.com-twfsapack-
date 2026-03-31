import { loadEnv } from 'vite';
const env = loadEnv('development', '.', '');
console.log("GEMINI_API_KEY length:", env.GEMINI_API_KEY ? env.GEMINI_API_KEY.length : "undefined");
console.log("API_KEY length:", env.API_KEY ? env.API_KEY.length : "undefined");
