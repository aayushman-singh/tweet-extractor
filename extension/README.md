# Tweet Downloader Chrome Extension

A Chrome extension that downloads tweets from X/Twitter profiles and generates rich HTML archives with sorting and filtering capabilities.

## Features

- 🐦 Download tweets from any X/Twitter profile
- 📊 Choose tweet count (10, 100, 500, 1000, 10000, or custom)
- 🌐 Upload to cloud (extractor.aayushman.dev) or download locally
- 📱 Rich HTML output with interactive sorting and filtering
- 🔍 Search through tweet content
- 📈 Sort by date, likes, retweets, views, or engagement
- 📄 Export to JSON/CSV formats

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this `extension` folder
4. The extension icon will appear in your browser toolbar

## Usage

1. Navigate to any X/Twitter profile page (e.g., `x.com/username`)
2. Click the Tweet Downloader extension icon
3. Select the number of tweets to download
4. Choose between local download or cloud upload
5. Click "Download HTML Archive"
6. View the generated rich HTML archive

## Files

- **`manifest.json`** - Extension configuration and permissions
- **`popup.html`** - Extension popup UI
- **`popup.js`** - Popup logic and user interaction handling
- **`content.js`** - Content script for page interaction
- **`working.js`** - Core tweet scraping and HTML generation logic
- **`download-helper.js`** - Helper script for download coordination
- **`background.js`** - Background service worker

## Permissions

- **`activeTab`** - Access current tab for Twitter/X pages
- **`storage`** - Store extension preferences
- **`downloads`** - Download generated files
- **`scripting`** - Inject scripts into web pages

## Browser Support

- Chrome/Chromium (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Development

To modify the extension:

1. Make changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Tweet Downloader extension
4. Test your changes on a Twitter/X profile page