import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const API_KEY = 'AIzaSyBOOQWwuGFYF-emU9_DukPKB6bVunhPodk';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testMultimodalOutput() {
  console.log('Testing Gemini 2.0 Flash with multimodal output...\n');
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
    });
    
    // According to docs, gemini-2.0 can generate images as part of responses
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: 'Draw a simple diagram of a cat. Output an image.'
        }]
      }],
      generationConfig: {
        responseMimeType: 'image/jpeg'  // Try to get image output
      }
    });
    
    console.log('Response:', JSON.stringify(result.response, null, 2));
    
  } catch (error) {
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Error details:', JSON.stringify(error.response, null, 2).substring(0, 500));
    }
  }
  
  console.log('\n--- Trying with application/json ---');
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
    });
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: 'Generate JSON with an embedded base64 image of a cat'
        }]
      }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
    
    console.log('Response:', result.response.text().substring(0, 500));
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testMultimodalOutput().catch(console.error);
