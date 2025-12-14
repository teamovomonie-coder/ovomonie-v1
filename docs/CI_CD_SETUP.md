# CI/CD Setup & Configuration Guide

## Overview

This guide covers the Enterprise PR CI workflow and its dependencies.

## Components

### 1. GitHub Actions Workflow
- **File**: [.github/workflows/enterprise-pr-ci.yml](.github/workflows/enterprise-pr-ci.yml)
- **Trigger**: On every PR (open, push, reopen, label changes)
- **Jobs**:
  - `prepare` - Dependency caching, lint, type check, unit tests, SBOM
  - `codeql-scan` - GitHub CodeQL security analysis
  - `security-scans` - SAST/SCA/IaC (Semgrep, Trivy, Checkov)
  - `build-and-scan-image` - Optional Docker image build + scan
  - `integration-e2e` - Preview deployment + E2E + DAST
  - `gate` - Final verdict (blocks merge if critical issues found)

### 2. Makefile
- **File**: [Makefile](Makefile)
- **Key Targets**:
  - `make ci-setup` - Install dependencies (CI-optimized with npm ci)
  - `make lint` - Run ESLint/Next.js linter
  - `make typecheck` - Run TypeScript type checking
  - `make test:unit` - Unit tests (needs test runner configuration)
  - `make test:e2e` - E2E tests against preview URL
  - `make build` - Build Next.js application
  - `make test` - All tests (lint + typecheck)

### 3. Shell Scripts
Located in `./scripts/`:

#### create-preview.sh
Creates ephemeral preview environment for PR testing.
- **Options**:
  1. Vercel preview (recommended for Next.js) - requires `VERCEL_TOKEN` secret
  2. Local preview server (fallback)
- **Output**: Preview URL (e.g., `https://preview-123.vercel.app`)
- **Prerequisites**: Vercel CLI (optional) or Node.js

#### wait-for-env.sh
Health check script that waits for preview environment to become ready.
- **Parameters**: Preview URL
- **Behavior**:
  - Polls every 10 seconds (max 30 retries = 5 minutes timeout)
  - Returns 0 on success, 1 on timeout
  - Checks if root URL responds with HTTP 200

#### gate-evaluator.sh
Parses SARIF security reports and determines merge gate.
- **Parameters**:
  - `--trivy` - Path to Trivy SARIF report
  - `--checkov` - Path to Checkov SARIF report
  - `--zap` - Path to ZAP DAST report
- **Gate Rules**:
  - ❌ **FAIL**: Critical issues found (blocks merge)
  - ⚠️ **WARN**: High-severity issues (non-blocking, manual review)
  - ✅ **PASS**: No critical issues
- **Auto-installs**: jq (for SARIF parsing)

## Setup Instructions

### 1. GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

**Required for Preview Deployment:**
```
VERCEL_TOKEN          # Vercel API token (if using Vercel)
REGISTRY_USERNAME     # Container registry username (if using container image)
REGISTRY_PASSWORD     # Container registry password
```

**Optional for Notifications:**
```
SLACK_WEBHOOK_URL     # For CI failure notifications (optional)
GITHUB_TOKEN          # (Auto-provided by GitHub)
```

### 2. Branch Protection Rules

In repository settings, configure:
```
Settings → Branches → Branch protection rules → Add rule

Pattern: main (or your default branch)

✓ Require status checks to pass before merging:
  - prepare (all matrix combinations)
  - codeql-scan
  - security-scans
  - gate

✓ Require code reviews before merging: 1
✓ Dismiss stale reviews when new commits pushed
✓ Require branches to be up to date before merging
```

### 3. Install Local Dependencies (Optional)

For running security scans locally:

```bash
# Ubuntu/Debian
sudo apt-get install -y jq curl

# macOS
brew install jq curl

# Trivy (SCA)
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh

# Semgrep (SAST)
pip install semgrep

# Checkov (IaC)
pip install checkov

# OWASP ZAP (DAST)
brew install zaproxy  # macOS
# or download from https://www.zaproxy.org/download/
```

### 4. Local Testing

Test the workflow components locally before pushing:

```bash
# Test linting
make lint

# Test type checking
make typecheck

# Test unit tests
make test:unit

# Build application
make build

# Run security scans locally
make scan:all
```

## Workflow Behavior

### On PR Opened/Updated
1. **Prepare job** (matrix: ubuntu-latest + macos-latest, Node 18 + 20):
   - Install dependencies
   - Run linter
   - Run TypeScript check
   - Run unit tests
   - Generate SBOM
   - **Cache** results for speed

2. **CodeQL scan** (parallel, after prepare):
   - GitHub's native code analysis
   - Results appear in "Security" → "Code scanning" tab

3. **Security scans** (parallel, after prepare):
   - Semgrep (SAST) - code vulnerabilities
   - Trivy (SCA) - dependencies vulnerabilities
   - Checkov (IaC) - infrastructure as code issues
   - All results uploaded as SARIF to GitHub Security tab

4. **Build & scan image** (conditional, if labeled "build-image"):
   - Build Docker image
   - Scan with Trivy
   - Results attached as artifact

5. **Integration & E2E** (after security scans):
   - Create preview environment (Vercel or local)
   - Wait for health check
   - Run E2E tests
   - Run DAST (OWASP ZAP baseline scan)
   - Comment preview URL to PR

6. **Gate** (final, after all above):
   - Download all SARIF reports
   - Parse with `gate-evaluator.sh`
   - **Blocks merge** if critical issues found
   - Posts summary comment to PR

## Customization

### Add Unit Test Runner
```bash
# 1. Install Jest or Vitest
npm install --save-dev jest @testing-library/react

# 2. Update Makefile
# Replace the test:unit target with:
test:unit:
	npm run test -- --coverage --maxWorkers=4

# 3. Add test script to package.json
"test": "jest --coverage"
```

### Use Custom Preview Deployment
Edit `scripts/create-preview.sh` to use your deployment platform:
- **Netlify**: Use `netlify deploy --alias=pr-123`
- **AWS**: Deploy to S3/CloudFront
- **Custom**: Deploy to your own staging server

### Adjust Gate Thresholds
Edit `scripts/gate-evaluator.sh`:
```bash
# To allow high-severity issues (change line ~90):
if [ "$high" -gt 5 ]; then  # Allow up to 5 high-severity
    FAILED=1
fi
```

### Add Scheduled Scans
Create `.github/workflows/scheduled-security.yml`:
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Nightly at 2 AM UTC

jobs:
  nightly-scan:
    runs-on: ubuntu-latest
    steps:
      # Add extended security scans here
```

## Troubleshooting

### Workflow fails with "command not found: make"
- Solution: Makefile syntax assumes bash/sh. Windows runners need WSL or git bash.
- Alternative: Move Makefile targets to `.github/workflows/enterprise-pr-ci.yml` directly.

### SARIF files not found in gate job
- Ensure previous jobs upload artifacts correctly
- Check artifact names match between upload and download steps
- Verify job dependencies (needs: [...])

### Preview environment never becomes healthy
- Check preview creation logs in "create-preview" step
- Verify `wait-for-env.sh` is checking correct health endpoint
- Increase timeout from 30 retries (5 min) to 60 (10 min) if needed

### Semgrep/Trivy not installed
- CI images may be missing these tools
- Add installation steps to workflow:
```yaml
- name: Install security tools
  run: |
    pip install semgrep
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
```

### Gate allows high-severity issues when it shouldn't
- Edit `gate-evaluator.sh` to increase strictness
- Default: CRITICAL = fail, HIGH = warn
- Can adjust thresholds based on team risk tolerance

## Next Steps

1. **Push to repository**:
   ```bash
   git add .github/workflows/ Makefile scripts/
   git commit -m "feat: add enterprise CI/CD pipeline"
   git push origin feature-branch
   ```

2. **Configure GitHub secrets** (step 2 above)

3. **Enable branch protection** (step 3 above)

4. **Monitor first PR** to ensure workflow runs successfully

5. **Adjust thresholds** based on results

## Cost Considerations

- **GitHub Actions**: Free tier includes 2000 minutes/month for private repos
- **Vercel Preview**: Free with 100 deployments/month
- **Artifact storage**: 5 GB free per repository
- **Security scans**: All tools used are open-source (free)

## Security Best Practices

✅ **Enabled in this workflow**:
- Concurrency control (cancel old PR runs when new push arrives)
- Least-privilege permissions (only necessary scopes)
- Ephemeral environments (auto-deleted after tests)
- Security artifact retention (30 days default)

⚠️ **Recommended additions**:
- SARIF report retention policy
- Automated dependency updates (Dependabot)
- Release artifact signing
- Secrets scanning (GitGuardian, TruffleHog)
- SLSA provenance generation

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SARIF Format](https://sarifweb.azurewebsites.net/)
- [Semgrep Rules](https://semgrep.dev/r)
- [Trivy Documentation](https://github.com/aquasecurity/trivy)
- [Checkov Checks](https://www.checkov.io/2.Concepts/Checks/)
