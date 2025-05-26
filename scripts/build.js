#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

function runCommand(command, options = {}) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

try {
  console.log('🚀 Starting build process...');
  
  // Check environment
  const isCI = process.env.CI || process.env.VERCEL || process.env.GITHUB_ACTIONS;
  const isVercel = process.env.VERCEL;
  
  console.log(`Environment: ${isCI ? 'CI' : 'Local'} ${isVercel ? '(Vercel)' : ''}`);
  
  if (isCI) {
    console.log('🔧 CI environment detected, handling Rollup dependencies...');
    
    // Try to install the specific Rollup native dependency
    const rollupInstallSuccess = runCommand(
      'npm install @rollup/rollup-linux-x64-gnu@latest --no-save',
      { stdio: 'pipe' }
    );
    
    if (!rollupInstallSuccess) {
      console.log('⚠️  Rollup native dependency install failed, using fallback...');
      
      // Try alternative approach
      runCommand('npm install rollup@4.24.0 --no-save', { stdio: 'pipe' });
    }
  }
  
  // Run TypeScript compilation
  console.log('📝 Compiling TypeScript...');
  if (!runCommand('npx tsc -b')) {
    throw new Error('TypeScript compilation failed');
  }
  
  // Run Vite build
  console.log('📦 Building with Vite...');
  if (!runCommand('npx vite build')) {
    throw new Error('Vite build failed');
  }
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 