# media-tools-server MCP Server

A Model Context Protocol server for media search, download, and understanding using Unsplash, YouTube, and Google Gemini APIs.

## Features

### Tools

- **`image_search`** - Search for high-quality images on Unsplash
  - Returns image URLs, descriptions, and photographer credits
  - Configurable result count (default: 5)
  
- **`download_image`** - Download images from URLs to local filesystem
  - Supports any image URL
  - Saves with custom filename and path
  
- **`video_search`** - Search for YouTube videos
  - Returns video IDs, titles, descriptions, and channel info
  - Configurable result count (default: 5)
  
- **`video_understanding`** - Extract transcripts from YouTube videos
  - Returns timestamped transcript text
  - Useful for content analysis and summarization
  
- **`image_understanding`** - Analyze images using Google Gemini AI
  - Accepts image URLs or local file paths
  - Optional custom prompts for guided analysis
  - Returns detailed image descriptions

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
    "media-tools": {
      "command": "npx",
      "args": ["-y", "media-tools-mcp-server"]
    }
  }
}
```

**Note:** This server requires a Google Gemini API key for image understanding features. Set it as an environment variable:

```json
{
  "mcpServers": {
    "media-tools": {
      "command": "npx",
      "args": ["-y", "media-tools-mcp-server"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Alternative: Global Installation

If you prefer to install the package globally:

```bash
npm install -g media-tools-mcp-server
```

Then configure:

```json
{
  "mcpServers": {
    "media-tools": {
      "command": "media-tools-mcp-server",
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
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
