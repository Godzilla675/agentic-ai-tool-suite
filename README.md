[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/godzilla675-agentic-ai-tool-suite-badge.png)](https://mseep.ai/app/godzilla675-agentic-ai-tool-suite)

# Unified MCP Suite

This repository contains a collection of Model Context Protocol (MCP) servers, packaged together for convenience. Each server provides distinct functionalities related to media handling, information retrieval, and document creation.

**Important:** These servers are designed to run as separate processes. You need to set up and configure each server individually within your MCP client (e.g., Cline or the Claude Desktop App).

## Included Servers

*   **Media Tools Server (`media-tools-server`)**: Provides tools for searching images (Unsplash) and videos (YouTube), downloading images, and understanding image/video content (Google Gemini, YouTube Transcripts). (Node.js/TypeScript)
*   **Information Retrieval Server (`information-retrieval-server`)**: Provides tools for performing web searches (Google Custom Search) and crawling web pages. (Node.js/TypeScript)
*   **PDF Creator Server (`pdf-creator-server`)**: Provides a tool to generate PDF documents from HTML content using Playwright and Pillow. (Python)
*   **Presentation Creator Server (`presentation-creator-server`)**: Provides tools to assemble PowerPoint presentations from HTML slide content and generate PDFs from HTML. (Python)

## Prerequisites

*   **Node.js and npm**: Required for `media-tools-server` and `information-retrieval-server`. Download from [https://nodejs.org/](https://nodejs.org/)
*   **Python and pip**: Required for `pdf-creator-server` and `presentation-creator-server`. Download from [https://www.python.org/](https://www.python.org/)
*   **Git**: For cloning this repository.
*   **MCP Client**: An application capable of running MCP servers (e.g., Cline, Claude Desktop App).

## Setup Instructions

Follow the steps below for each server you wish to use.

### 1. Clone the Repository

```bash
git clone <repository-url> # Replace <repository-url> with the actual URL
cd unified-mcp-suite
```

### 2. Media Tools Server (`media-tools-server`)

**(Node.js/TypeScript)**

**a. Navigate to Directory:**

```bash
cd media-tools-server
```

**b. Install Dependencies:**

```bash
npm install
```

**c. Build the Server:**

```bash
npm run build
```
(This compiles the TypeScript code into JavaScript in the `build` directory.)

**d. Obtain API Keys:**

*   **Unsplash API Key:** Required for image search. Create an account and register an application at [https://unsplash.com/developers](https://unsplash.com/developers).
*   **Google API Key:** Required for video search/understanding and image understanding.
    *   Enable the "YouTube Data API v3" and "Vertex AI API" (for Gemini) in your Google Cloud Console project: [https://console.cloud.google.com/](https://console.cloud.google.com/)
    *   Create an API key under "APIs & Services" -> "Credentials". Restrict the key if necessary.

**e. Configure MCP Client:**

Add the following configuration to your MCP client's settings file (e.g., `cline_mcp_settings.json` or `claude_desktop_config.json`). Replace placeholders with your actual API keys and the correct absolute path to the built server file.

```json
{
  "mcpServers": {
    // ... other servers
    "media-tools": {
      "command": "node",
      "args": ["C:/path/to/unified-mcp-suite/media-tools-server/build/index.js"], // <-- UPDATE THIS PATH
      "env": {
        "UNSPLASH_ACCESS_KEY": "YOUR_UNSPLASH_API_KEY", // <-- ADD YOUR KEY
        "GOOGLE_API_KEY": "YOUR_GOOGLE_API_KEY"       // <-- ADD YOUR KEY
      },
      "disabled": false, // Set to false to enable
      "autoApprove": []
    }
    // ... other servers
  }
}
```

**f. Navigate Back:**

```bash
cd ..
```

### 3. Information Retrieval Server (`information-retrieval-server`)

**(Node.js/TypeScript)**

**a. Navigate to Directory:**

```bash
cd information-retrieval-server
```

**b. Install Dependencies:**

```bash
npm install
```

**c. Build the Server:**

```bash
npm run build
```

**d. Obtain API Keys:**

*   **Google Custom Search API:**
    *   Enable the "Custom Search API" in your Google Cloud Console project: [https://console.cloud.google.com/](https://console.cloud.google.com/)
    *   Create an API key under "APIs & Services" -> "Credentials".
    *   Create a Custom Search Engine and get its ID: [https://programmablesearchengine.google.com/](https://programmablesearchengine.google.com/)

**e. Configure MCP Client:**

Add the following configuration to your MCP client's settings file. Replace placeholders with your actual API key, Search Engine ID, and the correct absolute path.

```json
{
  "mcpServers": {
    // ... other servers
    "information-retrieval": {
      "command": "node",
      "args": ["C:/path/to/unified-mcp-suite/information-retrieval-server/build/index.js"], // <-- UPDATE THIS PATH
      "env": {
        "GOOGLE_API_KEY": "YOUR_GOOGLE_API_KEY",             // <-- ADD YOUR KEY
        "GOOGLE_CSE_ID": "YOUR_CUSTOM_SEARCH_ENGINE_ID"  // <-- ADD YOUR ID
      },
      "disabled": false, // Set to false to enable
      "autoApprove": []
    }
    // ... other servers
  }
}
```

**f. Navigate Back:**

```bash
cd ..
```

### 4. PDF Creator Server (`pdf-creator-server`)

**(Python)**

**a. Navigate to Directory:**

```bash
cd pdf-creator-server
```

**b. Create and Activate Virtual Environment:**

```bash
# Create environment
python -m venv .venv

# Activate environment
# Windows (Command Prompt/PowerShell)
.\.venv\Scripts\activate
# macOS/Linux (bash/zsh)
# source .venv/bin/activate
```

**c. Install Dependencies:**

```bash
pip install -r requirements.txt
```

**d. Install Playwright Browsers:** (Required for PDF generation)

```bash
playwright install
```

**e. Configure MCP Client:**

Add the following configuration to your MCP client's settings file. Replace the placeholder with the correct absolute path to the Python executable *within the virtual environment* and the server script.

```json
{
  "mcpServers": {
    // ... other servers
    "pdf-creator": {
      // UPDATE python path to point to the .venv executable
      "command": "C:/path/to/unified-mcp-suite/pdf-creator-server/.venv/Scripts/python.exe", // Windows example
      // "command": "/path/to/unified-mcp-suite/pdf-creator-server/.venv/bin/python", // macOS/Linux example
      "args": ["C:/path/to/unified-mcp-suite/pdf-creator-server/pdf_creator_server.py"], // <-- UPDATE THIS PATH
      "env": {}, // No specific environment variables needed by default
      "disabled": false, // Set to false to enable
      "autoApprove": []
    }
    // ... other servers
  }
}
```

**f. Deactivate Virtual Environment (Optional):**

```bash
deactivate
```

**g. Navigate Back:**

```bash
cd ..
```

### 5. Presentation Creator Server (`presentation-creator-server`)

**(Python)**

**a. Navigate to Directory:**

```bash
cd presentation-creator-server
```

**b. Create and Activate Virtual Environment:**

```bash
# Create environment
python -m venv .venv

# Activate environment
# Windows (Command Prompt/PowerShell)
.\.venv\Scripts\activate
# macOS/Linux (bash/zsh)
# source .venv/bin/activate
```

**c. Install Dependencies:**

```bash
pip install -r requirements.txt
```

**d. Install Playwright Browsers:** (Required for screenshotting HTML slides)

```bash
playwright install
```

**e. Configure MCP Client:**

Add the following configuration to your MCP client's settings file. Replace the placeholder with the correct absolute path to the Python executable *within the virtual environment* and the server script.

```json
{
  "mcpServers": {
    // ... other servers
    "presentation-creator": {
      // UPDATE python path to point to the .venv executable
      "command": "C:/path/to/unified-mcp-suite/presentation-creator-server/.venv/Scripts/python.exe", // Windows example
      // "command": "/path/to/unified-mcp-suite/presentation-creator-server/.venv/bin/python", // macOS/Linux example
      "args": ["C:/path/to/unified-mcp-suite/presentation-creator-server/presentation_creator_server.py"], // <-- UPDATE THIS PATH
      "env": {}, // No specific environment variables needed by default
      "disabled": false, // Set to false to enable
      "autoApprove": []
    }
    // ... other servers
  }
}
```

**f. Deactivate Virtual Environment (Optional):**

```bash
deactivate
```

**g. Navigate Back:**

```bash
cd ..
```

## Running the Servers

Once configured in your MCP client, the servers should start automatically when the client launches. You can then use the tools provided by each server through your MCP client interface.

## Example Configuration File

An example configuration file, `example_cline_mcp_settings.json`, is included in the root of this repository. You can use this as a template for configuring the servers in your MCP client (like Cline).

**To use the example:**

1.  Locate your MCP client's actual settings file (e.g., `c:\Users\YourUser\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` for Cline in VS Code on Windows).
2.  Copy the server configurations from `example_cline_mcp_settings.json` into your actual settings file, merging them with any existing server configurations you might have.
3.  **Crucially, update all placeholder paths** (e.g., `C:/absolute/path/to/...`) to reflect the actual absolute path where you cloned the `unified-mcp-suite` repository on your system.
4.  **Replace all placeholder API keys** (e.g., `YOUR_GOOGLE_API_KEY_HERE`) with your own keys obtained during the setup steps.
5.  Ensure the `command` path for the Python servers correctly points to the `python.exe` (Windows) or `python` (macOS/Linux) executable *inside* the respective `.venv` directory you created.
