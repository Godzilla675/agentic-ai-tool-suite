import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBOOQWwuGFYF-emU9_DukPKB6bVunhPodk';
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log('Available models:');
    for (const model of models) {
      console.log(`\n- ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Supported Generation Methods: ${model.supportedGenerationMethods?.join(', ')}`);
    }
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

listModels();
