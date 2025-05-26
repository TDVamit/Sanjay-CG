#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🚀 Starting Vercel build...');

// Set environment variables for native dependencies
process.env.ROLLUP_NO_NATIVE = 'true';

try {
  // Build with Vite (includes TypeScript compilation)
  console.log('📦 Building with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 