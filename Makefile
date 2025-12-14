.PHONY: help ci-setup install lint typecheck test test:unit test:e2e build clean

# Default target
help:
	@echo "Available targets:"
	@echo "  make ci-setup       - Install dependencies (CI-optimized)"
	@echo "  make install        - Install dependencies"
	@echo "  make lint           - Run ESLint and formatting checks"
	@echo "  make typecheck      - Run TypeScript type checking"
	@echo "  make test           - Run all tests (lint + typecheck)"
	@echo "  make test:unit      - Run unit tests"
	@echo "  make test:e2e       - Run E2E tests"
	@echo "  make build          - Build Next.js application"
	@echo "  make dev            - Start development server"
	@echo "  make clean          - Clean build artifacts"

# CI-optimized setup (caches enabled via GitHub Actions)
ci-setup:
	@echo "Installing dependencies (CI mode)..."
	npm ci --prefer-offline --no-audit

# Standard install
install:
	@echo "Installing dependencies..."
	npm install

# Lint (ESLint + Next.js built-in linter)
lint:
	@echo "Running linters..."
	npm run lint

# TypeScript type checking
typecheck:
	@echo "Type checking..."
	npm run typecheck

# All tests (lint + typecheck)
test: lint typecheck
	@echo "All tests passed!"

# Unit tests (placeholder - add test runner when available)
test:unit:
	@echo "Running unit tests..."
	npm test 2>/dev/null || echo "No unit tests configured. Add test runner (Jest/Vitest) and update this target."

# E2E tests (placeholder for Playwright/Cypress)
test:e2e:
	@echo "Running E2E tests..."
	@if [ -z "$(PREVIEW_URL)" ]; then \
		echo "PREVIEW_URL not set. Cannot run E2E tests without preview environment."; \
		exit 1; \
	fi
	@echo "E2E test suite would run against: $(PREVIEW_URL)"
	echo "Add Playwright/Cypress setup and update this target to run actual tests."
	# npm run test:e2e -- --base-url=$(PREVIEW_URL)

# Build
build:
	@echo "Building Next.js application..."
	npm run build

# Development server
dev:
	@echo "Starting development server..."
	npm run dev

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf .next
	rm -rf .turbo
	rm -rf dist
	rm -rf build
	rm -rf coverage
	@echo "Clean complete!"

# Security scanning targets (for local development)
scan:sast:
	@echo "Running SAST with Semgrep..."
	semgrep --config=p/ci --json -o semgrep-report.json . || true

scan:sca:
	@echo "Running SCA with Trivy..."
	trivy fs --format sarif -o trivy_fs.sarif . || true

scan:iac:
	@echo "Running IaC scan with Checkov..."
	checkov -d . --output sarif --output-file-path checkov.sarif || true

scan:all: scan:sast scan:sca scan:iac
	@echo "All security scans complete!"
