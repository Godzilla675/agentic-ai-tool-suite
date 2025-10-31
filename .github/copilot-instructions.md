# Agentic AI Tool Suite - AI Coding Agent Instructions

## Project Overview

This is a **monorepo of Model Context Protocol (MCP) servers** providing media handling, information retrieval, and document creation capabilities. Each server is a separate, independently deployable process that communicates via stdio transport.

### Architecture Pattern: Multi-Language MCP Server Suite

- **TypeScript Servers** (`information-retrieval-server`, `media-tools-server`, `presentation-creator-server`): Use `@modelcontextprotocol/sdk`, Zod validation, stdio transport
- **Python Servers** (`pdf-creator-server`, `presentation-creator-server`): Use `fastmcp` library, async/await patterns
- **Dual Implementation**: `presentation-creator-server` exists in both TypeScript (wrapper) and Python (implementation) - Python version contains the actual logic

## Critical Developer Workflows

### Building TypeScript Servers

**Standard build process** (applies to all TS servers):
```bash
cd <server-directory>
npm install
npm run build  # Compiles TS → JS, bundles with esbuild, sets executable permissions
```

The `build` script in `package.json` performs three steps:
1. `tsc` - TypeScript compilation to `build/` directory
2. `esbuild` - Bundles into single file with external packages
3. `chmod 755` - Makes `build/index.js` executable for shebang execution

**Development workflow**:
```bash
npm run watch        # Auto-rebuild on changes
npm run inspector    # Debug with MCP Inspector (opens browser UI)
```

### Python Server Setup

**Virtual environment required**:
```bash
cd <python-server-directory>
python -m venv .venv
.\.venv\Scripts\activate  # Windows PowerShell
pip install -r requirements.txt
playwright install chromium  # Required for PDF/presentation generation
```

**Important**: MCP client configs must point to the venv's Python executable, not system Python:
```json
{
  "command": "C:/path/to/.venv/Scripts/python.exe",
  "args": ["C:/path/to/server_script.py"]
}
```

### Publishing Workflow

**TypeScript servers** are published to npm and can be run via `npx`:
- Published packages: `information-retrieval-mcp-server`, `media-tools-mcp-server`, `presentation-creator-mcp-server`
- Users can run with: `npx -y <package-name>` (no installation needed)
- The `prepare` script in package.json auto-builds before publishing

**Python servers** are packaged but not yet published to PyPI (see `PUBLISHED_PACKAGES.md`)

## Project-Specific Conventions

### Environment Variables Pattern

All servers follow this pattern:
1. Check for required API keys at startup (log warnings, don't exit)
2. Validate keys when tools are called (return user-friendly error messages)
3. Support fallback env var names (e.g., `GEMINI_API_KEY` OR `GOOGLE_API_KEY`)

Example from `information-retrieval-server/src/index.ts`:
```typescript
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.error("WARN: GOOGLE_API_KEY not set. Tools will fail.");
}
```

### Tool Implementation Pattern

**TypeScript servers** use this structure:
```typescript
// 1. Define Zod schema for validation
const toolArgsSchema = z.object({
  param: z.string().describe('Description for LLM'),
});

// 2. Implement handler function
async function handleTool({ param }: { param: string }) {
  try {
    // Tool logic here
    return { content: [{ type: 'text', text: 'Result' }] };
  } catch (error: any) {
    return { isError: true, content: [{ type: 'text', text: error.message }] };
  }
}

// 3. Register in ListToolsRequestSchema handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{ name: 'tool_name', description: '...', inputSchema: {...} }]
}));

// 4. Route in CallToolRequestSchema handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const validatedArgs = toolArgsSchema.parse(request.params.arguments);
  return await handleTool(validatedArgs);
});
```

**Python servers** use FastMCP decorators:
```python
@mcp.tool()
async def tool_name(param: str, optional_param: str = "default") -> str:
    """Docstring becomes tool description for LLM."""
    try:
        # Tool logic
        return "Success message"
    except Exception as e:
        return f"Error: {e}"
```

### Output File Conventions

All servers save output files to `~/Downloads` folder:
- PDFs: `~/Downloads/<filename>.pdf`
- Presentations: `~/Downloads/<filename>.pptx`
- Downloaded images: User-specified path (validated for image extensions)

### Temporary File Handling

Python servers use this pattern:
```python
temp_dir = tempfile.mkdtemp(prefix="mcp_<server>_")
try:
    # Use temp_dir for intermediate files
    pass
finally:
    if temp_dir and os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
```

### Error Handling Philosophy

- **User-facing errors**: Return helpful messages explaining what went wrong and how to fix it
- **API errors**: Parse and format API error responses (code, message)
- **Never exit the server process** on API errors - return error content to the client
- **Log to stderr**: Use `console.error()` (TS) or `logging` (Python) for diagnostics

## Integration Points

### External APIs Used

1. **Google Custom Search API** (`information-retrieval-server`):
   - Requires: `GOOGLE_API_KEY`, `GOOGLE_CSE_ID`
   - Rate limits: Handle in error messages
   - Endpoint: `https://www.googleapis.com/customsearch/v1`

2. **Unsplash API** (`media-tools-server`):
   - Requires: `UNSPLASH_ACCESS_KEY`
   - Header: `Authorization: Client-ID <key>`
   - Returns: Image URLs, photographer credits

3. **YouTube Data API v3** (`media-tools-server`):
   - Requires: `YOUTUBE_API_KEY`
   - Used for video search only (not transcripts)

4. **Google Gemini API** (`media-tools-server`):
   - Requires: `GEMINI_API_KEY`
   - Model: `gemini-2.5-flash` for vision and text
   - Important: Doesn't generate images directly, creates descriptions

5. **Playwright** (Multiple servers):
   - Used for: Web crawling, PDF generation, screenshot capture
   - Browser: Chromium (must be installed: `playwright install chromium`)
   - Headless mode by default

### Cross-Server Communication

**None** - servers are completely independent. Each MCP client connects to multiple servers separately.

### Package Dependencies Pattern

TypeScript servers share common dependencies:
- `@modelcontextprotocol/sdk`: ^0.6.0 (listed in both dependencies and devDependencies for development)
- `zod`: Input validation
- `axios`: HTTP requests
- `playwright`: Headless browser automation

Python servers use:
- `fastmcp`: MCP framework
- `playwright`: Browser automation
- `python-dotenv`: Environment variables
- `python-pptx` OR `pptxgenjs`: Presentation creation

## Key Files & Their Roles

- `example_mcp_settings.json`: Template config for all servers (with placeholder paths/keys)
- `npx_mcp_settings_with_keys.json`: Production config using npx (no local paths needed)
- `PUBLISHED_PACKAGES.md`: Installation guide for published npm packages
- `README.md`: Main documentation with both npx (recommended) and build-from-source instructions
- `build/index.js`: Compiled, bundled, executable output for TS servers (gitignored)

## Common Patterns to Follow

### When Adding a New Tool

1. Add Zod schema (TS) or type hints (Python)
2. Implement handler with try-catch error handling
3. Register in tool list with clear description
4. Add to CallToolRequestSchema router (TS)
5. Test with `npm run inspector` or MCP client
6. Document in server's README.md

### When Publishing Updates

1. Increment version in `package.json` (TS) or `setup.py` (Python)
2. Run `npm run build` to ensure clean build
3. Test with `npx -y <package>@latest` before publishing
4. Publish: `npm publish` (requires npm authentication)
5. Update `PUBLISHED_PACKAGES.md` with new version number

### MCP Client Configuration

Users configure servers in `claude_desktop_config.json` or `cline_mcp_settings.json`. Two approaches:

**Approach 1: npx (recommended for published packages)**:
```json
{
  "command": "npx",
  "args": ["-y", "package-name"],
  "env": { "API_KEY": "value" }
}
```

**Approach 2: Local paths (for development)**:
```json
{
  "command": "node",
  "args": ["C:/absolute/path/to/build/index.js"],
  "env": { "API_KEY": "value" }
}
```

## Debugging Notes

- **stdio transport**: All server communication via stdin/stdout, errors to stderr
- **MCP Inspector**: Essential tool for debugging - shows requests/responses in browser UI
- **PowerShell timeout bug**: Reuse terminal sessions when running commands to avoid initialization delays (see `commands.instructions.md`)
- **Playwright browsers**: Must be explicitly installed after npm/pip install
- **API key issues**: Check environment variables are set in MCP client config, not shell environment

## Testing Strategy

Currently no automated tests. Manual testing workflow:
1. Build server
2. Run with MCP Inspector: `npm run inspector`
3. Test each tool with various inputs
4. Verify error handling with invalid inputs/missing API keys
5. Test in actual MCP client (Claude Desktop/Cline)

## When Troubleshooting

1. **Server won't start**: Check if build succeeded, verify shebang line in `build/index.js`
2. **API errors**: Verify API keys are set in client config, check API quotas/billing
3. **Playwright errors**: Ensure browsers installed (`playwright install chromium`)
4. **Import errors (Python)**: Verify virtual environment is activated and requirements installed
5. **npx caching issues**: Clear npx cache if old version runs: `Remove-Item -Path "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Force`
