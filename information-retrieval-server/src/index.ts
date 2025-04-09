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
import * as cheerio from 'cheerio';
import { chromium, Browser, Page } from 'playwright'; // Added Playwright import

// --- API Configuration ---
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
  console.error("FATAL: GOOGLE_API_KEY or GOOGLE_CSE_ID environment variables are not set.");
  // In a real server, you might want to exit or prevent startup
  // process.exit(1);
}

// --- Server Setup ---
const server = new Server(
  { // ServerInfo
    name: 'information-retrieval-server',
    version: '0.1.0',
  },
  { // Options
    capabilities: {
      resources: {},
      tools: {}, // Enable tools capability
    },
  }
);

// --- Helper Functions ---

// Function to perform a single Google Custom Search (Web or Image)
async function performGoogleSearch(query: string, searchType: 'web' | 'image' = 'web', count: number = 10) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    throw new Error('Google API Key or CSE ID is not configured.');
  }
  const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CSE_ID,
      q: query,
      searchType: searchType === 'image' ? 'image' : undefined, // only include if image search
      num: count, // Number of results to return (1-10)
    },
  });
  return response.data;
}

// Function to crawl a webpage and extract text
async function crawlWebpage(url: string): Promise<string> {
    try {
        const { data } = await axios.get(url, {
            headers: {
                // Mimic a browser user agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);

        // Remove script and style elements
        $('script, style, noscript, iframe, header, footer, nav, aside').remove();

        // Get text content, trying to prioritize main content areas if possible
        let bodyText = $('body').text(); // Fallback to full body text

        // Attempt to find common main content selectors
        const mainContentSelectors = ['main', 'article', '[role="main"]', '.main-content', '#main-content', '.post-content', '#content'];
        for (const selector of mainContentSelectors) {
            if ($(selector).length) {
                bodyText = $(selector).text();
                break; // Use the first one found
            }
        }

        // Basic cleanup: replace multiple whitespace chars with a single space
        return bodyText.replace(/\s\s+/g, ' ').trim();
    } catch (error: any) {
        console.error(`Error crawling ${url}:`, error.message);
        throw new Error(`Failed to crawl ${url}. Status: ${error.response?.status || 'N/A'}`);
    }
}


// --- Tool Logic Implementation ---

// 1. Web Search Logic
async function handleWebSearch({ query, count }: { query: string; count: number }) {
  try {
    const data = await performGoogleSearch(query, 'web', count);
    const items = data.items || [];
    if (items.length === 0) {
      return { content: [{ type: 'text', text: `No web results found for "${query}"` }] };
    }
    const formattedResults = items.map((item: any, index: number) =>
      `${index + 1}. Title: ${item.title}\n   Link: ${item.link}\n   Snippet: ${item.snippet}`
    ).join('\n\n');
    return { content: [{ type: 'text', text: `Web search results for "${query}":\n\n${formattedResults}` }] };
  } catch (error: any) {
    console.error('Google Web Search Error:', error.response?.data?.error || error.message);
    const apiError = error.response?.data?.error;
    const errorMessage = apiError ? `${apiError.message} (Code: ${apiError.code})` : error.message;
    return { isError: true, content: [{ type: 'text', text: `Error performing web search: ${errorMessage}` }] };
  }
}

// 2. Batch Web Search Logic
async function handleBatchWebSearch({ queries }: { queries: string[] }) {
   if (queries.length === 0) {
       return { isError: true, content: [{ type: 'text', text: 'No queries provided for batch search.' }] };
   }
   // Limit batch size for safety/cost
   const MAX_BATCH_SIZE = 5;
   if (queries.length > MAX_BATCH_SIZE) {
       return { isError: true, content: [{ type: 'text', text: `Batch size too large. Maximum allowed is ${MAX_BATCH_SIZE}.` }] };
   }

   try {
       const results = await Promise.all(queries.map(query => performGoogleSearch(query, 'web', 3))); // Fetch top 3 for each query
       let combinedResults = "";
       results.forEach((data, i) => {
           const query = queries[i];
           const items = data.items || [];
           combinedResults += `Results for "${query}":\n`;
           if (items.length === 0) {
               combinedResults += "  No results found.\n\n";
           } else {
               items.forEach((item: any, index: number) => {
                   combinedResults += `  ${index + 1}. ${item.title} (${item.link})\n`;
               });
               combinedResults += "\n";
           }
       });
       return { content: [{ type: 'text', text: combinedResults.trim() }] };
   } catch (error: any) {
       console.error('Google Batch Web Search Error:', error.response?.data?.error || error.message);
       const apiError = error.response?.data?.error;
       const errorMessage = apiError ? `${apiError.message} (Code: ${apiError.code})` : error.message;
       return { isError: true, content: [{ type: 'text', text: `Error performing batch web search: ${errorMessage}` }] };
   }
}

// 3. Google Image Search Logic
async function handleGoogleImageSearch({ query, count }: { query: string; count: number }) {
  try {
    const data = await performGoogleSearch(query, 'image', count);
    const items = data.items || [];
    if (items.length === 0) {
      return { content: [{ type: 'text', text: `No image results found for "${query}"` }] };
    }
    const formattedResults = items.map((item: any, index: number) =>
      `${index + 1}. Title: ${item.title}\n   Image URL: ${item.link}\n   Source: ${item.displayLink}`
    ).join('\n\n');
    return { content: [{ type: 'text', text: `Image search results for "${query}":\n\n${formattedResults}` }] };
  } catch (error: any) {
    console.error('Google Image Search Error:', error.response?.data?.error || error.message);
    const apiError = error.response?.data?.error;
    const errorMessage = apiError ? `${apiError.message} (Code: ${apiError.code})` : error.message;
    return { isError: true, content: [{ type: 'text', text: `Error performing image search: ${errorMessage}` }] };
  }
}

// 4. Web Crawl Logic
async function handleWebCrawl({ url }: { url: string }) {
    try {
        const textContent = await crawlWebpage(url);
        // Limit output size
        const maxLength = 30000;
        const truncatedContent = textContent.length > maxLength
            ? textContent.substring(0, maxLength) + "\n... (content truncated)"
            : textContent;
        return { content: [{ type: 'text', text: `Content crawled from ${url}:\n\n${truncatedContent}` }] };
    } catch (error: any) {
        return { isError: true, content: [{ type: 'text', text: error.message }] };
    }
}

// 5. Advanced Web Crawl Logic (using Playwright)
async function handleAdvancedWebCrawl({ url }: { url: string }): Promise<any> {
    let browser: Browser | null = null;
    try {
        browser = await chromium.launch();
        const page: Page = await browser.newPage();
        // Changed waitUntil from 'networkidle' to 'domcontentloaded' to potentially avoid timeout
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); 

        // Attempt to extract main content using common selectors, falling back to body
        const mainContentSelectors = ['main', 'article', '[role="main"]', '.main-content', '#main-content', '.post-content', '#content', 'body'];
        let textContent = '';

        for (const selector of mainContentSelectors) {
            const elementText = await page.locator(selector).first().textContent({ timeout: 5000 }); // Use first match
            if (elementText && elementText.trim().length > 100) { // Basic check for meaningful content
                 textContent = elementText;
                 break;
            }
        }

        if (!textContent) {
             // Fallback if no main selector worked well, get all visible text
             textContent = await page.locator('body').textContent({ timeout: 5000 }) ?? '';
        }

        await browser.close();

        // Basic cleanup
        const cleanedText = textContent.replace(/\s\s+/g, ' ').trim();

        // Limit output size
        const maxLength = 40000; // Slightly increased limit for potentially richer content
        const truncatedContent = cleanedText.length > maxLength
            ? cleanedText.substring(0, maxLength) + "\n... (content truncated)"
            : cleanedText;

        return { content: [{ type: 'text', text: `Content crawled from ${url} using advanced crawler:\n\n${truncatedContent}` }] };

    } catch (error: any) {
        console.error(`Error during advanced crawl of ${url}:`, error.message);
        if (browser) {
            await browser.close();
        }
        return { isError: true, content: [{ type: 'text', text: `Error during advanced crawl: ${error.message}` }] };
    }
}


// --- Tool Registration ---

// Define Tool Schemas using Zod for validation later
const webSearchArgsSchema = z.object({
  query: z.string().describe('The search query.'),
  count: z.number().int().min(1).max(10).optional().default(5).describe('Number of results (1-10, default 5).'),
});

const batchWebSearchArgsSchema = z.object({
  queries: z.array(z.string()).min(1).max(5).describe('A list of search queries (max 5).'),
});

const googleImageSearchArgsSchema = z.object({
  query: z.string().describe('The image search query.'),
  count: z.number().int().min(1).max(10).optional().default(5).describe('Number of image results (1-10, default 5).'),
});

const webCrawlArgsSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to crawl.'),
});

const advancedWebCrawlArgsSchema = z.object({
    url: z.string().url().describe('The URL of the webpage to crawl using a headless browser.'),
});


// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'web_search',
        description: 'Performs a web search using Google Custom Search API.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query.' },
            count: { type: 'number', description: 'Number of results (1-10, default 5).', default: 5 },
          },
          required: ['query'],
        },
      },
      {
        name: 'batch_web_search',
        description: 'Performs multiple web searches simultaneously (max 5 queries).',
        inputSchema: {
          type: 'object',
          properties: {
            queries: { type: 'array', items: { type: 'string' }, description: 'A list of search queries (max 5).' },
          },
          required: ['queries'],
        },
      },
      {
        name: 'google_image_search',
        description: 'Performs an image search using Google Custom Search API.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The image search query.' },
            count: { type: 'number', description: 'Number of image results (1-10, default 5).', default: 5 },
          },
          required: ['query'],
        },
      },
      {
        name: 'web_crawl',
        description: 'Fetches and extracts the main text content from a given webpage URL.',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri', description: 'The URL of the webpage to crawl.' },
          },
          required: ['url'],
        },
      },
      {
        name: 'advanced_web_crawl',
        description: 'Fetches and extracts text content from a URL using a headless browser (more robust, but slower). Use if the standard web_crawl tool gets blocked or fails.',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri', description: 'The URL of the webpage to crawl.' },
          },
          required: ['url'],
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
    if (toolName === 'web_search') {
      const validatedArgs = webSearchArgsSchema.parse(args);
      return await handleWebSearch(validatedArgs);
    } else if (toolName === 'batch_web_search') {
      const validatedArgs = batchWebSearchArgsSchema.parse(args);
      return await handleBatchWebSearch(validatedArgs);
    } else if (toolName === 'google_image_search') {
      const validatedArgs = googleImageSearchArgsSchema.parse(args);
      return await handleGoogleImageSearch(validatedArgs);
    } else if (toolName === 'web_crawl') {
      const validatedArgs = webCrawlArgsSchema.parse(args);
      return await handleWebCrawl(validatedArgs);
    } else if (toolName === 'advanced_web_crawl') {
        const validatedArgs = advancedWebCrawlArgsSchema.parse(args);
        return await handleAdvancedWebCrawl(validatedArgs);
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
  console.error('Information Retrieval MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
