const fs = require('fs');
const path = require('path');

function convertFirebaseToSupabase(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already converted
    if (content.includes('supabaseAdmin')) return;
    
    // Replace imports
    content = content.replace(/    content = content.replace(/\/\/ Firebase removed - using Supabase\n/g, '');
    
    // Add Supabase import if not present
    if (!content.includes('supabaseAdmin')) {
      content = content.replace(
        /import { NextResponse.*\n/,
        `import { NextResponse } from 'next/server';\nimport { supabaseAdmin } from '@/lib/supabase';\n`
      );
    }
    
    // Replace Firebase functions with Supabase equivalents
    content = content.replace(/collection\(db,\s*["'](\w+)["']\)/g, 'supabaseAdmin.from("$1")');
    content = content.replace(/doc\(db,\s*["'](\w+)["'],\s*(\w+)\)/g, 'supabaseAdmin.from("$1").select().eq("id", $2)');
    content = content.replace(/getDocs\(/g, 'supabaseAdmin.select("*").then(({data}) => ({docs: data?.map(d => ({id: d.id, data: () => d})) || []})).then(snap => ');
    content = content.replace(/addDoc\([^,]+,\s*/g, 'supabaseAdmin.insert(');
    content = content.replace(/updateDoc\([^,]+,\s*/g, 'supabaseAdmin.update(');
    content = content.replace(/deleteDoc\([^)]+\)/g, 'supabaseAdmin.delete().eq("id", id)');
    content = content.replace(/serverTimestamp\(\)/g, 'new Date().toISOString()');
    
    // Add null checks
    if (!content.includes('if (!supabaseAdmin)')) {
      content = content.replace(
        /try \{/,
        `try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }`
      );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Converted: ${filePath}`);
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      convertFirebaseToSupabase(filePath);
    }
  });
}

// Convert all inventory routes
walkDir('./src/app/api/inventory');
console.log('Inventory routes conversion complete!');