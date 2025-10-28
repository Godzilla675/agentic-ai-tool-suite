# Published MCP Server Packages

This document lists all published MCP server packages from the Agentic AI Tool Suite.

## 📦 NPM Packages (Published)

All TypeScript/Node.js servers are available on npm and can be used directly with `npx` - no installation required!

### 1. information-retrieval-mcp-server

**Package**: `information-retrieval-mcp-server`  
**Version**: 0.1.0  
**NPM**: https://www.npmjs.com/package/information-retrieval-mcp-server

**Features**:
- Web search using Google Custom Search API
- Batch web search (up to 15 queries)
- Google image search
- Web page crawling (simple and advanced with headless browser)

**Installation**:
```bash
# Using npx (recommended)
npx -y information-retrieval-mcp-server

# Or install globally
npm install -g information-retrieval-mcp-server
```

**Configuration**:
```json
{
  "mcpServers": {
    "information-retrieval": {
      "command": "npx",
      "args": ["-y", "information-retrieval-mcp-server"],
      "env": {
        "GOOGLE_API_KEY": "your-api-key",
        "GOOGLE_CSE_ID": "your-search-engine-id"
      }
    }
  }
}
```

---

### 2. media-tools-mcp-server

**Package**: `media-tools-mcp-server`  
**Version**: 0.1.0  
**NPM**: https://www.npmjs.com/package/media-tools-mcp-server

**Features**:
- Image search (Unsplash)
- Video search (YouTube)
- Image download from URLs
- Image understanding (Google Gemini)
- Video transcript extraction (YouTube)

**Installation**:
```bash
# Using npx (recommended)
npx -y media-tools-mcp-server

# Or install globally
npm install -g media-tools-mcp-server
```

**Configuration**:
```json
{
  "mcpServers": {
    "media-tools": {
      "command": "npx",
      "args": ["-y", "media-tools-mcp-server"],
      "env": {
        "UNSPLASH_ACCESS_KEY": "your-unsplash-key",
        "GEMINI_API_KEY": "your-gemini-key"
      }
    }
  }
}
```

---

### 3. presentation-creator-mcp-server

**Package**: `presentation-creator-mcp-server`  
**Version**: 0.1.0  
**NPM**: https://www.npmjs.com/package/presentation-creator-mcp-server

**Features**:
- Create PowerPoint presentations from HTML slides
- Generate PDF documents from HTML content
- Uses Playwright for rendering

**Installation**:
```bash
# Using npx (recommended)
npx -y presentation-creator-mcp-server

# Install Playwright browsers (required)
npx playwright install chromium

# Or install globally
npm install -g presentation-creator-mcp-server
npx playwright install chromium
```

**Configuration**:
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

---

## 🐍 Python Packages (Not Yet Published)

### 4. pdf-creator-server-mcp

**Status**: Built but not published to PyPI  
**Version**: 0.1.0

**Features**:
- Generate PDF documents from HTML content
- Uses Playwright and Pillow

**To Publish**:
The package is ready to be published. Distribution files are in `pdf-creator-server/dist/`.

To publish to PyPI:
1. Create a PyPI account at https://pypi.org/account/register/
2. Generate an API token at https://pypi.org/manage/account/token/
3. Run: `python -m twine upload dist/*`
4. Username: `__token__`
5. Password: Your API token

**Installation (after publishing)**:
```bash
pip install pdf-creator-server-mcp
```

---

## 🔑 Required API Keys

| Server | API Keys Required | Get Key Here |
|--------|------------------|--------------|
| **information-retrieval** | Google API Key<br>Google CSE ID | [Google Cloud Console](https://console.cloud.google.com/)<br>[Programmable Search](https://programmablesearchengine.google.com/) |
| **media-tools** | Unsplash Access Key<br>Google Gemini API Key | [Unsplash Developers](https://unsplash.com/developers)<br>[Google AI Studio](https://aistudio.google.com/apikey) |
| **presentation-creator** | None | - |
| **pdf-creator** | None | - |

---

## 📝 Quick Start Example

Here's a complete example configuration for Claude Desktop using all published servers:

**File Location**:
- MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "information-retrieval": {
      "command": "npx",
      "args": ["-y", "information-retrieval-mcp-server"],
      "env": {
        "GOOGLE_API_KEY": "your-google-api-key",
        "GOOGLE_CSE_ID": "your-search-engine-id"
      }
    },
    "media-tools": {
      "command": "npx",
      "args": ["-y", "media-tools-mcp-server"],
      "env": {
        "UNSPLASH_ACCESS_KEY": "your-unsplash-key",
        "GEMINI_API_KEY": "your-gemini-key"
      }
    },
    "presentation-creator": {
      "command": "npx",
      "args": ["-y", "presentation-creator-mcp-server"]
    }
  }
}
```

After adding the configuration, restart your MCP client (e.g., Claude Desktop) to load the servers.

---

## 🚀 Benefits of Using npx

1. **No Installation**: Servers run directly without global installation
2. **Always Latest**: Automatically uses the latest version
3. **No Build Required**: No need to clone, build, or maintain local copies
4. **Easy Updates**: Just restart your MCP client to get updates
5. **Simple Setup**: Single line configuration per server

---

## 📚 Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [GitHub Repository](https://github.com/Godzilla675/agentic-ai-tool-suite)
- Individual package README files in each server directory

---

## 🆘 Support

For issues or questions:
1. Check the individual server README files
2. Visit the GitHub repository
3. Review the MCP documentation

---

**Last Updated**: October 28, 2025
