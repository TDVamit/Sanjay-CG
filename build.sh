#!/bin/bash

echo "🚀 Starting build process..."

# Set environment variables for native dependencies
export ROLLUP_NO_NATIVE=true

# Build with Vite (includes TypeScript compilation)
echo "📦 Building with Vite..."
npx vite build

echo "✅ Build completed successfully!" 