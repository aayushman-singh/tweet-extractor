# 🐦 Tweet Downloader - Chrome Extension & API

A comprehensive solution for downloading tweets from X/Twitter profiles with rich HTML archives and cloud hosting capabilities.

## 📁 Project Structure

```
x-extension/
├── extension/          # Chrome Extension files
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   ├── working.js
│   ├── download-helper.js
│   ├── background.js
│   └── README.md
├── api/                # Backend API for S3 uploads
│   ├── s3-upload-api.js
│   ├── package.json
│   ├── vercel.json
│   └── README.md
└── README.md          # This file
```

## 🚀 Quick Start

### Chrome Extension

1. **Install the Extension:**
   ```bash
   cd extension
   # Load the extension folder in chrome://extensions/
   ```

2. **Use the Extension:**
   - Navigate to any X/Twitter profile (e.g., `x.com/username`)
   - Click the Tweet Downloader extension icon
   - Select tweet count and output option
   - Download or upload to cloud

### Backend API (Optional)

1. **Deploy to Vercel:**
   ```bash
   cd api
   npm install
   vercel
   ```

2. **Configure Environment Variables:**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `S3_BUCKET_NAME`

## ✨ Features

### Chrome Extension
- 🐦 **Tweet Download** - Extract tweets from any X/Twitter profile
- 📊 **Flexible Count** - Download 10, 100, 500, 1000, 10000, or custom amount
- 🌐 **Cloud Upload** - Upload to custom domain or download locally
- 📱 **Rich HTML Output** - Interactive archives with sorting and filtering
- 🔍 **Search & Filter** - Search through tweet content
- 📈 **Multiple Sort Options** - By date, likes, retweets, views, engagement
- 📄 **Export Options** - JSON, CSV, and HTML formats

### Backend API
- 🌐 **S3 Upload** - Upload HTML files to AWS S3
- 🔒 **Security** - CORS configured for Chrome extensions
- 📁 **Public Access** - Generated reports accessible via custom URLs
- 🚀 **Serverless** - Deploy to Vercel, Netlify, or AWS Lambda
- 📊 **Monitoring** - Health check and recent uploads endpoints

## 🛠️ Development

### Extension Development
```bash
cd extension
# Make changes to files
# Refresh extension in chrome://extensions/
# Test on Twitter/X profile pages
```

### API Development
```bash
cd api
npm install
npm run dev
# API runs on http://localhost:3000
```

## 📋 Requirements

### Extension
- Chrome/Chromium browser (Manifest V3)
- Active internet connection
- Access to X/Twitter website

### API
- Node.js 16+
- AWS S3 bucket
- AWS credentials
- Domain for hosting (optional)

## 🔧 Configuration

### Extension Configuration
Update `working.js` to change the API endpoint:
```javascript
const API_BASE_URL = 'https://your-domain.com';
```

### API Configuration
Set environment variables:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
```

## 📊 Output Examples

### Generated URLs
- `https://extractor.aayushman.dev/report1704123456.html`
- Interactive HTML with sorting and filtering
- JSON/CSV export options within the HTML

### File Structure
```
report1704123456.html
├── Tweet statistics
├── Timeline visualization
├── Sort & filter controls
├── Interactive tweet list
└── Export buttons (JSON/CSV)
```

## 🚀 Deployment

### Extension
1. Load unpacked in Chrome developer mode
2. Or package for Chrome Web Store

### API
1. **Vercel (Recommended):**
   ```bash
   cd api && vercel
   ```

2. **Netlify:**
   ```bash
   cd api && netlify deploy
   ```

3. **AWS Lambda:**
   ```bash
   cd api && serverless deploy
   ```

## 🔒 Security

- **Extension**: Runs only on X/Twitter domains
- **API**: CORS restricted to extension origins
- **S3**: Public read access for generated reports only
- **Credentials**: Environment-based AWS configuration

## 📝 License

MIT License - see LICENSE.txt for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes in appropriate folder (`extension/` or `api/`)
4. Test thoroughly
5. Submit pull request

## 📞 Support

For issues or questions:
- Create an issue in this repository
- Check the README files in `extension/` or `api/` folders
- Review the example HTML output in the repository