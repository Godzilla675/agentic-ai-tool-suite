#!/usr/bin/env node

/**
 * Presentation Creator MCP Server
 * Provides tools for creating PowerPoint presentations and PDFs from HTML
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { chromium, Browser, Page } from "playwright";
import pptxgen from "pptxgenjs";
const PptxGenJS = pptxgen.default || pptxgen;
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Create an MCP server with presentation and PDF creation tools
 */
const server = new Server(
  {
    name: "presentation-creator-server",
    version: "0.1.1",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// --- Helper Functions ---

async function createTempFile(content: string, extension: string): Promise<string> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-presentation-"));
  const filePath = path.join(tempDir, `content${extension}`);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

function cleanupTemp(filePath: string) {
  try {
    const dir = path.dirname(filePath);
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (error) {
    console.error("Error cleaning up temp files:", error);
  }
}

// --- Tool Implementation ---

async function handleAssemblePresentation({ slides_html, filename }: { slides_html: string[]; filename: string }) {
  const tempFiles: string[] = [];
  let browser: Browser | null = null;

  try {
    if (!slides_html || slides_html.length === 0) {
      throw new Error("No slide HTML data provided");
    }

    // Create PowerPoint presentation
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_16x9";

    // Launch browser for screenshots
    browser = await chromium.launch();
    const page: Page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Process each slide
    for (let i = 0; i < slides_html.length; i++) {
      const htmlContent = slides_html[i];
      
      // Create temp HTML file
      const htmlPath = await createTempFile(htmlContent, ".html");
      tempFiles.push(htmlPath);

      // Navigate and screenshot
      await page.goto(`file://${htmlPath}`, { waitUntil: "domcontentloaded" });
      
      const screenshotPath = htmlPath.replace(".html", ".png");
      await page.screenshot({ path: screenshotPath, fullPage: false });
      tempFiles.push(screenshotPath);

      // Add slide with image
      const slide = pptx.addSlide();
      slide.addImage({
        path: screenshotPath,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
      });

      console.error(`Processed slide ${i + 1}/${slides_html.length}`);
    }

    await browser.close();
    browser = null;

    // Save presentation to Downloads folder
    const downloadsPath = path.join(os.homedir(), "Downloads");
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }

    const outputPath = path.join(downloadsPath, `${filename}.pptx`);
    await pptx.writeFile({ fileName: outputPath });

    // Cleanup temp files
    tempFiles.forEach(cleanupTemp);

    return {
      content: [{
        type: "text",
        text: `Presentation successfully created and saved to: ${outputPath}`
      }]
    };

  } catch (error: any) {
    if (browser) await browser.close();
    tempFiles.forEach(cleanupTemp);
    
    console.error("Error assembling presentation:", error);
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error assembling presentation: ${error.message}`
      }]
    };
  }
}

async function handleCreatePdfFromHtml({ html_content, filename }: { html_content: string; filename: string }) {
  let htmlPath: string | null = null;
  let browser: Browser | null = null;

  try {
    if (!html_content || html_content.trim() === "") {
      throw new Error("html_content must be a non-empty string");
    }

    // Create temp HTML file
    htmlPath = await createTempFile(html_content, ".html");

    // Launch browser
    browser = await chromium.launch();
    const page: Page = await browser.newPage();

    await page.goto(`file://${htmlPath}`, { waitUntil: "domcontentloaded" });

    // Save PDF to Downloads folder
    const downloadsPath = path.join(os.homedir(), "Downloads");
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }

    const outputPath = path.join(downloadsPath, `${filename}.pdf`);
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "20mm",
        right: "20mm",
      },
    });

    await browser.close();
    browser = null;

    // Cleanup
    if (htmlPath) cleanupTemp(htmlPath);

    return {
      content: [{
        type: "text",
        text: `PDF successfully created and saved to: ${outputPath}`
      }]
    };

  } catch (error: any) {
    if (browser) await browser.close();
    if (htmlPath) cleanupTemp(htmlPath);
    
    console.error("Error creating PDF:", error);
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error creating PDF: ${error.message}`
      }]
    };
  }
}

// --- Tool Schemas ---

const assemblePresentationArgsSchema = z.object({
  slides_html: z.array(z.string()).min(1).describe("A list where each item is a string containing the full HTML code for one slide."),
  filename: z.string().optional().default("presentation").describe("The desired base name for the output PPTX file (without extension)."),
});

const createPdfFromHtmlArgsSchema = z.object({
  html_content: z.string().min(1).describe("A string containing the full HTML code for the document."),
  filename: z.string().optional().default("document").describe("The desired base name for the output PDF file (without extension)."),
});

// --- Tool Registration ---

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "assemble_presentation",
        description: "Assembles a PowerPoint presentation from a list of HTML strings. Each HTML string represents one slide.",
        inputSchema: {
          type: "object",
          properties: {
            slides_html: {
              type: "array",
              items: { type: "string" },
              description: "A list where each item is a string containing the full HTML code for one slide."
            },
            filename: {
              type: "string",
              description: "The desired base name for the output PPTX file (without extension).",
              default: "presentation"
            }
          },
          required: ["slides_html"]
        }
      },
      {
        name: "create_pdf_from_html",
        description: "Generates a PDF document from a string containing HTML code.",
        inputSchema: {
          type: "object",
          properties: {
            html_content: {
              type: "string",
              description: "A string containing the full HTML code for the document."
            },
            filename: {
              type: "string",
              description: "The desired base name for the output PDF file (without extension).",
              default: "document"
            }
          },
          required: ["html_content"]
        }
      }
    ]
  };
});

// --- Tool Handler ---

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments;

  try {
    if (toolName === "assemble_presentation") {
      const validatedArgs = assemblePresentationArgsSchema.parse(args);
      return await handleAssemblePresentation(validatedArgs);
    } else if (toolName === "create_pdf_from_html") {
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
        `Invalid arguments for tool ${toolName}: ${error.errors.map((e) => e.message).join(", ")}`
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
  console.error("Presentation Creator MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
