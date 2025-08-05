# 🐦 Tweet Extractor - Chrome Extension & API

A comprehensive solution for extracting and archiving tweets from X/Twitter profiles with rich HTML archives and cloud hosting capabilities.

## 📁 Project Structure

```
tweet-extractor/
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
│   ├── server.js
│   ├── package.json
│   └── README.md
├── frontend/           # React/TypeScript frontend
│   ├── src/
│   ├── package.json
│   └── README.md
└── README.md          # This file
```

## 🚀 Quick Setup Guide

### Prerequisites
- **Node.js 16+** installed on your system
- **Chrome/Chromium browser** for the extension
- **Git** for cloning the repository
- **AWS Account** (optional, for cloud storage)

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/aayushman-singh/tweet-extractor.git
cd tweet-extractor

# Install dependencies for all components
cd api && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Environment Configuration

#### API Setup
```bash
cd api
cp .env.example .env
# Edit .env with your AWS credentials and other settings
```

Required environment variables:
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `S3_BUCKET_NAME` - Your S3 bucket name
- `JWT_SECRET` - Secret key for JWT tokens
- `MONGODB_URI` - MongoDB connection string (optional)

#### Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env with your API domain
```

Required environment variables:
- `VITE_API_BASE_URL` - Your deployed API URL

### 3. Deploy Components

#### Deploy API (Backend)
```bash
cd api
npm start  
```

#### Deploy Frontend
```bash
cd frontend
npm run dev
```

### 4. Configure Extension
1. Update API endpoint in extension files:
   - `extension/working.js` - Update `apiBase` parameter
   - `extension/popup.js` - Update `API_BASE` URL
   - `extension/manifest.json` - Update `host_permissions`

2. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` folder

### 5. Test the Setup
1. Navigate to any Twitter/X profile
2. Click the Tweet Extractor extension icon
3. Select tweet count and extraction options
4. Verify upload to your configured cloud storage



## ✨ Features

### Chrome Extension
- 🐦 **Tweet Extraction** - Extract tweets from any X/Twitter profile
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

### Frontend
- 🔐 **User Authentication** - Secure login and registration
- 📊 **Dashboard** - View and manage your tweet archives
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Modern UI** - Built with React and Tailwind CSS

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

### Frontend
- Node.js 16+
- Modern web browser
- API endpoint configured

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

### Frontend Configuration
Create `.env` file:
```env
VITE_API_BASE_URL=https://your-api-domain.com
```

## 📊 Output Examples

### Generated URLs
- `https://your-domain.com/report1704123456.html`
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
1. **AWS (Recommended):**
   ```bash
   cd api && serverless deploy
   ```

2. **Netlify:**
   ```bash
   cd api && netlify deploy
   ```

3. **AWS Lambda:**
   ```bash
   cd api && vercel
   ```

### Frontend
1. **Vercel (Recommended):**
   ```bash
   cd frontend && vercel
   ```

2. **Netlify:**
   ```bash
   cd frontend && netlify deploy --prod --dir=dist
   ```

## 🔒 Security

- **Extension**: Runs only on X/Twitter domains
- **API**: CORS restricted to extension origins
- **S3**: Public read access for generated reports only
- **Credentials**: Environment-based AWS configuration
- **Frontend**: JWT-based authentication

## 📝 License

MIT License - see LICENSE.txt for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes in appropriate folder (`extension/`, `api/`, or `frontend/`)
4. Test thoroughly
5. Submit pull request

## 📞 Support

For issues or questions:
- Create an issue in this repository
- Check the README files in `extension/`, `api/`, or `frontend/` folders

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