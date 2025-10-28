import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const API_KEY = 'AIzaSyBOOQWwuGFYF-emU9_DukPKB6bVunhPodk';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testImageGeneration() {
  console.log('Testing Gemini Image Generation...\n');
  
  // Gemini 2.0 Flash Experimental has image generation
  const models = [
    'gemini-2.0-flash-exp',
    'gemini-2.5-flash'
  ];
  
  for (const modelName of models) {
    console.log(`\n--- Testing ${modelName} for image generation ---`);
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName
      });
      
      // Try to generate an image
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: 'Create a photorealistic image of a cat sitting on a windowsill looking outside'
          }]
        }],
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: 'text/plain',
        }
      });
      
      const response = result.response;
      console.log('Response received');
      
      // Check if response contains image data
      if (response.candidates && response.candidates[0]) {
        const parts = response.candidates[0].content.parts;
        console.log(`Parts in response: ${parts.length}`);
        
        parts.forEach((part, idx) => {
          if (part.text) {
            console.log(`Part ${idx}: Text - ${part.text.substring(0, 100)}`);
          }
          if (part.inlineData) {
            console.log(`Part ${idx}: InlineData found!`);
            console.log(`  MimeType: ${part.inlineData.mimeType}`);
            console.log(`  Data length: ${part.inlineData.data.length}`);
            
            // Save the image
            const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
            const filename = `/tmp/generated_image_${modelName.replace(/[^a-z0-9]/gi, '_')}.png`;
            fs.writeFileSync(filename, imageBuffer);
            console.log(`  ✓ Image saved to ${filename}`);
          }
        });
      }
      
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
      if (error.response) {
        console.log('Error response:', JSON.stringify(error.response, null, 2).substring(0, 500));
      }
    }
  }
}

testImageGeneration().catch(console.error);
