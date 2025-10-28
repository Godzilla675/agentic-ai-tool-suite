# presentation-creator-server MCP Server

A Model Context Protocol server for creating PowerPoint presentations and PDF documents from HTML content using Playwright.

## Features

### Tools

- **`assemble_presentation`** - Create PowerPoint presentations from HTML slides
  - Takes a list of HTML strings (one per slide)
  - Screenshots each HTML slide and assembles into PPTX
  - Customizable filename
  - Outputs to ~/Downloads folder
  - Standard 16:9 aspect ratio (800x450 viewport)
  
- **`create_pdf_from_html`** - Generate PDF documents from HTML content
  - Accepts full HTML document as string
  - A4 format with configurable margins
  - Includes background colors and images
  - Outputs to ~/Downloads folder

**Note:** This server requires Playwright browsers to be installed. After installation, run:
```bash
npx playwright install chromium
```

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

### Quick Start (Recommended)

The easiest way to use this MCP server is with `npx`. No installation required!

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "presentation-creator": {
      "command": "npx",
      "args": ["-y", "presentation-creator-mcp-server"]
    }
  }
}
```

**Important:** After first use, you may need to install Playwright browsers:
```bash
npx playwright install chromium
```

### Alternative: Global Installation

If you prefer to install the package globally:

```bash
npm install -g presentation-creator-mcp-server
npx playwright install chromium
```

Then configure:

```json
{
  "mcpServers": {
    "presentation-creator": {
      "command": "presentation-creator-mcp-server"
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
