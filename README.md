# Sanjay - Career Guidance

A Computer Science Career Counseling application built with React, TypeScript, and Tailwind CSS. The app provides personalized career guidance through an interactive questionnaire and AI-powered recommendations with PDF career guides.

## 🚀 Features

- **Interactive Questionnaire**: 30 questions across 6 categories
- **AI-Powered Recommendations**: OpenAI integration for personalized career guidance
- **PDF Career Guides**: Comprehensive career roadmaps for different CS specializations
- **Modern UI**: Black theme with neon cyan/purple effects
- **Responsive Design**: Works on desktop and mobile devices
- **Form Validation**: Real-time validation with error handling

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **Build Tool**: Vite 6
- **PDF Viewer**: @react-pdf-viewer
- **AI Integration**: OpenAI GPT-4o
- **Deployment**: Vercel with GitHub Actions CI/CD

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/TDVamit/Sanjay-CG.git
cd Sanjay-CG/sanjay-cg

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

## 🔧 Build Scripts

- `npm run dev` - Start development server
- `npm run build` - Build using custom script (recommended)
- `npm run build:original` - Standard TypeScript + Vite build
- `npm run build:fallback` - Fallback build for CI/CD environments
- `npm run preview` - Preview production build locally

## 🚀 Deployment

### Vercel Deployment

The project is configured for automatic deployment to Vercel with the following setup:

#### 1. Vercel Configuration (`vercel.json`)
```json
{
  "framework": "vite",
  "buildCommand": "npm run build:fallback",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps"
}
```

#### 2. GitHub Actions CI/CD (`.github/workflows/deploy.yml`)
- Automatic deployment on push to `main` branch
- Handles Rollup dependency issues
- Uses Node.js 18 with npm caching

#### 3. Environment Variables
Set these in your Vercel dashboard:
- `VERCEL_TOKEN` - Your Vercel API token
- `ORG_ID` - Your Vercel organization ID
- `PROJECT_ID` - Your Vercel project ID

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Vercel (requires Vercel CLI)
npm run deploy
```

## 🔧 Configuration Files

### Key Configuration Files:
- `.npmrc` - npm configuration with legacy peer deps
- `vite.config.ts` - Vite build configuration
- `vercel.json` - Vercel deployment settings
- `package.json` - Dependencies and build scripts

### Rollup Issue Resolution:
The project includes multiple strategies to handle Rollup dependency issues on different platforms:

1. **Custom Build Script** (`scripts/build.js`) - Handles CI environments
2. **Fallback Build** - Cross-platform compatible build command
3. **Dependency Resolutions** - Forces specific Rollup versions
4. **Environment Variables** - Configures npm behavior

## 📁 Project Structure

```
sanjay-cg/
├── public/
│   ├── main-logo.png
│   └── pdfs/              # Career guide PDFs
├── src/
│   ├── components/
│   │   └── PDFViewer.tsx
│   ├── assets/
│   └── App.tsx
├── scripts/
│   └── build.js           # Custom build script
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions workflow
├── vercel.json            # Vercel configuration
├── vite.config.ts         # Vite configuration
└── package.json
```

## 🎨 UI Theme

- **Background**: Black (`bg-black`)
- **Cards**: Dark gray (`bg-gray-900`) with cyan neon shadows
- **Accent Colors**: Cyan (`#06b6d4`), Purple (`#8b5cf6`), Pink (`#ec4899`)
- **Typography**: White text with gray accents
- **Effects**: Neon glow shadows and gradient backgrounds

## 📋 Career Paths Supported

The application provides PDF guides for 21 different career paths:
- AI Engineer, Data Scientist, MLOps
- Frontend, Backend, Full-Stack Development
- Mobile Development (Android, iOS)
- DevOps, Cybersecurity, Blockchain
- Game Development, UX Design
- Product Management, Technical Writing
- And more...

## 🔍 Troubleshooting

### Common Issues:

1. **Rollup Build Errors on Vercel**
   - Solution: Use `npm run build:fallback` command
   - The project includes multiple fallback strategies

2. **PDF Viewer Not Loading**
   - Ensure PDFs are in the `public/pdfs/` directory
   - Check job name mapping in `App.tsx`

3. **TypeScript Compilation Errors**
   - Run `npx tsc --noEmit` to check for errors
   - Ensure all dependencies are properly installed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the build process
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Live Demo](https://your-vercel-url.vercel.app)
- [GitHub Repository](https://github.com/TDVamit/Sanjay-CG)
- [Vercel Dashboard](https://vercel.com/dashboard)

