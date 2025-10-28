# information-retrieval-server MCP Server

A Model Context Protocol server for web information retrieval using Google Custom Search API and web crawling capabilities.

## Features

### Tools

- **`web_search`** - Perform web searches using Google Custom Search API
  - Returns titles, links, and snippets for top search results
  - Configurable result count (1-10)
  
- **`batch_web_search`** - Perform multiple web searches simultaneously
  - Execute up to 15 queries in parallel
  - Returns titles and links for each query
  
- **`google_image_search`** - Search for images using Google Custom Search
  - Returns image URLs, titles, and context
  - Configurable result count (1-10)
  
- **`web_crawl`** - Extract text content from webpages
  - Fast HTTP-based content extraction
  - Removes scripts, styles, and navigation elements
  
- **`advanced_web_crawl`** - Extract content using headless browser
  - More robust for JavaScript-heavy sites
  - Handles sites that block simple HTTP requests
  - Slower but more reliable

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
    "information-retrieval": {
      "command": "npx",
      "args": ["-y", "information-retrieval-mcp-server"]
    }
  }
}
```

### Alternative: Global Installation

If you prefer to install the package globally:

```bash
npm install -g information-retrieval-mcp-server
```

Then configure:

```json
{
  "mcpServers": {
    "information-retrieval": {
      "command": "information-retrieval-mcp-server"
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
