# TryForge CLI Auto-Completion - Installation Guide

## Quick Installation

The fastest way to get auto-completion working:

```bash
# Install completion for your current shell
tryforge completion install

# Test it out
tryforge <TAB>
```

That's it! Restart your terminal or source your shell RC file.

## Detailed Installation Instructions

### Bash

1. **Install:**
   ```bash
   tryforge completion install bash
   ```

2. **Reload shell:**
   ```bash
   source ~/.bashrc
   ```

3. **Test:**
   ```bash
   tryforge <TAB>
   tryforge create --framework <TAB>
   ```

### Zsh

1. **Install:**
   ```bash
   tryforge completion install zsh
   ```

2. **Reload shell:**
   ```bash
   source ~/.zshrc
   # or
   exec zsh
   ```

3. **If completion doesn't work, clear cache:**
   ```bash
   rm -f ~/.zcompdump*
   compinit
   ```

4. **Test:**
   ```bash
   tryforge <TAB>
   tryforge models:<TAB>
   ```

### Fish

1. **Install:**
   ```bash
   tryforge completion install fish
   ```

2. **Fish automatically loads completions. Restart or run:**
   ```bash
   fish_update_completions
   ```

3. **Test:**
   ```bash
   tryforge <TAB>
   tryforge graphics:<TAB>
   ```

### PowerShell (Windows)

1. **Install:**
   ```powershell
   tryforge completion install powershell
   ```

2. **Reload PowerShell:**
   ```powershell
   . $PROFILE
   ```

3. **Test:**
   ```powershell
   tryforge <TAB>
   tryforge deploy <TAB>
   ```

## Manual Installation

If you prefer to install manually or the automatic installation doesn't work:

### Bash Manual Installation

```bash
# Generate completion script
tryforge completion generate bash > ~/.bash_completion.d/tryforge-completion.bash

# Add to ~/.bashrc
echo '[ -f ~/.bash_completion.d/tryforge-completion.bash ] && source ~/.bash_completion.d/tryforge-completion.bash' >> ~/.bashrc

# Reload
source ~/.bashrc
```

### Zsh Manual Installation

```bash
# Create completion directory
mkdir -p ~/.zsh/completion

# Generate completion script
tryforge completion generate zsh > ~/.zsh/completion/_tryforge

# Add to ~/.zshrc (if not already there)
echo 'fpath=(~/.zsh/completion $fpath)' >> ~/.zshrc
echo 'autoload -Uz compinit && compinit' >> ~/.zshrc

# Reload
source ~/.zshrc
```

### Fish Manual Installation

```bash
# Create completions directory
mkdir -p ~/.config/fish/completions

# Generate completion script
tryforge completion generate fish > ~/.config/fish/completions/tryforge.fish

# Fish will auto-load it, just restart or:
fish_update_completions
```

### PowerShell Manual Installation

```powershell
# Create scripts directory
New-Item -ItemType Directory -Force -Path $HOME\Documents\PowerShell\Scripts

# Generate completion script
tryforge completion generate powershell > $HOME\Documents\PowerShell\Scripts\tryforge-completion.ps1

# Add to profile
Add-Content $PROFILE "`n. `"$HOME\Documents\PowerShell\Scripts\tryforge-completion.ps1`""

# Reload
. $PROFILE
```

## Using Installation Scripts

Alternative installation using provided shell scripts:

```bash
# Install
bash .completion/install.sh

# Uninstall
bash .completion/uninstall.sh
```

## Verification

Check if completion is properly installed:

```bash
# Verify installation
tryforge completion verify

# Check status of all shells
tryforge completion status
```

Expected output:
```
📊 TryForge Completion Status

Current shell: bash

Completion status:

  bash         ✓ Installed
  zsh          ✗ Not installed
  fish         ✗ Not installed
  powershell   ✗ Not available
```

## Completion Features

Once installed, you can use TAB to complete:

### 1. Commands
```bash
$ tryforge <TAB>
create    refactor    analyze    status    test    build    deploy    generate
models:generate    models:detect    graphics:generate    completion
```

### 2. Subcommands
```bash
$ tryforge models:<TAB>
models:generate    models:detect    models:watch    models:list    models:analyze

$ tryforge graphics:<TAB>
graphics:generate    graphics:detect    graphics:watch    graphics:list
```

### 3. Flags
```bash
$ tryforge create --<TAB>
--framework    --styling    --database    --auth    --graphics    --template
```

### 4. Flag Values
```bash
$ tryforge create --framework <TAB>
react    vue    angular    svelte

$ tryforge create --database <TAB>
postgresql    mysql    mongodb    sqlite

$ tryforge deploy <TAB>
vercel    netlify    railway    render
```

### 5. File Paths
```bash
$ tryforge generate component --path <TAB>
src/    public/    tests/    config/

$ tryforge models:generate --path src/<TAB>
src/components/    src/pages/    src/models/
```

## Uninstallation

To remove completion:

```bash
# Auto-detect shell and uninstall
tryforge completion uninstall

# Or specify shell
tryforge completion uninstall bash
tryforge completion uninstall zsh
tryforge completion uninstall fish
```

## Troubleshooting

### Completion Not Working

**Problem:** Pressing TAB doesn't show suggestions

**Solutions:**

1. **Verify installation:**
   ```bash
   tryforge completion verify
   ```

2. **Check if TryForge is in PATH:**
   ```bash
   which tryforge
   # Should output: /usr/local/bin/tryforge or similar
   ```

3. **Reload shell:**
   ```bash
   # Bash
   source ~/.bashrc

   # Zsh
   source ~/.zshrc

   # Fish
   source ~/.config/fish/config.fish
   ```

4. **For Zsh, clear completion cache:**
   ```bash
   rm -f ~/.zcompdump*
   compinit
   source ~/.zshrc
   ```

### Permission Errors

**Problem:** Permission denied errors during installation

**Solution:**

```bash
# Make completion script executable
chmod +x ~/.bash_completion.d/tryforge-completion.bash
chmod +x ~/.zsh/completion/_tryforge
```

### Script Not Found

**Problem:** Completion script not found after installation

**Solution:**

Check if script was created:

```bash
# Bash
ls -la ~/.bash_completion.d/tryforge-completion.bash

# Zsh
ls -la ~/.zsh/completion/_tryforge

# Fish
ls -la ~/.config/fish/completions/tryforge.fish
```

If not found, try manual installation (see above).

### Fish Completions Not Loading

**Problem:** Fish doesn't show completions

**Solutions:**

1. **Check completions directory:**
   ```bash
   echo $fish_complete_path
   ```

2. **Update completions:**
   ```bash
   fish_update_completions
   ```

3. **Restart Fish:**
   ```bash
   exec fish
   ```

### Zsh Completions Slow

**Problem:** Completion is slow in Zsh

**Solution:**

Enable completion caching in `~/.zshrc`:

```bash
# Add to ~/.zshrc
zstyle ':completion:*' use-cache on
zstyle ':completion:*' cache-path ~/.zsh/cache
```

## Advanced Usage

### Generate Scripts Only

Generate completion scripts without installing:

```bash
# Output to stdout
tryforge completion generate bash

# Save to file
tryforge completion generate bash -o /tmp/tryforge-completion.bash
tryforge completion generate zsh -o /tmp/_tryforge
tryforge completion generate fish -o /tmp/tryforge.fish
tryforge completion generate powershell -o /tmp/tryforge.ps1
```

### Multiple Shells

Install for multiple shells if you use them:

```bash
tryforge completion install bash
tryforge completion install zsh
tryforge completion install fish
```

### CI/CD Integration

For automated installations in containers or CI:

```bash
# Non-interactive installation
tryforge completion install bash --quiet

# Or use environment variable
SHELL=/bin/bash tryforge completion install
```

## Support

- **Documentation:** See `.completion/README.md` for detailed docs
- **Issues:** [GitHub Issues](https://github.com/jedrzej82/tryforge/issues)
- **Status Check:** Run `tryforge completion status` anytime

## Quick Reference

```bash
# Install
tryforge completion install [shell]

# Uninstall
tryforge completion uninstall [shell]

# Generate script
tryforge completion generate <shell> [-o file]

# Verify
tryforge completion verify

# Status
tryforge completion status

# Help
tryforge completion --help
```

## What's Next?

After installing completion:

1. **Explore commands:** Type `tryforge ` and press TAB
2. **Learn flags:** Type `tryforge create --` and press TAB
3. **Try subcommands:** Type `tryforge models:` and press TAB
4. **Test values:** Type `tryforge deploy ` and press TAB

Enjoy faster, error-free CLI usage with TryForge auto-completion!
