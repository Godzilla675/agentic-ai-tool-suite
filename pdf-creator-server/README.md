# PDF Creator Server MCP

A Model Context Protocol server for creating PDF documents from HTML.

## Features

- Create PDF documents from HTML content
- Fast and efficient PDF generation
- Easy integration with MCP clients

## Installation

```bash
pip install pdf-creator-server-mcp
```

## Usage

To use with Claude Desktop or other MCP clients, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pdf-creator": {
      "command": "pdf-creator-server"
    }
  }
}
```

## Development

Install dependencies:
```bash
pip install -r requirements.txt
```

## License

MIT
