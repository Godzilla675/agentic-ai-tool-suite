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
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
// Import PptxGenJS for PowerPoint generation
import * as pptxgen from 'pptxgenjs';
const PptxGenJS = (pptxgen as any).default || pptxgen;

// --- Server Setup ---
const server = new Server(
  {
    name: 'presentation-creator-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// --- Constants ---
const PPTX_WIDTH = 10; // inches
const PPTX_HEIGHT = 5.625; // inches (16:9 aspect ratio)

// --- Helper Functions ---
async function screenshotHtml(htmlContent: string, outputPath: string): Promise<void> {
  const browser: Browser = await chromium.launch();
  const page: Page = await browser.newPage();
  await page.setViewportSize({ width: 800, height: 450 });
  
  // Create temp HTML file
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-ppt-'));
  const htmlPath = path.join(tempDir, 'content.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  await page.goto(`file://${htmlPath}`);
  await page.screenshot({ path: outputPath });
  
  await browser.close();
  
  // Clean up temp file
  fs.unlinkSync(htmlPath);
  fs.rmdirSync(tempDir);
}

// --- Tool Logic Implementation ---

// 1. Assemble Presentation Logic
async function handleAssemblePresentation({ slides_html, filename }: { slides_html: string[]; filename: string }) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-ppt-'));
  
  try {
    if (!Array.isArray(slides_html) || slides_html.length === 0) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Error: slides_html must be a non-empty array of strings.' }],
      };
    }

    // Screenshot each slide
    const imagePaths: string[] = [];
    const browser: Browser = await chromium.launch();
    const page: Page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 450 });

    for (let i = 0; i < slides_html.length; i++) {
      const htmlContent = slides_html[i];
      const htmlPath = path.join(tempDir, `slide_${i + 1}.html`);
      const imgPath = path.join(tempDir, `slide_${i + 1}.png`);
      
      fs.writeFileSync(htmlPath, htmlContent);
      await page.goto(`file://${htmlPath}`);
      await page.screenshot({ path: imgPath });
      imagePaths.push(imgPath);
    }

    await browser.close();

    // Create PowerPoint presentation
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';

    for (const imgPath of imagePaths) {
      const slide = pres.addSlide();
      slide.addImage({ path: imgPath, x: 0, y: 0, w: '100%', h: '100%' });
    }

    // Save presentation to Downloads folder
    const downloadsPath = path.join(os.homedir(), 'Downloads');
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }
    
    const outputFilename = `${filename}.pptx`;
    const outputPath = path.join(downloadsPath, outputFilename);
    await pres.writeFile({ fileName: outputPath });

    return {
      content: [
        {
          type: 'text',
          text: `Presentation successfully created and saved to: ${outputPath}`,
        },
      ],
    };
  } catch (error: any) {
    console.error('Presentation Assembly Error:', error.message);
    return {
      isError: true,
      content: [{ type: 'text', text: `Error assembling presentation: ${error.message}` }],
    };
  } finally {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// 2. Create PDF from HTML Logic
async function handleCreatePdfFromHtml({ html_content, filename }: { html_content: string; filename: string }) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-pdf-'));
  
  try {
    if (!html_content || typeof html_content !== 'string') {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Error: html_content must be a non-empty string.' }],
      };
    }

    const htmlPath = path.join(tempDir, 'content.html');
    fs.writeFileSync(htmlPath, html_content);

    // Launch Playwright and generate PDF
    const browser: Browser = await chromium.launch();
    const page: Page = await browser.newPage();
    await page.goto(`file://${htmlPath}`);

    const downloadsPath = path.join(os.homedir(), 'Downloads');
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }
    
    const outputFilename = `${filename}.pdf`;
    const outputPath = path.join(downloadsPath, outputFilename);
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm',
      },
    });

    await browser.close();

    return {
      content: [
        {
          type: 'text',
          text: `PDF successfully created and saved to: ${outputPath}`,
        },
      ],
    };
  } catch (error: any) {
    console.error('PDF Creation Error:', error.message);
    return {
      isError: true,
      content: [{ type: 'text', text: `Error creating PDF: ${error.message}` }],
    };
  } finally {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// --- Tool Registration ---

// Define Tool Schemas using Zod for validation
const assemblePresentationArgsSchema = z.object({
  slides_html: z.array(z.string()).describe('A list where each item is a string containing the full HTML code for one slide.'),
  filename: z.string().optional().default('presentation').describe('The desired base name for the output PPTX file (without extension).'),
});

const createPdfFromHtmlArgsSchema = z.object({
  html_content: z.string().describe('A string containing the full HTML code for the document.'),
  filename: z.string().optional().default('document').describe('The desired base name for the output PDF file (without extension).'),
});

// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'assemble_presentation',
        description: 'Assembles a PowerPoint presentation from a list of HTML strings. Each HTML string represents one slide.',
        inputSchema: {
          type: 'object',
          properties: {
            slides_html: {
              type: 'array',
              items: { type: 'string' },
              description: 'A list where each item is a string containing the full HTML code for one slide.',
            },
            filename: {
              type: 'string',
              description: 'The desired base name for the output PPTX file (without extension).',
              default: 'presentation',
            },
          },
          required: ['slides_html'],
        },
      },
      {
        name: 'create_pdf_from_html',
        description: 'Generates a PDF document from a string containing HTML code.',
        inputSchema: {
          type: 'object',
          properties: {
            html_content: {
              type: 'string',
              description: 'A string containing the full HTML code for the document.',
            },
            filename: {
              type: 'string',
              description: 'The desired base name for the output PDF file (without extension).',
              default: 'document',
            },
          },
          required: ['html_content'],
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
    if (toolName === 'assemble_presentation') {
      const validatedArgs = assemblePresentationArgsSchema.parse(args);
      return await handleAssemblePresentation(validatedArgs);
    } else if (toolName === 'create_pdf_from_html') {
      const validatedArgs = createPdfFromHtmlArgsSchema.parse(args);
      return await handleCreatePdfFromHtml(validatedArgs);
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
  } catch (error: any) {
    console.error(`Error calling tool ${toolName}:`, error);
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid arguments for tool ${toolName}: ${error.errors.map((e) => e.message).join(', ')}`
      );
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
  console.error('Presentation Creator MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
