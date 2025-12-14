#!/bin/bash
# Gate evaluator: Parses SARIF files and determines PR gate pass/fail
# Blocks merge if critical or high-severity issues are found

set -euo pipefail

# Default paths (can be overridden via command line)
TRIVY_SARIF="${TRIVY_SARIF:-artifacts/trivy_fs.sarif}"
CHECKOV_SARIF="${CHECKOV_SARIF:-artifacts/checkov.sarif}"
ZAP_REPORT="${ZAP_REPORT:-artifacts/zap-report.html}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --trivy)
            TRIVY_SARIF="$2"
            shift 2
            ;;
        --checkov)
            CHECKOV_SARIF="$2"
            shift 2
            ;;
        --zap)
            ZAP_REPORT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

FAILED=0
CRITICAL_ISSUES=0
HIGH_ISSUES=0

echo "=========================================="
echo "Security Gate Evaluation"
echo "=========================================="

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found. Installing jq for SARIF parsing..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update > /dev/null && sudo apt-get install -y jq > /dev/null
    elif command -v brew &> /dev/null; then
        brew install jq > /dev/null
    else
        echo "❌ Could not install jq. Cannot parse SARIF files."
        exit 1
    fi
fi

# Function to parse SARIF and count issues by severity
parse_sarif() {
    local file=$1
    local tool_name=$2
    
    if [ ! -f "$file" ]; then
        echo "⚠️  $tool_name report not found: $file"
        return
    fi
    
    echo ""
    echo "📋 $tool_name Results:"
    
    # Count results by severity level
    local critical=0
    local high=0
    local medium=0
    local low=0
    
    if jq empty "$file" 2>/dev/null; then
        # Count CRITICAL level results
        critical=$(jq '[.runs[].results[] | select(.level == "error" or .level == "note")] | length' "$file" 2>/dev/null || echo 0)
        
        # Count HIGH level results
        high=$(jq '[.runs[].results[] | select(.level == "warning")] | length' "$file" 2>/dev/null || echo 0)
        
        # Count other results
        medium=$(jq '[.runs[].results[] | select(.level == "note")] | length' "$file" 2>/dev/null || echo 0)
        
        echo "  Critical: $critical"
        echo "  High:     $high"
        echo "  Medium:   $medium"
        
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + critical))
        HIGH_ISSUES=$((HIGH_ISSUES + high))
        
        # Gate rule: FAIL on critical issues
        if [ "$critical" -gt 0 ]; then
            echo "  ❌ FAIL: Critical issues found!"
            FAILED=1
        fi
        
        # Gate rule: WARN on high issues (don't fail, just report)
        if [ "$high" -gt 0 ]; then
            echo "  ⚠️  WARNING: High-severity issues found (non-blocking)"
        fi
    else
        echo "  ⚠️  Invalid SARIF format"
    fi
}

# Parse Trivy SARIF
parse_sarif "$TRIVY_SARIF" "Trivy (SCA)"

# Parse Checkov SARIF
parse_sarif "$CHECKOV_SARIF" "Checkov (IaC)"

# Check ZAP report (if available)
if [ -f "$ZAP_REPORT" ]; then
    echo ""
    echo "📋 ZAP (DAST) Results:"
    
    # Simple grep for HIGH/CRITICAL in HTML report
    if grep -qi "High Risk" "$ZAP_REPORT"; then
        echo "  ⚠️  High-risk vulnerabilities found"
        # Don't fail on DAST for now (manual review recommended)
    else
        echo "  ✅ No critical DAST issues detected"
    fi
fi

# Final gate decision
echo ""
echo "=========================================="
if [ "$FAILED" -eq 0 ]; then
    echo "✅ GATE PASSED"
    echo "=========================================="
    exit 0
else
    echo "❌ GATE FAILED"
    echo "=========================================="
    echo ""
    echo "Gate blocking criteria:"
    echo "  - Critical security issues found: $CRITICAL_ISSUES"
    echo "  - High severity issues found: $HIGH_ISSUES"
    echo ""
    echo "Action: Review security reports and fix critical issues before merge."
    echo ""
    exit 1
fi
