# 🚀 Frontend Deployment Guide

## **Option 1: Deploy Static HTML (Current)**

### **Vercel Deployment (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Follow prompts:
# - Link to existing project: No
# - Project name: tweet-extractor-frontend
# - Directory: ./
# - Override settings: No
```

### **Netlify Deployment**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy from frontend directory
cd frontend
netlify deploy --prod --dir=.
```

### **GitHub Pages**
```bash
# Add to package.json
{
  "homepage": "https://yourusername.github.io/tweet-extractor",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}

# Install gh-pages
npm install --save-dev gh-pages

# Deploy
npm run deploy
```

## **Option 2: Deploy React/TypeScript (Recommended)**

### **Setup React Project**
```bash
cd frontend
npm install
```

### **Environment Variables**
Create `.env` file:
```env
VITE_API_BASE_URL=https://extractor.aayushman.dev
```

### **Build and Deploy**
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=dist
```

## **Option 3: Manual Deployment**

### **Build Process**
```bash
# For React/TypeScript
npm run build

# For static HTML
# Files are ready to deploy
```

### **Upload to Web Server**
1. Upload `dist/` folder (React) or all HTML files (static)
2. Configure web server (Apache/Nginx)
3. Set up SSL certificate

## **Domain Configuration**

### **DNS Settings**
```
Type: CNAME
Name: @
Value: your-deployment-url.vercel.app
```

### **Custom Domain (Vercel)**
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Domains
4. Add: `extractor.aayushman.dev`

## **Performance Optimization**

### **For Static HTML**
- Enable Gzip compression
- Set cache headers
- Minify CSS/JS

### **For React/TypeScript**
- Code splitting
- Lazy loading
- Image optimization
- Service worker (PWA)

## **Monitoring**

### **Analytics**
- Google Analytics
- Vercel Analytics
- Sentry for error tracking

### **Performance**
- Lighthouse CI
- Web Vitals monitoring
- Core Web Vitals

## **Security**

### **Headers**
```nginx
# Nginx configuration
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### **CSP (Content Security Policy)**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;">
```

## **CI/CD Pipeline**

### **GitHub Actions**
```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## **Troubleshooting**

### **Common Issues**
1. **CORS Errors**: Check API_BASE_URL configuration
2. **Build Failures**: Check TypeScript errors
3. **Deployment Failures**: Check environment variables
4. **Domain Issues**: Verify DNS settings

### **Debug Commands**
```bash
# Check build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Local development
npm run dev
```

## **Recommended Stack**

### **For Production**
- **Hosting**: Vercel (best for React)
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics
- **Monitoring**: Sentry
- **Domain**: Your custom domain

### **For Development**
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Package Manager**: npm/yarn
- **Linting**: ESLint + Prettier 