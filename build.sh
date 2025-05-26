#!/bin/bash

echo "🚀 Starting build process..."

# Try to install Rollup Linux dependency
echo "📦 Attempting to install Rollup Linux dependency..."
npm install @rollup/rollup-linux-x64-gnu@latest --no-save || echo "⚠️  Rollup install failed, continuing..."

# Compile TypeScript
echo "📝 Compiling TypeScript..."
npx tsc -b

# Build with Vite
echo "📦 Building with Vite..."
npx vite build

echo "✅ Build completed successfully!" 