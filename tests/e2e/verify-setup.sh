#!/bin/bash

# TryForge E2E Testing Setup Verification Script
# Run this script to verify your E2E testing setup is complete

echo "🔍 Verifying TryForge E2E Testing Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2 (NOT FOUND)"
        ((FAILED++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2 (NOT FOUND)"
        ((FAILED++))
    fi
}

# Function to check command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2 (NOT INSTALLED)"
        ((FAILED++))
    fi
}

echo "📂 Checking Directory Structure..."
check_dir "tests/e2e" "tests/e2e/ directory"
check_dir "tests/e2e/utils" "tests/e2e/utils/ directory"
check_dir "tests/e2e/fixtures" "tests/e2e/fixtures/ directory"
echo ""

echo "📄 Checking Configuration Files..."
check_file "playwright.config.js" "playwright.config.js"
check_file ".github/workflows/e2e-tests.yml" "GitHub Actions workflow"
check_file "tests/e2e/.env.example" "Environment template"
echo ""

echo "🧪 Checking Test Files..."
check_file "tests/e2e/admin-panel.test.js" "Admin Panel tests"
check_file "tests/e2e/generated-react-app.test.js" "React App tests"
check_file "tests/e2e/generated-nextjs-app.test.js" "Next.js App tests"
check_file "tests/e2e/accessibility.test.js" "Accessibility tests"
check_file "tests/e2e/performance.test.js" "Performance tests"
check_file "tests/e2e/security.test.js" "Security tests"
check_file "tests/e2e/visual-regression.test.js" "Visual Regression tests"
check_file "tests/e2e/cross-browser.test.js" "Cross-Browser tests"
check_file "tests/e2e/cli-integration.test.js" "CLI Integration tests"
echo ""

echo "🛠️  Checking Utility Files..."
check_file "tests/e2e/utils/test-helpers.js" "Test helpers"
check_file "tests/e2e/utils/test-setup.js" "Test setup/teardown"
check_file "tests/e2e/fixtures/test-data.json" "Test fixtures"
echo ""

echo "📚 Checking Documentation..."
check_file "tests/e2e/README.md" "Main documentation"
check_file "tests/e2e/QUICK_START.md" "Quick start guide"
check_file "tests/e2e/TEST_SUMMARY.md" "Test summary"
echo ""

echo "📦 Checking Node.js Dependencies..."
if [ -f "package.json" ]; then
    if grep -q "@playwright/test" package.json; then
        echo -e "${GREEN}✓${NC} @playwright/test in package.json"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} @playwright/test missing from package.json"
        ((FAILED++))
    fi

    if grep -q "axe-playwright" package.json; then
        echo -e "${GREEN}✓${NC} axe-playwright in package.json"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} axe-playwright missing from package.json"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} package.json not found"
    ((FAILED++))
fi
echo ""

echo "🔧 Checking System Commands..."
check_command "node" "Node.js"
check_command "npm" "npm"
echo ""

echo "📊 Checking package.json Scripts..."
if [ -f "package.json" ]; then
    if grep -q "test:e2e" package.json; then
        echo -e "${GREEN}✓${NC} test:e2e script exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} test:e2e script missing"
        ((FAILED++))
    fi

    if grep -q "test:e2e:ui" package.json; then
        echo -e "${GREEN}✓${NC} test:e2e:ui script exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} test:e2e:ui script missing"
        ((FAILED++))
    fi
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Install dependencies: npm install"
    echo "   2. Install Playwright browsers: npx playwright install"
    echo "   3. Run tests: npm run test:e2e:ui"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some checks failed!${NC}"
    echo ""
    echo "Please review the failures above and ensure all files are in place."
    echo ""
    exit 1
fi
