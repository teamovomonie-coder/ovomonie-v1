const fs = require('fs');
const path = require('path');

function replaceFirebaseInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Replace Firebase imports
    if (content.includes("from '@/lib/firebase'")) {
      content = content.replace(/      content = content.replace(/      changed = true;
    }
    
    if (content.includes("from '@/lib/firebaseAdmin'")) {
      content = content.replace(/      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Get all TypeScript files in src/app/api
function getAllTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const files = getAllTsFiles(apiDir);

files.forEach(file => {
  replaceFirebaseInFile(file);
});

console.log('Firebase removal complete!');