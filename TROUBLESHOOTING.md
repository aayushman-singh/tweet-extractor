# 🛠️ API Login Troubleshooting Guide

## Issue: "NOT_FOUND" Error on Login

You're getting a "The page could not be found" error when trying to login. Here are the solutions:

## 🔍 **Immediate Diagnosis**

1. **Open the diagnostic tool**: Open `test-api.html` in your browser
2. **Run the tests**: Click through each test button to see what's failing
3. **Check browser console**: Look for detailed error messages

## 🚀 **Quick Solutions**

### **Solution 1: Use Local Development (Recommended)**

1. **Navigate to API directory**:
   ```bash
   cd api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file** (`.env`):
   ```env
   JWT_SECRET=development-secret-key
   MONGODB_URI=mongodb://localhost:27017/tweet-extractor
   AWS_ACCESS_KEY_ID=your-aws-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   AWS_REGION=ap-south-1
   ```

4. **Start local server**:
   ```bash
   npm start
   ```

5. **Update extension**: The extension will automatically try local API as fallback

### **Solution 2: Check Deployment**

1. **Run deployment checker**:
   ```bash
   node check-deployment.js
   ```

2. **Check Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Check if the project is deployed
   - Look for deployment errors

3. **Verify Domain**:
   - Check if `extractor.aayushman.dev` is properly configured
   - Ensure DNS is pointing to Vercel

### **Solution 3: Alternative Hosting**

If the main API is down, you can deploy to alternative platforms:

#### **Deploy to Vercel (Fresh)**:
```bash
cd api
npx vercel --prod
```

#### **Deploy to Railway**:
```bash
cd api
npx @railway/cli deploy
```

## 🔧 **Extension Configuration**

The extension now has automatic fallback:
1. Tries `https://extractor.aayushman.dev` first
2. Falls back to `http://localhost:3000` if the first fails
3. Shows clear error messages

## 📋 **Common Error Messages**

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to fetch" | Network/CORS issue | Check if API is running |
| "404 Not Found" | API not deployed | Deploy API or use local |
| "Cannot connect to server" | API down | Start local development |
| "Invalid credentials" | Wrong login details | Check email/password |

## 🆘 **Still Having Issues?**

1. **Check browser console** for detailed errors
2. **Try the diagnostic tool** (`test-api.html`)
3. **Use local development** as described above
4. **Check if you have valid login credentials**

## 📊 **API Status Check**

Run this command to check API status:
```bash
node check-deployment.js
```

This will test:
- DNS resolution
- Endpoint accessibility  
- Login functionality
- Response format

## 💡 **Development Tips**

- Always test locally first
- Check Vercel deployment logs
- Verify environment variables
- Ensure MongoDB connection works
- Test API endpoints independently

---

**Need help?** The extension now provides better error messages and automatic fallback to help you get started quickly!