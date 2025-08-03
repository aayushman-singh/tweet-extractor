# Extension Development Guide

## File Structure

```
extension/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js          # Popup logic and user interactions
├── content.js        # Content script (runs on web pages)
├── working.js        # Core tweet scraping logic
├── download-helper.js # Helper for download coordination
└── background.js     # Background service worker
```

## Key Components

### manifest.json
- Defines extension permissions and structure
- Configures web accessible resources
- Sets up content scripts and popup

### popup.html + popup.js
- **Purpose**: Extension's user interface
- **Features**: Tweet count selection, upload options
- **Communication**: Sends messages to content script

### content.js
- **Purpose**: Mediates between popup and page scripts
- **Injection**: Injects working.js and download-helper.js
- **Events**: Handles custom events for communication

### working.js
- **Purpose**: Core tweet scraping functionality
- **API Calls**: Makes requests to Twitter/X GraphQL API
- **HTML Generation**: Creates rich HTML archives
- **S3 Upload**: Handles cloud upload functionality

### download-helper.js
- **Purpose**: Coordinates download process in page context
- **Context**: Runs in page context to access Twitter API tokens
- **Communication**: Uses custom events to relay results

## Development Workflow

1. **Make Changes**: Edit files in the extension folder
2. **Reload Extension**: 
   - Go to `chrome://extensions/`
   - Click refresh icon on Tweet Downloader
3. **Test**: Navigate to Twitter/X profile and test functionality
4. **Debug**: Use Chrome DevTools console for debugging

## Debugging

### Extension Popup
- Right-click extension icon → "Inspect popup"
- Console shows popup.js logs

### Content Script
- Open DevTools on Twitter/X page
- Console shows content.js logs

### Page Context Scripts
- Open DevTools on Twitter/X page
- Console shows working.js and download-helper.js logs

## Common Issues

### "Script not initialized" Error
- **Cause**: working.js not loaded properly
- **Fix**: Check web_accessible_resources in manifest.json
- **Debug**: Look for injection errors in content.js

### CORS Errors
- **Cause**: API endpoint not configured properly
- **Fix**: Update API_BASE_URL in working.js
- **Debug**: Check network tab for failed requests

### Token Extraction Issues
- **Cause**: Twitter/X changed cookie structure
- **Fix**: Update extractTokensFromSession() in working.js
- **Debug**: Check document.cookie in DevTools

## Configuration

### API Endpoint
Update the API endpoint in working.js:
```javascript
const API_BASE_URL = 'https://your-domain.com';
```

### Tweet Limits
Modify limits in popup.html:
```html
<option value="custom">Custom</option>
```

And in popup.js:
```javascript
if (!count || count < 1 || count > 50000) {
```

## Permissions Explained

- **`activeTab`**: Access current tab for Twitter/X pages
- **`storage`**: Store extension preferences (future use)
- **`downloads`**: Download generated HTML files
- **`scripting`**: Inject scripts into web pages

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup opens and shows correct UI
- [ ] Works on various Twitter/X profile URLs
- [ ] Downloads work for different tweet counts
- [ ] S3 upload functionality works (if API configured)
- [ ] Generated HTML has proper sorting/filtering
- [ ] No console errors during operation

## Building for Production

1. **Test thoroughly** on multiple Twitter profiles
2. **Remove debug logs** from production code
3. **Update manifest version** for releases
4. **Package extension** for Chrome Web Store:
   ```bash
   cd extension
   zip -r tweet-downloader.zip . -x "*.md" "DEVELOPMENT.md"
   ```

## Chrome Web Store Submission

1. Create ZIP package (exclude .md files)
2. Upload to Chrome Web Store Developer Dashboard
3. Fill out store listing information
4. Submit for review