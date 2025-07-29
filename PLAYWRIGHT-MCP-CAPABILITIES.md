# Playwright MCP Capabilities

## ✅ Confirmed Working
Your test shows that `npx @playwright/mcp@latest` is working correctly!

## 🔧 Fix Your Configuration

You currently have the WRONG package configured:
- ❌ `@executeautomation/playwright-mcp` - NOT the official package

You need to switch to:
- ✅ `@playwright/mcp@latest` - Official Microsoft package

## 📋 Quick Fix Commands

```powershell
# Remove wrong configuration
claude mcp remove playwright

# Add correct configuration
claude mcp add playwright "npx @playwright/mcp@latest"

# Or with enhanced capabilities (vision + PDF)
claude mcp add playwright "npx @playwright/mcp@latest --caps vision,pdf"

# Restart Claude
# Exit with Ctrl+C, then run:
claude
```

## 🚀 What Playwright MCP Can Do

### Live Browser Interaction
- **Read JavaScript**: Access all loaded JS libraries, variables, and functions
- **Extract CSS**: Get computed styles, stylesheets, and CSS rules
- **DOM Manipulation**: Query selectors, get element properties
- **Form Testing**: Fill forms, click buttons, test interactions
- **Network Monitoring**: See API calls and responses

### Advanced Features
- **Mobile Emulation**: `--device "iPhone 15"`
- **Screenshots**: With `--caps vision`
- **PDF Generation**: With `--caps pdf`
- **Trace Recording**: `--save-trace` for debugging
- **Multi-browser**: Chrome, Firefox, WebKit, Edge

## 💡 Use Cases for Your Fiskal AI Project

1. **Test Your Next.js Frontend**
   ```
   "Use Playwright to check if the invoice form on localhost:13649 works"
   ```

2. **Extract Styles**
   ```
   "Get all CSS variables and theme colors from the app"
   ```

3. **API Testing**
   ```
   "Test the NestJS API endpoints through the browser"
   ```

4. **Mobile Testing**
   ```
   "Check how the app looks on iPhone 15"
   ```

5. **Performance Analysis**
   ```
   "Check what JavaScript libraries are loaded and their sizes"
   ```

## 🔍 Debugging Tips

If it still doesn't connect after fixing:

1. **Test Direct Execution**
   ```powershell
   npx @playwright/mcp@latest
   ```
   Should start and wait for input (Ctrl+C to exit)

2. **Check Node Version**
   ```powershell
   node --version  # Should be v18+
   ```

3. **Install Playwright Browsers**
   ```powershell
   npx playwright install chromium
   ```

4. **Try Alternative Config**
   ```powershell
   # With headless mode
   claude mcp add playwright "npx @playwright/mcp@latest --headless"
   
   # With specific browser
   claude mcp add playwright "npx @playwright/mcp@latest --browser chrome"
   ```

## ✨ Next Steps

1. Fix the configuration using commands above
2. Restart Claude
3. Verify with `claude mcp list`
4. Start using Playwright to test your Fiskal AI app!

The fact that `--help` works proves the package is correct. You just need to update your Claude configuration to use the right package name.