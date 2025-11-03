#!/usr/bin/env bash
# TryForge Auto-Completion Uninstallation Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🗑️  TryForge Completion Uninstaller${NC}\n"

# Detect shell
detect_shell() {
    if [ -n "$BASH_VERSION" ]; then
        echo "bash"
    elif [ -n "$ZSH_VERSION" ]; then
        echo "zsh"
    elif [ -n "$FISH_VERSION" ]; then
        echo "fish"
    else
        case "$SHELL" in
            */bash) echo "bash" ;;
            */zsh) echo "zsh" ;;
            */fish) echo "fish" ;;
            *) echo "unknown" ;;
        esac
    fi
}

SHELL_TYPE=$(detect_shell)

if [ "$SHELL_TYPE" = "unknown" ]; then
    echo -e "${RED}✗ Could not detect shell type${NC}"
    echo -e "  Please use: ${YELLOW}tryforge completion uninstall [bash|zsh|fish]${NC}\n"
    exit 1
fi

echo -e "Detected shell: ${GREEN}$SHELL_TYPE${NC}\n"

# Use TryForge CLI to uninstall
if command -v tryforge >/dev/null 2>&1; then
    echo -e "${CYAN}Uninstalling completion using TryForge CLI...${NC}\n"
    tryforge completion uninstall "$SHELL_TYPE"
else
    echo -e "${YELLOW}⚠ TryForge CLI not found in PATH${NC}"
    echo -e "  Attempting manual uninstallation...\n"

    # Manual uninstallation
    case "$SHELL_TYPE" in
        bash)
            rm -f "$HOME/.bash_completion.d/tryforge-completion.bash"
            rm -f "$HOME/tryforge-completion.bash"
            echo -e "${GREEN}✓ Removed Bash completion script${NC}"
            ;;
        zsh)
            rm -f "$HOME/.zsh/completion/_tryforge"
            echo -e "${GREEN}✓ Removed Zsh completion script${NC}"
            ;;
        fish)
            rm -f "$HOME/.config/fish/completions/tryforge.fish"
            echo -e "${GREEN}✓ Removed Fish completion script${NC}"
            ;;
    esac
fi

echo -e "\n${GREEN}✓ Uninstallation complete!${NC}"
echo -e "  Restart your terminal for changes to take effect\n"
