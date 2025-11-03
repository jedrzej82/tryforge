#!/usr/bin/env bash
# TryForge Auto-Completion Installation Script
# This script installs shell completion for TryForge CLI

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔥 TryForge Completion Installer${NC}\n"

# Detect shell
detect_shell() {
    if [ -n "$BASH_VERSION" ]; then
        echo "bash"
    elif [ -n "$ZSH_VERSION" ]; then
        echo "zsh"
    elif [ -n "$FISH_VERSION" ]; then
        echo "fish"
    else
        # Fallback to SHELL environment variable
        case "$SHELL" in
            */bash)
                echo "bash"
                ;;
            */zsh)
                echo "zsh"
                ;;
            */fish)
                echo "fish"
                ;;
            *)
                echo "unknown"
                ;;
        esac
    fi
}

SHELL_TYPE=$(detect_shell)

if [ "$SHELL_TYPE" = "unknown" ]; then
    echo -e "${RED}✗ Could not detect shell type${NC}"
    echo -e "  Please use: ${YELLOW}tryforge completion install [bash|zsh|fish]${NC}\n"
    exit 1
fi

echo -e "Detected shell: ${GREEN}$SHELL_TYPE${NC}\n"

# Use TryForge CLI to install
if command -v tryforge >/dev/null 2>&1; then
    echo -e "${CYAN}Installing completion using TryForge CLI...${NC}\n"
    tryforge completion install "$SHELL_TYPE"
else
    echo -e "${YELLOW}⚠ TryForge CLI not found in PATH${NC}"
    echo -e "  Please install TryForge first or add it to your PATH\n"
    exit 1
fi

echo -e "\n${GREEN}✓ Installation complete!${NC}"
echo -e "  Restart your terminal or source your RC file to activate completion\n"
