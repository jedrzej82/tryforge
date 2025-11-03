# TryForge Auto-Completion

Shell auto-completion for TryForge CLI supporting Bash, Zsh, Fish, and PowerShell.

## Quick Installation

The easiest way to install completion is using the TryForge CLI:

```bash
# Auto-detect shell and install
tryforge completion install

# Install for specific shell
tryforge completion install bash
tryforge completion install zsh
tryforge completion install fish
tryforge completion install powershell
```

## Manual Installation

### Using Installation Scripts

```bash
# Install
bash .completion/install.sh

# Uninstall
bash .completion/uninstall.sh
```

### Manual Setup

#### Bash

1. Generate completion script:
   ```bash
   tryforge completion generate bash > ~/.bash_completion.d/tryforge-completion.bash
   ```

2. Add to `~/.bashrc`:
   ```bash
   [ -f ~/.bash_completion.d/tryforge-completion.bash ] && source ~/.bash_completion.d/tryforge-completion.bash
   ```

3. Reload:
   ```bash
   source ~/.bashrc
   ```

#### Zsh

1. Create completion directory:
   ```bash
   mkdir -p ~/.zsh/completion
   ```

2. Generate completion script:
   ```bash
   tryforge completion generate zsh > ~/.zsh/completion/_tryforge
   ```

3. Add to `~/.zshrc`:
   ```bash
   fpath=(~/.zsh/completion $fpath)
   autoload -Uz compinit && compinit
   ```

4. Reload:
   ```bash
   source ~/.zshrc
   ```

#### Fish

1. Create completions directory:
   ```bash
   mkdir -p ~/.config/fish/completions
   ```

2. Generate completion script:
   ```bash
   tryforge completion generate fish > ~/.config/fish/completions/tryforge.fish
   ```

3. Fish will automatically load completions. Restart your shell or run:
   ```bash
   fish_update_completions
   ```

#### PowerShell

1. Create scripts directory:
   ```powershell
   New-Item -ItemType Directory -Force -Path $HOME\Documents\PowerShell\Scripts
   ```

2. Generate completion script:
   ```powershell
   tryforge completion generate powershell > $HOME\Documents\PowerShell\Scripts\tryforge-completion.ps1
   ```

3. Add to your PowerShell profile (`$PROFILE`):
   ```powershell
   . "$HOME\Documents\PowerShell\Scripts\tryforge-completion.ps1"
   ```

4. Reload:
   ```powershell
   . $PROFILE
   ```

## Verification

Check if completion is properly installed:

```bash
tryforge completion verify

# Check status for all shells
tryforge completion status
```

## Uninstallation

```bash
# Auto-detect shell and uninstall
tryforge completion uninstall

# Uninstall for specific shell
tryforge completion uninstall bash
tryforge completion uninstall zsh
tryforge completion uninstall fish
```

## Features

### Command Completion
Press `TAB` after typing `tryforge` to see all available commands:

```bash
$ tryforge <TAB>
create          generate        models:generate     graphics:generate
refactor        test            models:detect       graphics:detect
analyze         build           models:watch        graphics:watch
deploy          start           models:list         graphics:list
...
```

### Flag Completion
Complete command flags and their values:

```bash
$ tryforge create --<TAB>
--framework    --styling    --database    --auth    --graphics    --template

$ tryforge create --framework <TAB>
react    vue    angular    svelte

$ tryforge create --database <TAB>
postgresql    mysql    mongodb    sqlite
```

### Subcommand Completion

```bash
$ tryforge models:<TAB>
models:generate    models:detect    models:watch    models:list    models:analyze

$ tryforge graphics:<TAB>
graphics:generate    graphics:detect    graphics:watch    graphics:list    graphics:analyze
```

### Value Completion

```bash
$ tryforge deploy <TAB>
vercel    netlify    railway    render

$ tryforge analyze <TAB>
codebase    performance    security    ui    database    bundle

$ tryforge generate <TAB>
component    route    feature    test
```

### File Path Completion

Automatic file path completion for flags like `--path`, `--file`, `--output`:

```bash
$ tryforge generate component --path src/<TAB>
src/components/    src/pages/    src/layouts/    src/features/
```

## Troubleshooting

### Completion Not Working

1. **Check installation:**
   ```bash
   tryforge completion verify
   ```

2. **Reload shell:**
   ```bash
   # Bash
   source ~/.bashrc

   # Zsh
   source ~/.zshrc

   # Fish
   source ~/.config/fish/config.fish
   ```

3. **Clear completion cache (Zsh):**
   ```bash
   rm -f ~/.zcompdump*
   compinit
   ```

### Permission Issues

If you get permission errors, ensure scripts are executable:

```bash
chmod +x ~/.bash_completion.d/tryforge-completion.bash
chmod +x ~/.zsh/completion/_tryforge
```

### Fish Completions Not Loading

Ensure the completions directory is in Fish's search path:

```bash
fish_add_path ~/.config/fish/completions
```

## Development

### Generate Completion Scripts

Generate scripts for all shells:

```bash
# Bash
tryforge completion generate bash -o .completion/tryforge.bash

# Zsh
tryforge completion generate zsh -o .completion/_tryforge

# Fish
tryforge completion generate fish -o .completion/tryforge.fish

# PowerShell
tryforge completion generate powershell -o .completion/tryforge.ps1
```

### Testing Completions

1. Install completion for your shell
2. Type `tryforge ` and press TAB
3. Try completing various commands, flags, and values

## Support

- **Documentation:** [TryForge Docs](https://github.com/jedrzej82/tryforge)
- **Issues:** [GitHub Issues](https://github.com/jedrzej82/tryforge/issues)
- **Discord:** [Join our community](https://discord.gg/tryforge)

## License

MIT License - see LICENSE file for details
