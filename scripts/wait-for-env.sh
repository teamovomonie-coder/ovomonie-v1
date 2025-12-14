#!/bin/bash
# Wait for preview environment to become healthy
# Polls the health check endpoint until ready or timeout

set -euo pipefail

PREVIEW_URL="${1:?Preview URL required}"
MAX_RETRIES=30
RETRY_INTERVAL=10
TIMEOUT_SECONDS=$((MAX_RETRIES * RETRY_INTERVAL))

echo "Waiting for preview environment at ${PREVIEW_URL} to become healthy..."
echo "Timeout: ${TIMEOUT_SECONDS} seconds"

# Extract base URL (remove trailing slash if present)
PREVIEW_URL="${PREVIEW_URL%/}"

# Health check: Try to access root URL
for ((i=1; i<=MAX_RETRIES; i++)); do
    echo "Attempt $i/$MAX_RETRIES..."
    
    # Try to reach the preview URL
    if curl -sf "${PREVIEW_URL}" > /dev/null 2>&1; then
        echo "✅ Preview environment is healthy!"
        exit 0
    fi
    
    # Optional: Check a specific health endpoint if your app has one
    # if curl -sf "${PREVIEW_URL}/api/health" > /dev/null 2>&1; then
    #     echo "✅ Preview environment is healthy!"
    #     exit 0
    # fi
    
    if [ $i -lt $MAX_RETRIES ]; then
        echo "   Not ready yet. Waiting ${RETRY_INTERVAL}s before retry..."
        sleep "$RETRY_INTERVAL"
    fi
done

echo "❌ Preview environment failed to become healthy after ${TIMEOUT_SECONDS} seconds"
exit 1
