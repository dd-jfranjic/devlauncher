#!/usr/bin/env node

// Custom wrapper for Playwright MCP that should work on Windows
const { spawn } = require('child_process');
const path = require('path');

// Find the actual playwright-mcp module
const mcpPath = require.resolve('@playwright/mcp');
const mcpDir = path.dirname(mcpPath);

// Log for debugging
console.error('[Wrapper] Starting Playwright MCP...');
console.error('[Wrapper] MCP Path:', mcpPath);

// Try to load and start the MCP server
try {
  require(mcpPath);
} catch (error) {
  console.error('[Wrapper] Error loading MCP:', error.message);
  
  // Try alternative approach - spawn node process
  const child = spawn('node', [mcpPath], {
    stdio: 'inherit',
    shell: false
  });
  
  child.on('error', (err) => {
    console.error('[Wrapper] Spawn error:', err);
  });
  
  child.on('exit', (code) => {
    console.error('[Wrapper] Process exited with code:', code);
    process.exit(code);
  });
}