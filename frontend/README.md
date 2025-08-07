# Tweet Extractor Frontend

A modern React/TypeScript frontend for the Tweet Extractor application, providing user authentication, dashboard, and report management capabilities.

## Features

- 🔐 **User Authentication** - Secure login and registration system
- 📊 **Dashboard** - View and manage your tweet archives
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎨 **Modern UI** - Built with React, TypeScript, and Tailwind CSS
- 🔍 **Report Viewer** - Interactive tweet archive viewing with sorting and filtering
- 📄 **Export Options** - Download reports in various formats
- 🔒 **Protected Routes** - Secure access to user-specific content

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Context API
- **HTTP Client**: Axios
- **UI Components**: Custom components with shadcn/ui
- **Routing**: React Router DOM
- **Authentication**: JWT tokens

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- API endpoint configured

### Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file:
   ```env
   VITE_API_BASE_URL=https://your-api-domain.com
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   └── ProtectedRoute.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── use-toast.ts
│   ├── lib/                # Utility functions
│   │   └── utils.ts
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Privacy.tsx
│   │   ├── ReportViewer.tsx
│   │   └── Signup.tsx
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Pages

### Home (`/`)
Landing page with feature overview and call-to-action buttons.

### Login (`/login`)
User authentication page with form validation.

### Signup (`/signup`)
User registration page with password requirements.

### Dashboard (`/dashboard`)
Main dashboard for managing tweet archives:

- **Archive Management**: View, download, and delete archives
- **Statistics**: Real-time counts and file sizes
- **Responsive Grid**: Archive cards with metadata and actions
- **Quick Actions**: Navigate to individual report viewers

Protected page showing user's tweet archives with management options.

### Report Viewer (`/report/:id`)
Protected page for viewing individual tweet archives with advanced filtering capabilities:

- **Date Range Filter**: Filter tweets by creation date with:
  - Quick preset buttons (Today, Yesterday, Last 7 Days, Last 30 Days, Last 3 Months)
  - Custom date range picker with start and end dates
  - Apply/Clear buttons for better control
  - URL-based state management for shareable filters
  - Real-time tweet count updates based on filtered results

**URL Sharing**: Date filters are automatically saved in the URL, making them shareable:
- Example: `/report/123?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z`
- Users can bookmark filtered views
- Direct links to specific date ranges work seamlessly

- **Text Search**: Search tweets by content
- **Sorting Options**: Sort by newest, oldest, likes, retweets, views, or engagement
- **Tweet Analytics**: View metrics for each tweet
- **Export Options**: Download the filtered report

### Privacy (`/privacy`)
Privacy policy and data handling information.

## Components

### UI Components
Built with shadcn/ui for consistent design:
- Button
- Card
- Dialog
- Form
- Input
- Label
- Toast

### Custom Components
- **ProtectedRoute**: Wrapper for authenticated routes
- **AuthContext**: Global authentication state management

## Authentication

The frontend uses JWT-based authentication:

1. **Login/Signup**: User credentials are sent to the API
2. **Token Storage**: JWT token is stored in localStorage
3. **Protected Routes**: Routes check for valid token
4. **Auto-logout**: Token expiration handling

## API Integration

The frontend communicates with the backend API for:

- User authentication (login/signup)
- Report management (list, download, delete)
- User profile management

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: Consistent design system
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Ready for future implementation

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Environment Variables

- `VITE_API_BASE_URL`: Backend API endpoint

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Consistent component structure

## Deployment

### Vercel (Recommended)

1. **Connect repository to Vercel**
2. **Set environment variables**
3. **Deploy automatically on push**

### Netlify

1. **Build command**: `npm run build`
2. **Publish directory**: `dist`
3. **Set environment variables**

### Manual Deployment

1. **Build the project**: `npm run build`
2. **Upload `dist/` folder to web server**
3. **Configure web server for SPA routing**

## Configuration

### Vite Configuration
- React plugin
- TypeScript support
- Environment variable handling
- Build optimization

### Tailwind Configuration
- Custom color palette
- Component variants
- Responsive breakpoints

### TypeScript Configuration
- Strict type checking
- Path aliases
- React JSX support

## Security

- JWT token validation
- Protected route implementation
- Secure API communication
- Input validation and sanitization

## Performance

- Code splitting with React.lazy
- Optimized bundle size
- Image optimization
- Caching strategies

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test on multiple browsers
4. Ensure responsive design
5. Update documentation as needed 