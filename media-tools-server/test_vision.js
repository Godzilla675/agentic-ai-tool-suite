import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBOOQWwuGFYF-emU9_DukPKB6bVunhPodk';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testVision() {
  console.log('Testing Image Understanding with gemini-2.0-flash-exp...\n');
  
  // Test with a simple image URL
  const imageUrl = 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400';
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString('base64');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    };
    const result = await model.generateContent(['Describe this image in detail', imagePart]);
    const text = result.response.text();
    console.log('✓ Image Understanding works!');
    console.log('Description:', text);
  } catch (error) {
    console.log('✗ Error:', error.message);
  }
  
  console.log('\n--- Testing Image Generation ---');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: 'Generate an image of a beautiful sunset over mountains' }]
      }]
    });
    
    console.log('Response:', JSON.stringify(result.response, null, 2));
  } catch (error) {
    console.log('✗ Error:', error.message);
  }
}

testVision().catch(console.error);
