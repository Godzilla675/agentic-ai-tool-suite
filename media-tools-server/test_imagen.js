import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBOOQWwuGFYF-emU9_DukPKB6bVunhPodk';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testImageGeneration() {
  console.log('Testing different approaches to image generation...\n');
  
  // Test 1: Try using imagen models directly
  const imagenModels = [
    'imagen-3.0-generate-001',
    'imagen-3.0-fast-generate-001',
    'imagen-3.0-capability-preview-0930',
  ];
  
  for (const modelName of imagenModels) {
    try {
      console.log(`Trying ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('A cat sitting on a windowsill');
      console.log(`✓ ${modelName}: Works!`);
      console.log('Response:', JSON.stringify(result.response, null, 2).substring(0, 500));
    } catch (error) {
      console.log(`✗ ${modelName}: ${error.message.substring(0, 150)}`);
    }
  }
  
  console.log('\n--- Testing gemini-2.5-flash-preview-04 (if exists) ---');
  
  const newModels = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-preview',
    'gemini-2.5-flash-preview-04',
    'gemini-exp-1206',
    'learnlm-1.5-pro-experimental'
  ];
  
  for (const modelName of newModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello');
      console.log(`✓ ${modelName}: Works`);
    } catch (error) {
      console.log(`✗ ${modelName}: ${error.message.substring(0, 100)}`);
    }
  }
}

testImageGeneration().catch(console.error);
