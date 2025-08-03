# 🚀 Start Local API Server

To run the API locally and test the extension:

## 1. Install Dependencies
```bash
cd api
npm install
```

## 2. Set Environment Variables
Create a `.env` file in the `api` directory:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MONGODB_URI=your-mongodb-connection-string
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your-s3-bucket-name
```

## 3. Start the Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## 4. Update Extension Configuration
In `extension/popup.js`, change:
```javascript
const API_BASE = 'http://localhost:3000';
```

## 5. Test the Extension
The extension should now work with your local API server.