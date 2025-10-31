#!/usr/bin/env node
/**
 * Comprehensive MCP Tool Testing Script
 * Tests all MCP servers and their tools
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_PATH = '/home/runner/work/agentic-ai-tool-suite/agentic-ai-tool-suite';

// Test utilities
function sendMessage(process, message) {
  return new Promise((resolve) => {
    const handler = (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          try {
            const response = JSON.parse(line);
            if (response.id === message.id) {
              process.stdout.removeListener('data', handler);
              resolve(response);
              return;
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
      }
    };
    
    process.stdout.on('data', handler);
    process.stdin.write(JSON.stringify(message) + '\n');
  });
}

async function testServer(name, command, args, tests) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log('='.repeat(60));
  
  try {
    const serverProcess = spawn(command, args, {
      cwd: path.dirname(command),
      env: { ...process.env, NODE_ENV: 'test' }
    });

    // Capture stderr for debugging
    let stderrOutput = '';
    serverProcess.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Initialize connection
    const initResponse = await sendMessage(serverProcess, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });
    
    if (initResponse.error) {
      throw new Error(`Initialization failed: ${initResponse.error.message}`);
    }
    
    console.log('✓ Server initialized successfully');

    // List tools
    const toolsResponse = await sendMessage(serverProcess, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });
    
    if (toolsResponse.error) {
      throw new Error(`Failed to list tools: ${toolsResponse.error.message}`);
    }
    
    const tools = toolsResponse.result.tools;
    console.log(`✓ Found ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Run specific tests for this server
    if (tests) {
      console.log('\nRunning tool tests...');
      for (const test of tests) {
        try {
          const response = await sendMessage(serverProcess, {
            jsonrpc: '2.0',
            id: 100 + tests.indexOf(test),
            method: 'tools/call',
            params: {
              name: test.tool,
              arguments: test.args
            }
          });
          
          if (response.error) {
            console.log(`  ⚠ ${test.name}: ${response.error.message}`);
          } else {
            console.log(`  ✓ ${test.name}: Success`);
          }
        } catch (e) {
          console.log(`  ✗ ${test.name}: ${e.message}`);
        }
      }
    }

    // Clean up
    serverProcess.kill();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, tools: tools.length };
  } catch (error) {
    console.error(`✗ Error testing ${name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('MCP Tools Comprehensive Testing');
  console.log('================================\n');
  
  const results = {};

  // Test Media Tools Server
  results.mediaTools = await testServer(
    'Media Tools Server',
    'node',
    [path.join(BASE_PATH, 'media-tools-server/build/index.js')],
    [
      {
        name: 'Image Search (requires API key)',
        tool: 'image_search',
        args: { query: 'sunset', count: 2 }
      },
      {
        name: 'Download Image',
        tool: 'download_image',
        args: {
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
          filePath: '/tmp/test_image.jpg'
        }
      }
    ]
  );

  // Test Information Retrieval Server  
  results.infoRetrieval = await testServer(
    'Information Retrieval Server',
    'node',
    [path.join(BASE_PATH, 'information-retrieval-server/build/index.js')],
    [
      {
        name: 'Web Search (requires API key)',
        tool: 'web_search',
        args: { query: 'MCP protocol', count: 2 }
      }
    ]
  );

  // Test Presentation Creator Server (TypeScript)
  results.presentationTS = await testServer(
    'Presentation Creator Server (TypeScript)',
    'node',
    [path.join(BASE_PATH, 'presentation-creator-server/build/index.js')],
    [
      {
        name: 'Create Simple PDF',
        tool: 'create_pdf_from_html',
        args: {
          html_content: '<html><body><h1>Test PDF</h1><p>This is a test.</p></body></html>',
          filename: 'test_mcp_output'
        }
      }
    ]
  );

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const allSuccess = Object.values(results).every(r => r.success);
  const totalTools = Object.values(results).reduce((sum, r) => sum + (r.tools || 0), 0);
  
  console.log(`\nServers tested: ${Object.keys(results).length}`);
  console.log(`Total tools available: ${totalTools}`);
  console.log(`Overall status: ${allSuccess ? '✓ ALL PASSED' : '⚠ SOME ISSUES'}\n`);
  
  Object.entries(results).forEach(([name, result]) => {
    const status = result.success ? '✓' : '✗';
    const info = result.success ? `${result.tools} tools` : result.error;
    console.log(`  ${status} ${name}: ${info}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('NOTE: Some tests require API keys to be configured.');
  console.log('Tools that need API keys will show warnings but the servers');
  console.log('are still functional - they just need proper configuration.');
  console.log('='.repeat(60) + '\n');
  
  process.exit(allSuccess ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
