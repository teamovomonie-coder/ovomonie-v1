#!/bin/bash
# Create ephemeral preview environment for PR testing
# This script creates a temporary deployment for the PR

set -euo pipefail

GITHUB_REF="${GITHUB_REF:-main}"
GITHUB_PR_NUMBER="${GITHUB_EVENT_PR_NUMBER:-local}"
PREVIEW_NAME="preview-${GITHUB_PR_NUMBER}"
TIMESTAMP=$(date +%s)

echo "Creating preview environment: ${PREVIEW_NAME}"

# Option 1: Use Vercel for Next.js preview (requires Vercel CLI and token)
# This is the recommended approach for Next.js applications
if command -v vercel &> /dev/null; then
    echo "Deploying to Vercel preview..."
    VERCEL_URL=$(vercel --prod --token "${VERCEL_TOKEN:-}" --name "${PREVIEW_NAME}" 2>/dev/null || echo "")
    if [ -n "$VERCEL_URL" ]; then
        echo "https://${VERCEL_URL}"
        exit 0
    fi
fi

# Option 2: Use GitHub Pages or custom preview server
# For local development or custom infrastructure
echo "Deploying to local preview server..."

# Build the application
npm run build

# Create a temporary directory for the preview
PREVIEW_DIR="/tmp/${PREVIEW_NAME}"
mkdir -p "$PREVIEW_DIR"

# Copy built application
cp -r .next "$PREVIEW_DIR/"
cp -r public "$PREVIEW_DIR/" 2>/dev/null || true
cp package.json "$PREVIEW_DIR/"
cp package-lock.json "$PREVIEW_DIR/" 2>/dev/null || true

# Start the preview server on a random port
PORT=$((3000 + RANDOM % 1000))
cd "$PREVIEW_DIR"
npm ci --omit=dev --silent
npm start &
PREVIEW_PID=$!

# Wait for server to start
sleep 5

# Check if server is running
if ! kill -0 $PREVIEW_PID 2>/dev/null; then
    echo "Failed to start preview server"
    exit 1
fi

# Output preview URL
echo "http://localhost:${PORT}"

# Save PID for cleanup
echo "$PREVIEW_PID" > "/tmp/${PREVIEW_NAME}.pid"

exit 0
