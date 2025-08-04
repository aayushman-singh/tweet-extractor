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

## 📊 API Response Data Model

The extension processes Twitter/X API responses with the following data structure:

```javascript
Data: {
  User: {
    __typename: "User",
    id: String,
    rest_id: String,
    core: {
      created_at: String,
      name: String,
      screen_name: String
    },
    avatar: {
      image_url: String
    },
    legacy: {
      description: String,
      entities: {
        description: {
          urls: [
            {
              url: String,
              expanded_url: String,
              display_url: String
            }
          ]
        },
        url: {
          urls: [
            {
              url: String,
              expanded_url: String,
              display_url: String
            }
          ]
        }
      },
      followers_count: Number,
      friends_count: Number,
      statuses_count: Number,
      pinned_tweet_ids_str: [String],
      profile_banner_url: String,
      url: String
    },
    location: {
      location: String
    },
    verification: {
      verified: Boolean
    }
  },
  Tweet: {
    __typename: "Tweet",
    rest_id: String,
    core: {
      user_results: {
        result: User  // Embedded User object
      }
    },
    legacy: {
      created_at: String,
      full_text: String,
      entities: {  //Often other Tweets or Users
        hashtags: [],
        urls: [],
        user_mentions: []
      },
      favorite_count: Number,
      retweet_count: Number,
      reply_count: Number,
      bookmark_count: Number,
      user_id_str: String,
      id_str: String
    },
    views: {
      count: String
    },
    source: String
  },
  Timeline: {
    instructions: [
      {
        type: "TimelineClearCache" | "TimelinePinEntry" | "TimelineAddEntries",
        entry: {
          entryId: String,
          sortIndex: String,
          content: {
            itemContent: {
              tweet_results: {
                result: Tweet  // Embedded Tweet object
              }
            },
             socialContext: {  //optional
                type: String,
                contextType: String,
                text: String
              }
          }
        }
      }
    ]
  }
}
```

### Key Fields Extracted

The extension specifically extracts the following engagement metrics from the API response:

- **`favorite_count`** - Number of likes
- **`retweet_count`** - Number of retweets  
- **`reply_count`** - Number of replies
- **`bookmark_count`** - Number of bookmarks
- **`views.count`** - Number of views (from the `views` object)

These fields are processed and included in the exported JSON data, which is then stored in S3 and displayed in the frontend reports.