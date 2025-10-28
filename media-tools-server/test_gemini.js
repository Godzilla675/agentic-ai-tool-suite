import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBOOQWwuGFYF-emU9_DukPKB6bVunhPodk';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testModels() {
  console.log('Testing available models...\n');
  
  // Test text generation models
  const textModels = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro-vision'
  ];
  
  for (const modelName of textModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello');
      console.log(`✓ ${modelName}: Working`);
    } catch (error) {
      console.log(`✗ ${modelName}: ${error.message}`);
    }
  }
  
  console.log('\n--- Testing Image Understanding ---');
  
  // Test with a simple image URL
  const imageUrl = 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400';
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString('base64');
  
  const visionModels = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro-vision'
  ];
  
  for (const modelName of visionModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg',
        },
      };
      const result = await model.generateContent(['Describe this image briefly', imagePart]);
      const text = result.response.text();
      console.log(`✓ ${modelName}: ${text.substring(0, 50)}...`);
    } catch (error) {
      console.log(`✗ ${modelName}: ${error.message}`);
    }
  }
  
  console.log('\n--- Testing Image Generation Models ---');
  
  // Test image generation capability
  const genModels = [
    'gemini-2.0-flash-exp',
    'imagen-3.0-generate-001',
    'imagen-3.0-fast-generate-001'
  ];
  
  for (const modelName of genModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Generate an image of a cat');
      console.log(`✓ ${modelName}: Response received`);
    } catch (error) {
      console.log(`✗ ${modelName}: ${error.message}`);
    }
  }
}

testModels().catch(console.error);
