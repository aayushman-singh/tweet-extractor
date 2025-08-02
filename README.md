# 🚀 JS Script Runner - Chrome Extension

A super lightweight Chrome extension that allows you to run JavaScript scripts on any webpage and download the results as HTML files.

## Features

- ✨ **Lightweight**: Minimal codebase with no external dependencies
- 🎯 **Easy to Use**: Simple popup interface with code editor
- 📥 **Download Results**: Automatically download results as formatted HTML files
- 🔧 **Built-in Examples**: Quick examples for common use cases
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- ⚡ **Fast Execution**: Runs scripts directly in the page context

## Installation

### Method 1: Load as Unpacked Extension (Recommended)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your toolbar

### Method 2: From Chrome Web Store (Coming Soon)

*This extension will be available on the Chrome Web Store soon!*

## Usage

1. **Navigate to any webpage** where you want to run JavaScript
2. **Click the extension icon** in your toolbar
3. **Enter your JavaScript code** in the text area
4. **Click "Run Script"** to execute the code
5. **Click "Download Result"** to save the output as HTML

### Quick Examples

The extension includes several built-in examples:

- **Page Title**: Get the current page title and URL
- **All Links**: Extract all links from the page
- **All Images**: Get information about all images
- **Custom Data**: Extract comprehensive page data

### Keyboard Shortcuts

- `Ctrl + Enter`: Run the current script

## Example Scripts

### Basic Page Information
```javascript
return {
  title: document.title,
  url: window.location.href,
  timestamp: new Date().toISOString()
};
```

### Extract All Links
```javascript
const links = Array.from(document.querySelectorAll('a')).map(link => ({
  text: link.textContent.trim(),
  href: link.href,
  title: link.title
}));

return {
  totalLinks: links.length,
  links: links.slice(0, 50)
};
```

### Get Page Metadata
```javascript
const meta = {};
document.querySelectorAll('meta').forEach(tag => {
  const name = tag.getAttribute('name') || tag.getAttribute('property');
  const content = tag.getAttribute('content');
  if (name && content) {
    meta[name] = content;
  }
});

return meta;
```

### Using Helper Functions
```javascript
// Wait for an element to load
await jsScriptRunnerHelpers.waitForElement('.dynamic-content');

// Get all text content
const allText = jsScriptRunnerHelpers.getAllText();

// Get page metadata
const metadata = jsScriptRunnerHelpers.getPageMetadata();

return {
  text: allText,
  metadata: metadata
};
```

## Available Helper Functions

The extension provides several helper functions you can use in your scripts:

- `jsScriptRunnerHelpers.waitForElement(selector, timeout)`: Wait for an element to appear
- `jsScriptRunnerHelpers.scrollToBottom()`: Scroll to the bottom of the page
- `jsScriptRunnerHelpers.getAllText()`: Get all text content from the page
- `jsScriptRunnerHelpers.getPageMetadata()`: Extract all meta tags

## File Structure

```
x-extension/
├── manifest.json      # Extension configuration
├── popup.html         # Main popup interface
├── popup.js           # Popup logic and UI interactions
├── content.js         # Content script for page execution
├── background.js      # Background service worker
└── README.md          # This file
```

## Permissions

This extension requires the following permissions:

- `activeTab`: To access the current tab and run scripts
- `downloads`: To download result files

## Development

To modify or extend the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Troubleshooting

### Extension Not Working?
- Make sure you're on a webpage (not a chrome:// page)
- Check the browser console for any error messages
- Try refreshing the extension in `chrome://extensions/`

### Script Not Executing?
- Check that your JavaScript syntax is correct
- Make sure you're returning a value from your script
- Try one of the built-in examples first

### Download Not Working?
- Check that you've run a script first
- Make sure your browser allows downloads
- Check the downloads folder in Chrome

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this extension!

## License

This project is open source and available under the MIT License.

---

**Happy scripting! 🚀** 