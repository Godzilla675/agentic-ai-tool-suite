#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os'; // Import os module for home directory
import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerateContentRequest } from '@google/generative-ai'; // Removed ResponseModality import

// --- API Configuration ---
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'xtiRQvUeNUVQLvUBGs3L_4Nnau0DbfXvVvZoUZcMLzA';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY; // Support both GEMINI_API_KEY and GOOGLE_API_KEY

if (!YOUTUBE_API_KEY) {
  console.error("WARN: YOUTUBE_API_KEY environment variable is not set. Video search will fail.");
}
// Re-enable Google API Key check and GenAI client setup
if (!GEMINI_API_KEY) {
    console.error("WARN: GEMINI_API_KEY environment variable is not set. Image generation/understanding will fail.");
}

// --- Google AI Client Setup ---
let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
    console.error("GoogleGenerativeAI client could not be initialized due to missing API key.");
}

// --- Server Setup ---
const server = new Server(
  { // ServerInfo
    name: 'media-tools-server',
    version: '0.1.2', // Incremented version
  },
  { // Options
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// --- Helper Functions ---
async function downloadImage(url: string, filepath: string): Promise<void> {
  const dirname = path.dirname(filepath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// --- Tool Logic Implementation ---

// 1. Image Search Logic
async function handleImageSearch({ query, count }: { query: string; count: number }) {
  if (!UNSPLASH_ACCESS_KEY) {
     return { isError: true, content: [{ type: 'text', text: 'Unsplash API key is not configured.' }] };
  }
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,
        per_page: count,
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    const images = response.data.results.map((img: any) => ({
      id: img.id,
      description: img.description || img.alt_description || 'No description',
      url_regular: img.urls.regular, // Link to regular size image
      url_download: img.links.download_location, // Special link for triggering download count on Unsplash
      photographer_name: img.user.name,
      photographer_url: img.user.links.html,
    }));

    if (images.length === 0) {
      return {
        content: [{ type: 'text', text: `No images found for query: "${query}"` }],
      };
    }

    const formattedResults = images.map((img: any, index: number) =>
      `${index + 1}. Description: ${img.description}\n   Regular URL: ${img.url_regular}\n   Photographer: ${img.photographer_name} (${img.photographer_url})`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${images.length} images for "${query}":\n\n${formattedResults}\n\nUse the 'download_image' tool with a regular URL to save an image.`,
        },
      ],
    };
  } catch (error: any) {
    console.error('Unsplash API Error:', error.response?.data || error.message);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error searching images: ${error.response?.data?.errors?.[0] || error.message}`,
        },
      ],
    };
  }
}

// 2. Download Image Logic
async function handleDownloadImage({ imageUrl, filePath }: { imageUrl: string; filePath: string }) {
  try {
    if (!filePath.match(/\.(jpg|jpeg|png|gif)$/i)) {
       throw new Error('Invalid file path. Please include a valid image extension (.jpg, .png, .gif).');
    }
    await downloadImage(imageUrl, filePath);
    return {
      content: [ { type: 'text', text: `Image successfully downloaded to: ${filePath}` } ],
    };
  } catch (error: any) {
    console.error('Download Error:', error.message);
    return { isError: true, content: [ { type: 'text', text: `Error downloading image: ${error.message}` } ] };
  }
}

// 3. Video Search Logic
async function handleVideoSearch({ query, count }: { query: string; count: number }) {
  if (!YOUTUBE_API_KEY) {
    return { isError: true, content: [{ type: 'text', text: 'YouTube API key is not configured.' }] };
  }
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', q: query, type: 'video', maxResults: count, key: YOUTUBE_API_KEY },
    });
    const videos = response.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
    if (videos.length === 0) {
      return { content: [{ type: 'text', text: `No videos found for query: "${query}"` }] };
    }
    const formattedResults = videos.map((video: any, index: number) =>
      `${index + 1}. Title: ${video.title}\n   Channel: ${video.channelTitle}\n   URL: ${video.url}\n   Description: ${video.description}`
    ).join('\n\n');
    return {
      content: [ { type: 'text', text: `Found ${videos.length} videos for "${query}":\n\n${formattedResults}\n\nUse the 'video_understanding' tool with a video ID (from the URL) to get its transcript.` } ],
    };
  } catch (error: any) {
    console.error('YouTube API Error:', error.response?.data?.error || error.message);
    const apiError = error.response?.data?.error;
    const errorMessage = apiError ? `${apiError.message} (Code: ${apiError.code})` : error.message;
    return { isError: true, content: [ { type: 'text', text: `Error searching videos: ${errorMessage}` } ] };
  }
}

// 4. Video Understanding Logic (Transcript Extraction)
async function handleVideoUnderstanding({ video_id }: { video_id: string }) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(video_id);
    if (!transcript || transcript.length === 0) {
      return { content: [{ type: 'text', text: `No transcript found or available for video ID: ${video_id}` }] };
    }
    const formattedTranscript = transcript.map(entry => `[${(entry.offset / 1000).toFixed(2)}s] ${entry.text}`).join('\n');
    const maxLength = 50000;
    const truncatedTranscript = formattedTranscript.length > maxLength ? formattedTranscript.substring(0, maxLength) + "\n... (transcript truncated)" : formattedTranscript;
    return { content: [ { type: 'text', text: `Transcript for video ID ${video_id}:\n\n${truncatedTranscript}` } ] };
  } catch (error: any) {
    console.error('Transcript Error:', error.message);
    let errorMessage = error.message;
    if (error.message?.includes('disabled transcript') || error.message?.includes('No transcript found')) {
        errorMessage = `Could not retrieve transcript for video ID ${video_id}. Transcripts might be disabled or unavailable for this video.`;
    } else if (error.message?.includes('Invalid video ID')) {
        errorMessage = `Invalid YouTube video ID provided: ${video_id}`;
    }
    return { isError: true, content: [ { type: 'text', text: `Error getting transcript: ${errorMessage}` } ] };
  }
}

// 5. Image Understanding Logic
async function handleImageUnderstanding({ imageUrl, imagePath, prompt }: { imageUrl?: string; imagePath?: string; prompt?: string }) {
    if (!genAI) {
        return { isError: true, content: [{ type: 'text', text: 'Google AI SDK not initialized. Check API key.' }] };
    }
    if (!imageUrl && !imagePath) {
        return { isError: true, content: [{ type: 'text', text: 'Either imageUrl or imagePath must be provided.' }] };
    }
    if (imageUrl && imagePath) {
        return { isError: true, content: [{ type: 'text', text: 'Provide either imageUrl or imagePath, not both.' }] };
    }

    const userPrompt = prompt || "Describe this image in detail."; // Default prompt
    let imagePart: any = null;
    let mimeType: string | undefined = undefined;

    try {
        if (imagePath) {
            if (!fs.existsSync(imagePath)) { throw new Error(`File not found: ${imagePath}`); }
            const fileBuffer = fs.readFileSync(imagePath);
            const mime = await import('mime-types'); // Dynamic import for mime-types
            mimeType = mime.lookup(imagePath) || 'application/octet-stream';
            imagePart = { inlineData: { data: fileBuffer.toString('base64'), mimeType: mimeType } };
        } else if (imageUrl) {
             const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
             const buffer = Buffer.from(response.data, 'binary');
             mimeType = response.headers['content-type']?.split(';')[0] || 'application/octet-stream';
             imagePart = { inlineData: { data: buffer.toString('base64'), mimeType: mimeType } };
        }

        if (!imagePart) { throw new Error("Could not prepare image data."); }

        // Use gemini-2.5-flash for image understanding (supports vision)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const contents = [ { role: "user", parts: [ {text: userPrompt}, imagePart ] } ];

        const result = await model.generateContent({ contents });
        const response = result.response;
        const description = response.text();

        return { content: [{ type: 'text', text: description }] };

    } catch (error: any) {
        console.error('Gemini Vision API Error:', error.message);
        let detailMessage = error.message;
         if (error.cause && typeof error.cause === 'object' && 'message' in error.cause) {
             detailMessage = error.cause.message;
         }
        return { isError: true, content: [{ type: 'text', text: `Error understanding image: ${detailMessage}` }] };
    }
}

// 6. Image Generation Logic
async function handleImageGeneration({ prompt, filePath }: { prompt: string; filePath?: string }) {
    if (!genAI) {
        return { isError: true, content: [{ type: 'text', text: 'Google AI SDK not initialized. Check API key.' }] };
    }

    try {
        // Use gemini-2.5-flash for generating detailed image descriptions
        // Gemini doesn't directly generate image files like DALL-E, but provides detailed descriptions
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Request a detailed description suitable for image generation
        const enhancedPrompt = `Create a highly detailed visual description for generating an image of: "${prompt}". 
Include specific details about:
- Composition and framing
- Lighting and atmosphere
- Colors and textures
- Subject details and positioning
- Background elements
- Mood and style

Provide the description in a way that would help an artist or image generation AI create the image.`;

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: enhancedPrompt }]
            }],
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
            }
        });

        const description = result.response.text();
        
        let responseMessage = `Image Generation Request: "${prompt}"\n\n`;
        responseMessage += `Detailed Description for Image Generation:\n${description}\n\n`;
        responseMessage += `USAGE NOTES:\n`;
        responseMessage += `- Gemini does not directly generate images like DALL-E or Midjourney\n`;
        responseMessage += `- Use the detailed description above with dedicated image generation services:\n`;
        responseMessage += `  • DALL-E (OpenAI)\n`;
        responseMessage += `  • Midjourney\n`;
        responseMessage += `  • Stable Diffusion\n`;
        responseMessage += `  • Adobe Firefly\n`;
        responseMessage += `- The description is optimized to help these services create your desired image\n`;

        if (filePath) {
            // Save the description to a text file
            try {
                const dirname = path.dirname(filePath);
                if (!fs.existsSync(dirname)) {
                    fs.mkdirSync(dirname, { recursive: true });
                }
                const textFilePath = filePath.replace(/\.[^/.]+$/, '.txt');
                fs.writeFileSync(textFilePath, description);
                responseMessage += `\n✓ Description saved to: ${textFilePath}`;
            } catch (saveError: any) {
                responseMessage += `\n⚠ Warning: Could not save description file: ${saveError.message}`;
            }
        }

        return { content: [{ type: 'text', text: responseMessage }] };

    } catch (error: any) {
        console.error('Image Generation Error:', error.message);
        return { 
            isError: true, 
            content: [{ 
                type: 'text', 
                text: `Error generating image description: ${error.message}\n\nNote: Gemini provides detailed descriptions for image generation. For actual image files, use dedicated services like DALL-E, Midjourney, or Stable Diffusion.` 
            }] 
        };
    }
}


// --- Tool Registration ---

// Define Tool Schemas using Zod for validation later
const imageSearchArgsSchema = z.object({
  query: z.string().describe('The search query for images.'),
  count: z.number().int().positive().optional().default(5).describe('Number of images to return (default 5).'),
});

const downloadImageArgsSchema = z.object({
  imageUrl: z.string().url().describe('The URL of the image to download.'),
  filePath: z.string().describe('The local path (including filename and extension) where the image should be saved. e.g., C:/Users/Ahmed/Desktop/my_image.jpg'),
});

const videoSearchArgsSchema = z.object({
    query: z.string().describe('The search query for videos.'),
    count: z.number().int().positive().optional().default(5).describe('Number of videos to return (default 5).'),
});

const videoUnderstandingArgsSchema = z.object({
    video_id: z.string().describe('The ID of the YouTube video (from the URL).'),
});

const imageGenerationArgsSchema = z.object({
    prompt: z.string().describe('Description of the image to generate.'),
    filePath: z.string().optional().describe('Optional local file path (including filename and extension) where the image representation should be saved. e.g., C:/Users/Ahmed/Desktop/generated_image.png'),
});

const imageUnderstandingArgsSchema = z.object({
    imageUrl: z.string().url().optional().describe('URL of the image to understand.'),
    imagePath: z.string().optional().describe('Local file path of the image to understand.'),
    prompt: z.string().optional().describe('Optional prompt to guide the understanding (e.g., "What objects are in this image?"). Defaults to "Describe this image in detail."'),
}).refine(data => data.imageUrl || data.imagePath, {
    message: "Either imageUrl or imagePath must be provided.",
}).refine(data => !(data.imageUrl && data.imagePath), {
    message: "Provide either imageUrl or imagePath, not both.",
});


// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'image_search',
        description: 'Search for images using Unsplash API.',
        inputSchema: {
           type: 'object',
           properties: {
               query: { type: 'string', description: 'The search query for images.' },
               count: { type: 'number', description: 'Number of images to return (default 5).', default: 5 },
           },
           required: ['query'],
        }
      },
      {
        name: 'download_image',
        description: 'Downloads an image from a given URL to a specified file path.',
        inputSchema: {
           type: 'object',
           properties: {
               imageUrl: { type: 'string', format: 'uri', description: 'The URL of the image to download.' },
               filePath: { type: 'string', description: 'The **full** local path (including filename and extension) where the image should be saved. e.g., C:/Users/YourUsername/Desktop/my_image.jpg' },
           },
           required: ['imageUrl', 'filePath'],
        }
      },
      {
        name: 'video_search',
        description: 'Search for YouTube videos.',
        inputSchema: {
           type: 'object',
           properties: {
               query: { type: 'string', description: 'The search query for videos.' },
               count: { type: 'number', description: 'Number of videos to return (default 5).', default: 5 },
           },
           required: ['query'],
        }
      },
      {
        name: 'video_understanding',
        description: 'Extracts the transcript with timestamps from a YouTube video.',
        inputSchema: {
           type: 'object',
           properties: {
               video_id: { type: 'string', description: 'The ID of the YouTube video (from the URL).' },
           },
           required: ['video_id'],
        }
      },
      {
        name: 'image_understanding',
        description: 'Analyzes an image from a URL or local path using Google Gemini and returns a description.',
        inputSchema: {
          type: 'object',
          properties: {
            imageUrl: { type: 'string', format: 'uri', description: 'URL of the image to understand.' },
            imagePath: { type: 'string', description: 'Local file path of the image to understand.' },
            prompt: { type: 'string', description: 'Optional prompt to guide the understanding.' },
          },
          // Note: Logic requires one of imageUrl or imagePath, handled in code/Zod refine
        },
      },
      {
        name: 'image_generation',
        description: 'Generates an image description and simple representation using Google Gemini. For production-quality images, use the detailed description with dedicated image generation services.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Description of the image to generate.' },
            filePath: { type: 'string', description: 'Optional local file path (including filename and extension) where a simple image representation should be saved.' },
          },
          required: ['prompt'],
        },
      },
    ],
  };
});

// Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments;

  try {
    if (toolName === 'image_search') {
      const validatedArgs = imageSearchArgsSchema.parse(args);
      return await handleImageSearch(validatedArgs);
    } else if (toolName === 'download_image') {
      const validatedArgs = downloadImageArgsSchema.parse(args);
      return await handleDownloadImage(validatedArgs);
    } else if (toolName === 'video_search') {
      const validatedArgs = videoSearchArgsSchema.parse(args);
      return await handleVideoSearch(validatedArgs);
    } else if (toolName === 'video_understanding') {
      const validatedArgs = videoUnderstandingArgsSchema.parse(args);
      return await handleVideoUnderstanding(validatedArgs);
    } else if (toolName === 'image_understanding') {
        const validatedArgs = imageUnderstandingArgsSchema.parse(args);
        return await handleImageUnderstanding(validatedArgs);
    } else if (toolName === 'image_generation') {
        const validatedArgs = imageGenerationArgsSchema.parse(args);
        return await handleImageGeneration(validatedArgs);
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
  } catch (error: any) {
     console.error(`Error calling tool ${toolName}:`, error);
     if (error instanceof z.ZodError) {
       throw new McpError(ErrorCode.InvalidParams, `Invalid arguments for tool ${toolName}: ${error.errors.map(e => e.message).join(', ')}`);
     }
     if (error instanceof McpError) {
         throw error;
     }
     throw new McpError(ErrorCode.InternalError, `Error executing tool ${toolName}: ${error.message}`);
  }
});


// --- Server Execution ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Media Tools MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
