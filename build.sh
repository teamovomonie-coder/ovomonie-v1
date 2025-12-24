#!/bin/bash

echo "🚀 Starting Ovomonie build process..."

# Check if required environment variables are set
if [ -z "$AUTH_SECRET" ]; then
    echo "❌ AUTH_SECRET is not set"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set"
    exit 1
fi

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running type check..."
npm run typecheck

# Run linting
echo "🧹 Running linter..."
npm run lint

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"
echo "🎉 Ready for deployment!"