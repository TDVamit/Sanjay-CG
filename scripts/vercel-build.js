#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🚀 Starting Vercel build...');

try {
  // Try to install the Rollup native dependency for Linux
  console.log('📦 Installing Rollup Linux dependency...');
  try {
    execSync('npm install @rollup/rollup-linux-x64-gnu@latest --no-save', { 
      stdio: 'pipe',
      timeout: 30000 
    });
    console.log('✅ Rollup Linux dependency installed successfully');
  } catch (error) {
    console.log('⚠️  Rollup Linux dependency install failed, continuing with fallback...');
  }

  // Compile TypeScript
  console.log('📝 Compiling TypeScript...');
  execSync('npx tsc -b', { stdio: 'inherit' });

  // Build with Vite
  console.log('📦 Building with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 