const fs = require('fs');
const path = require('path');

function scanAndCleanFirebase(dir) {
  const results = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, .git
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
          walkDir(fullPath);
        }
      } else if (item.match(/\.(ts|js|tsx|jsx|json|yml|yaml|md)$/)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for Firebase references
          const firebasePatterns = [
            /firebase/i,
            /firestore/i,
            /collection\(/,
            /doc\(/,
            /getDocs\(/,
            /addDoc\(/,
            /updateDoc\(/,
            /deleteDoc\(/,
            /runTransaction\(/,
            /serverTimestamp\(/,
            /NEXT_PUBLIC_FIREBASE/,
            /firebase-admin/,
            /genkit/i
          ];
          
          const hasFirebase = firebasePatterns.some(pattern => pattern.test(content));
          
          if (hasFirebase) {
            results.push(fullPath);
            cleanFile(fullPath, content);
          }
        } catch (error) {
          console.error(`Error reading ${fullPath}:`, error.message);
        }
      }
    }
  }
  
  walkDir(dir);
  return results;
}

function cleanFile(filePath, content) {
  let cleaned = content;
  
  // Remove Firebase imports
  cleaned = cleaned.replace(/  cleaned = cleaned.replace(/  cleaned = cleaned.replace(/  cleaned = cleaned.replace(/from ['"]firebase.*['"].*\n/gi, '');
  cleaned = cleaned.replace(/from ['"]@genkit.*['"].*\n/gi, '');
  
  // Remove Firebase comments
  cleaned = cleaned.replace(/\/\/ Firebase.*\n/gi, '');
  cleaned = cleaned.replace(/\/\* Firebase.*\*\//gi, '');
  
  // Replace Firebase functions with Supabase (only if not already done)
  if (!cleaned.includes('supabaseAdmin') && cleaned.includes('collection(')) {
    // Add Supabase import if needed
    if (cleaned.includes('NextResponse') && !cleaned.includes('supabaseAdmin')) {
      cleaned = cleaned.replace(
        /import { NextResponse.*\n/,
        `import { NextResponse } from 'next/server';\nimport { supabaseAdmin } from '@/lib/supabase';\n`
      );
    }
    
    // Replace Firebase calls
    cleaned = cleaned.replace(/collection\(db,\s*['"](\w+)['"]\)/g, 'supabaseAdmin.from("$1")');
    cleaned = cleaned.replace(/doc\(db,\s*['"](\w+)['"],\s*(\w+)\)/g, 'supabaseAdmin.from("$1").select().eq("id", $2)');
    cleaned = cleaned.replace(/getDocs\(/g, 'supabaseAdmin.select("*").then(({data}) => data || []).then(items => ');
    cleaned = cleaned.replace(/addDoc\([^,]+,\s*/g, 'supabaseAdmin.insert(');
    cleaned = cleaned.replace(/updateDoc\([^,]+,\s*/g, 'supabaseAdmin.update(');
    cleaned = cleaned.replace(/deleteDoc\([^)]+\)/g, 'supabaseAdmin.delete().eq("id", id)');
    cleaned = cleaned.replace(/serverTimestamp\(\)/g, 'new Date().toISOString()');
    
    // Add null checks
    if (!cleaned.includes('if (!supabaseAdmin)') && cleaned.includes('supabaseAdmin')) {
      cleaned = cleaned.replace(
        /try \{/,
        `try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }`
      );
    }
  }
  
  // Clean up Firebase environment variables in CI
  if (filePath.includes('.yml') || filePath.includes('.yaml')) {
    cleaned = cleaned.replace(/NEXT_PUBLIC_FIREBASE_.*\n/g, '');
  }
  
  // Remove empty lines
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  if (cleaned !== content) {
    fs.writeFileSync(filePath, cleaned);
    console.log(`Cleaned: ${filePath}`);
  }
}

// Scan entire project
console.log('Scanning for Firebase references...');
const firebaseFiles = scanAndCleanFirebase('.');
console.log(`\nFound and cleaned ${firebaseFiles.length} files with Firebase references:`);
firebaseFiles.forEach(file => console.log(`  - ${file}`));

console.log('\nFirebase cleanup complete!');