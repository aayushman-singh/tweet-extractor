# Contributing to Tweet Extractor

Thank you for your interest in contributing to Tweet Extractor! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project is committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and considerate of others.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment** (see below)
4. **Create a feature branch** for your changes
5. **Make your changes** following the guidelines below
6. **Test your changes** thoroughly
7. **Submit a pull request**

## Project Structure

```
tweet-extractor/
├── extension/          # Chrome Extension
│   ├── manifest.json   # Extension configuration
│   ├── popup.html      # Extension popup UI
│   ├── popup.js        # Popup logic
│   ├── content.js      # Content script
│   ├── working.js      # Core extraction logic
│   ├── background.js   # Background service worker
│   └── README.md       # Extension documentation
├── api/                # Backend API
│   ├── server.js       # Main server file
│   ├── package.json    # Dependencies
│   └── README.md       # API documentation
├── frontend/           # React/TypeScript frontend
│   ├── src/            # Source code
│   ├── package.json    # Dependencies
│   └── README.md       # Frontend documentation
├── README.md           # Main project documentation
├── CONTRIBUTING.md     # This file
└── LICENSE.txt         # License information
```

## Development Setup

### Extension Development

1. **Navigate to the extension directory:**
   ```bash
   cd extension
   ```

2. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` folder

3. **Make changes and test:**
   - Edit files in the extension directory
   - Click the refresh button on the extension in Chrome
   - Test on Twitter/X profile pages

### API Development

1. **Navigate to the API directory:**
   ```bash
   cd api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file with:
   ```env
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Frontend Development

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file with:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Contributing Guidelines

### Before You Start

1. **Check existing issues** to see if your feature/bug is already being worked on
2. **Create an issue** for new features or bugs if one doesn't exist
3. **Discuss your approach** in the issue before starting work

### What to Contribute

We welcome contributions in the following areas:

- **Bug fixes** - Fix issues reported in GitHub issues
- **Feature enhancements** - Add new functionality
- **Documentation** - Improve README files, add comments, create guides
- **Code quality** - Refactor code, improve performance, add tests
- **UI/UX improvements** - Enhance the user interface and experience

### What NOT to Contribute

- **Personal branding** - Don't add personal names, websites, or branding
- **Hardcoded URLs** - Use environment variables or configuration files
- **Sensitive data** - Don't commit API keys, passwords, or personal information
- **Large binary files** - Use Git LFS for large files if necessary

## Pull Request Process

1. **Create a descriptive title** for your pull request
2. **Provide a detailed description** of your changes
3. **Reference related issues** using `#issue-number`
4. **Include screenshots** for UI changes
5. **Test your changes** thoroughly
6. **Update documentation** if necessary
7. **Ensure all checks pass** (linting, tests, etc.)

### Pull Request Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement

## Testing
- [ ] Tested on Chrome/Chromium
- [ ] Tested on different Twitter/X profiles
- [ ] API endpoints tested
- [ ] Frontend functionality verified

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] All tests pass
```

## Code Style

### General Guidelines

- **Use meaningful variable and function names**
- **Add comments for complex logic**
- **Keep functions small and focused**
- **Follow existing code patterns**
- **Use consistent indentation and formatting**

### JavaScript/TypeScript

- **Use ES6+ features** when appropriate
- **Prefer const and let over var**
- **Use async/await** for asynchronous operations
- **Add TypeScript types** for new functions and variables
- **Use meaningful error messages**

### CSS/Styling

- **Use Tailwind CSS classes** for styling
- **Follow mobile-first responsive design**
- **Maintain consistent spacing and colors**
- **Use semantic class names**

### HTML

- **Use semantic HTML elements**
- **Include proper accessibility attributes**
- **Validate HTML structure**
- **Use descriptive alt text for images**

## Testing

### Extension Testing

- **Test on different Twitter/X profiles**
- **Verify all extraction counts work**
- **Test both local download and cloud upload**
- **Check error handling and edge cases**
- **Test on different browsers (Chrome, Edge)**

### API Testing

- **Test all endpoints** with valid and invalid data
- **Verify authentication and authorization**
- **Test file upload and download functionality**
- **Check error responses and status codes**
- **Test with different file sizes and types**

### Frontend Testing

- **Test all pages and components**
- **Verify responsive design on different screen sizes**
- **Test user authentication flow**
- **Check form validation and error handling**
- **Test navigation and routing**

## Documentation

### Code Documentation

- **Add JSDoc comments** for functions and classes
- **Include parameter and return type descriptions**
- **Document complex algorithms and business logic**
- **Add inline comments for non-obvious code**

### User Documentation

- **Update README files** when adding new features
- **Include setup and usage instructions**
- **Add troubleshooting sections**
- **Provide examples and screenshots**

### API Documentation

- **Document all endpoints** with request/response examples
- **Include authentication requirements**
- **Document error codes and messages**
- **Provide usage examples**

## Getting Help

If you need help with your contribution:

1. **Check existing documentation** in the README files
2. **Search existing issues** for similar problems
3. **Create a new issue** with a clear description
4. **Join discussions** in existing issues
5. **Ask questions** in pull request comments

## Recognition

Contributors will be recognized in:

- **GitHub contributors list**
- **Project README** (for significant contributions)
- **Release notes** for new features and fixes

Thank you for contributing to Tweet Extractor! 🐦 