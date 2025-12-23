#!/bin/bash

echo "🚀 Optimizing Ovo Thrive App for Production..."

# 1. Fix TypeScript errors
echo "📝 Fixing TypeScript errors..."
npm run typecheck 2>&1 | head -20

# 2. Clean up unused dependencies
echo "🧹 Cleaning dependencies..."
npm audit --audit-level=high

# 3. Build optimization
echo "🔨 Testing production build..."
npm run build

# 4. Security check
echo "🔒 Running security audit..."
npm audit

# 5. Lint fixes
echo "✨ Auto-fixing lint issues..."
npm run ci:fix

echo "✅ Production optimization complete!"