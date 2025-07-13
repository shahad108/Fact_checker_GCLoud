# Wahrify Frontend

This folder contains the complete frontend application for Wahrify - a fact-checking and claim verification platform.

## 🚀 Features

- **Auto-resizing textarea** - ChatGPT-like input that grows as you type
- **Real-time claim analysis** - Submit claims for AI-powered fact checking
- **Progress indicators** - Visual feedback during analysis
- **Responsive design** - Works on desktop and mobile
- **Firebase hosting** - Deployed on Firebase with CDN

## 📁 Structure

```
frontend/
├── client/                     # React application source code
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # Base UI components (buttons, inputs, etc.)
│   │   │   └── ...           # Feature-specific components
│   │   ├── pages/            # Application pages
│   │   ├── lib/              # Utilities and API client
│   │   └── hooks/            # Custom React hooks
│   ├── index.html            # HTML entry point
│   └── public/               # Static assets
├── shared/                    # Shared types and schemas
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite build configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── firebase.json             # Firebase hosting configuration
├── .env.production           # Production environment variables
└── README.md                 # This file
```

## 🛠 Setup & Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase CLI (for deployment)

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
This starts the development server at `http://localhost:3000`

### Build
```bash
npm run build
```
Builds the application for production in the `dist/` folder.

## 🔧 Configuration

### Environment Variables
- `VITE_BACKEND_URL` - Backend API URL (set in `.env.production`)
- `NODE_ENV` - Environment mode (development/production)

### Firebase Configuration
- `firebase.json` - Hosting and deployment settings
- `.firebaserc` - Firebase project configuration

## 🚀 Deployment

### Firebase Hosting
```bash
# Build for production
VITE_BACKEND_URL=https://your-backend-url npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Manual Deployment
1. Build the application: `npm run build`
2. Upload the `dist/` folder contents to your hosting provider
3. Ensure proper routing for SPA (single page application)

## 🔗 Backend Integration

The frontend connects to the backend API at the URL specified in `VITE_BACKEND_URL`:
- **Development**: `http://localhost:8001` 
- **Production**: `https://wahrify-backend-1010886348729.europe-west1.run.app`

### API Endpoints Used
- `POST /v1/claims/analyze-test` - Submit claim for analysis
- `GET /v1/health` - Backend health check

## 🎨 Key Components

### AutoResizeTextarea
Custom textarea component that:
- Auto-expands as you type (1-8 lines)
- Shows scroll after 8 lines
- Supports word wrapping
- ChatGPT-like behavior

### ProgressCircle 
Animated progress indicator for claim analysis with:
- Percentage display
- Smooth animations
- Individual state management

### Fact Checker Page
Main application page featuring:
- Auto-resizing claim input
- Real-time analysis progress
- Results display with reliability scores
- Source citations and credibility ratings

## 🔧 Recent Fixes

### Auto-Resize Textarea Implementation
- ✅ Fixed CSS class conflicts
- ✅ Implemented proper word wrapping
- ✅ Added line-by-line growth (1-8 lines)
- ✅ Added scroll functionality after 8 lines
- ✅ Removed conflicting base component issues

### Progress Indicator Fixes
- ✅ Fixed cascading progress issue
- ✅ Individual claim state management
- ✅ Proper message replacement logic
- ✅ No interference between multiple claims

### Backend Connection
- ✅ Firebase hosting compatibility
- ✅ Direct API calls (no proxy needed)
- ✅ CORS configuration
- ✅ Environment variable loading

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Common Issues

**Backend Connection Errors:**
- Check `VITE_BACKEND_URL` in environment variables
- Ensure backend is running and accessible
- Clear browser cache after deployment

**Build Failures:**
- Run `npm install` to update dependencies
- Check Node.js version (18+ required)
- Delete `node_modules` and reinstall if needed

**Deployment Issues:**
- Ensure Firebase CLI is authenticated: `firebase login`
- Check project configuration: `firebase projects:list`
- Verify build output in `dist/` folder

## 📄 License

**PROPRIETARY SOFTWARE - ALL RIGHTS RESERVED**

© 2024 Wahrify.de - All Rights Reserved.

This software is the exclusive property of Wahrify.de and is protected by copyright laws and international treaty provisions. No part of this software may be used, reproduced, distributed, or transmitted in any form or by any means without the prior written permission of Wahrify.de.

**UNAUTHORIZED USE IS STRICTLY PROHIBITED**

Any unauthorized use, reproduction, or distribution of this software or any portion of it may result in severe civil and criminal penalties, and will be prosecuted to the fullest extent of the law.

For licensing inquiries, contact: legal@wahrify.de