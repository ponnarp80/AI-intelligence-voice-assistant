import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AIzaSyA8BtS14zSinY9adayg4F5jaOX5flvI41g';
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // The SDK doesn't have a direct listModels yet in all versions, 
    // but we can try to fetch it directly using fetch
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    const models = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent') && m.name.includes('gemini'));
    console.log(models.map(m => m.name).join('\n'));
  } catch (e) {
    console.error(e);
  }
}

listModels();
