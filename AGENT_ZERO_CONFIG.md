# Agent Zero MCP Configuration Guide

This guide explains how to configure the MCP servers from this repository for use with Agent Zero.

## Prerequisites

- Agent Zero installed (Docker or local)
- Node.js v20+ (for npx execution)
- API keys for the services you want to use

## Configuration

Agent Zero uses MCP servers through its configuration system. Here's the correct configuration for each server:

### Complete Configuration Example

Save this as your MCP configuration in Agent Zero:

```json
{
  "mcpServers": {
    "information-retrieval": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "information-retrieval-mcp-server"],
      "env": {
        "GOOGLE_API_KEY": "your-google-api-key",
        "GOOGLE_CSE_ID": "your-custom-search-engine-id"
      }
    },
    "media-tools": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "media-tools-mcp-server"],
      "env": {
        "UNSPLASH_ACCESS_KEY": "your-unsplash-key",
        "YOUTUBE_API_KEY": "your-youtube-api-key",
        "GEMINI_API_KEY": "your-gemini-api-key"
      }
    },
    "presentation-creator": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "presentation-creator-mcp-server"],
      "env": {}
    }
  }
}
```

## Important Notes

### Package Names vs Binary Names

**Always use the full package name with npx:**

✅ **CORRECT:**
```bash
npx -y information-retrieval-mcp-server
npx -y media-tools-mcp-server
npx -y presentation-creator-mcp-server
```

❌ **INCORRECT (will fail):**
```bash
npx -y information-retrieval-server
npx -y media-tools-server
npx -y presentation-creator-server
```

### Required Dependencies

After the fix in commit `9c627c8`, all required dependencies (including `zod`) are properly declared. The servers will now work correctly when installed via npx.

### API Keys

Different servers require different API keys:

#### Information Retrieval Server
- `GOOGLE_API_KEY` - Google API key ([Get it here](https://console.cloud.google.com/))
- `GOOGLE_CSE_ID` - Custom Search Engine ID ([Create one here](https://programmablesearchengine.google.com/))

#### Media Tools Server
- `UNSPLASH_ACCESS_KEY` - Unsplash API key ([Get it here](https://unsplash.com/developers))
- `YOUTUBE_API_KEY` - YouTube Data API key ([Get it here](https://console.cloud.google.com/))
- `GEMINI_API_KEY` - Google Gemini API key ([Get it here](https://aistudio.google.com/apikey))

#### Presentation Creator Server
- No API keys required ✅

## Troubleshooting

### Error: "Cannot find package 'zod'"

**Solution:** This was fixed in commit `9c627c8`. Make sure the published npm packages include this fix. If you're seeing this error, the packages need to be republished to npm with the updated dependencies.

### Error: "Command not found" or "sh: 1: media-tools-server: not found"

**Solution:** Use the full package name with npx (see "Package Names vs Binary Names" above).

### Error: "Connection closed" or "Failed to initialize"

**Possible causes:**
1. Missing or invalid API keys
2. Network connectivity issues
3. npx cache issues (clear with `npx clear-npx-cache`)
4. Node.js version incompatibility (use v20+)

**Debug steps:**
1. Test the server manually:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx -y media-tools-mcp-server
   ```
2. Check the server logs in Agent Zero's MCP server status panel
3. Verify API keys are correctly set in the environment variables

## Docker-Specific Notes

When running Agent Zero in Docker:

1. Make sure Node.js is available in the container
2. Environment variables must be passed through Docker's environment configuration
3. npx may need to download packages on first use (requires internet access)

## Testing the Servers

You can test each server independently before configuring in Agent Zero:

```bash
# Test information-retrieval-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  GOOGLE_API_KEY=your-key GOOGLE_CSE_ID=your-id \
  npx -y information-retrieval-mcp-server

# Test media-tools-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  UNSPLASH_ACCESS_KEY=your-key \
  npx -y media-tools-mcp-server

# Test presentation-creator-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  npx -y presentation-creator-mcp-server
```

Expected output should include a JSON response with the list of available tools.

## Version Compatibility

- **MCP Protocol:** 2024-11-05
- **Node.js:** v20+ required
- **npm:** v9+ required
- **Agent Zero:** Compatible with latest version

## Docker Testing Results

All MCP servers have been tested and verified to work correctly in a Docker environment (Node 20-slim):

✅ **information-retrieval-mcp-server** - Works correctly via npx  
✅ **media-tools-mcp-server** - Works correctly via npx  
✅ **presentation-creator-mcp-server** - Works correctly via npx

The Docker test confirmed that:
- npx correctly downloads and runs the packages
- The zod dependency is properly included after the fix
- All servers initialize and respond to tool list requests
- API key validation works as expected (shows warnings when missing)

## Support

If you encounter issues:
1. Check that the npm packages have been republished with the zod fix (commit 9c627c8)
2. Verify your API keys are valid
3. Test the servers independently first (see "Testing the Servers" section)
4. Check Agent Zero's MCP server logs for detailed error messages
5. Try clearing npx cache: `npx clear-npx-cache`
