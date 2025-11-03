/**
 * Completion Installer
 * Auto-detect shell and install completion scripts
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');
const { generators } = require('./generators');

const execAsync = promisify(exec);

/**
 * Detect user's current shell
 */
function detectShell() {
  // Check SHELL environment variable
  const shellPath = process.env.SHELL || '';

  if (shellPath.includes('bash')) return 'bash';
  if (shellPath.includes('zsh')) return 'zsh';
  if (shellPath.includes('fish')) return 'fish';

  // Windows PowerShell
  if (process.platform === 'win32') {
    return 'powershell';
  }

  // Default to bash on Unix-like systems
  return os.platform() === 'win32' ? 'powershell' : 'bash';
}

/**
 * Get shell RC file path
 */
function getShellRCPath(shell) {
  const homeDir = os.homedir();

  switch (shell) {
    case 'bash':
      // Try .bashrc first, then .bash_profile
      const bashrc = path.join(homeDir, '.bashrc');
      const bashProfile = path.join(homeDir, '.bash_profile');
      return fs.existsSync(bashrc) ? bashrc : bashProfile;

    case 'zsh':
      return path.join(homeDir, '.zshrc');

    case 'fish':
      return path.join(homeDir, '.config/fish/config.fish');

    case 'powershell':
      // PowerShell profile path
      return path.join(homeDir, 'Documents/PowerShell/Microsoft.PowerShell_profile.ps1');

    default:
      return null;
  }
}

/**
 * Get completion script directory
 */
function getCompletionDir(shell) {
  const homeDir = os.homedir();

  switch (shell) {
    case 'bash':
      // Try user completion directory first, fall back to home
      const bashCompletionDir = path.join(homeDir, '.bash_completion.d');
      if (fs.existsSync(bashCompletionDir)) {
        return bashCompletionDir;
      }
      return homeDir;

    case 'zsh':
      // User completion directory
      const zshCompletionDir = path.join(homeDir, '.zsh/completion');
      fs.ensureDirSync(zshCompletionDir);
      return zshCompletionDir;

    case 'fish':
      // Fish completion directory
      const fishCompletionDir = path.join(homeDir, '.config/fish/completions');
      fs.ensureDirSync(fishCompletionDir);
      return fishCompletionDir;

    case 'powershell':
      // PowerShell scripts directory
      const psScriptsDir = path.join(homeDir, 'Documents/PowerShell/Scripts');
      fs.ensureDirSync(psScriptsDir);
      return psScriptsDir;

    default:
      return null;
  }
}

/**
 * Get completion script filename
 */
function getCompletionFilename(shell) {
  switch (shell) {
    case 'bash':
      return 'tryforge-completion.bash';
    case 'zsh':
      return '_tryforge';
    case 'fish':
      return 'tryforge.fish';
    case 'powershell':
      return 'tryforge-completion.ps1';
    default:
      return 'tryforge-completion';
  }
}

/**
 * Install completion script for a specific shell
 */
async function installForShell(shell) {
  try {
    console.log(chalk.cyan(`\n📦 Installing completion for ${shell}...\n`));

    // Get generator
    const generator = generators[shell];
    if (!generator) {
      throw new Error(`Unsupported shell: ${shell}`);
    }

    // Generate completion script
    const script = generator();

    // Get paths
    const completionDir = getCompletionDir(shell);
    const filename = getCompletionFilename(shell);
    const scriptPath = path.join(completionDir, filename);

    // Ensure directory exists
    await fs.ensureDir(completionDir);

    // Write completion script
    await fs.writeFile(scriptPath, script);
    console.log(chalk.green(`✓ Completion script written to: ${scriptPath}`));

    // Make script executable on Unix
    if (shell !== 'powershell') {
      await fs.chmod(scriptPath, 0o755);
    }

    // Update shell RC file
    const rcPath = getShellRCPath(shell);
    if (rcPath) {
      await updateShellRC(shell, rcPath, scriptPath);
    }

    // Shell-specific post-install instructions
    printPostInstallInstructions(shell, scriptPath, rcPath);

    return { success: true, scriptPath, rcPath };
  } catch (error) {
    console.error(chalk.red(`✗ Installation failed: ${error.message}`));
    return { success: false, error: error.message };
  }
}

/**
 * Update shell RC file to source completion script
 */
async function updateShellRC(shell, rcPath, scriptPath) {
  try {
    // Ensure RC file exists
    await fs.ensureFile(rcPath);

    // Read current content
    let content = await fs.readFile(rcPath, 'utf8');

    // Check if already sourced
    const marker = '# TryForge completion';
    if (content.includes(marker)) {
      console.log(chalk.yellow('✓ Shell RC file already configured'));
      return;
    }

    // Add source line based on shell
    let sourceCommand = '';
    switch (shell) {
      case 'bash':
      case 'zsh':
        sourceCommand = `\n${marker}\n[ -f "${scriptPath}" ] && source "${scriptPath}"\n`;
        break;
      case 'fish':
        // Fish automatically loads completions from ~/.config/fish/completions/
        console.log(chalk.green('✓ Fish will automatically load the completion'));
        return;
      case 'powershell':
        sourceCommand = `\n${marker}\n. "${scriptPath}"\n`;
        break;
    }

    // Append to RC file
    content += sourceCommand;
    await fs.writeFile(rcPath, content);

    console.log(chalk.green(`✓ Updated ${rcPath}`));
  } catch (error) {
    console.log(chalk.yellow(`⚠ Could not update RC file: ${error.message}`));
    console.log(chalk.yellow('  Please manually add the source command to your shell RC file'));
  }
}

/**
 * Print post-install instructions
 */
function printPostInstallInstructions(shell, scriptPath, rcPath) {
  console.log(chalk.cyan('\n📝 Installation Complete!\n'));

  console.log(chalk.white('To activate completion, run one of the following:\n'));

  switch (shell) {
    case 'bash':
      console.log(chalk.gray(`  source ${rcPath}`));
      console.log(chalk.gray('  # or restart your terminal\n'));
      break;

    case 'zsh':
      console.log(chalk.gray(`  source ${rcPath}`));
      console.log(chalk.gray('  # or run: compinit'));
      console.log(chalk.gray('  # or restart your terminal\n'));
      break;

    case 'fish':
      console.log(chalk.gray('  # Fish will automatically load completions'));
      console.log(chalk.gray('  # Restart your terminal or run: fish_update_completions\n'));
      break;

    case 'powershell':
      console.log(chalk.gray(`  . ${rcPath}`));
      console.log(chalk.gray('  # or restart PowerShell\n'));
      break;
  }

  console.log(chalk.white('Test completion by typing:\n'));
  console.log(chalk.cyan('  tryforge <TAB>\n'));
}

/**
 * Uninstall completion for a specific shell
 */
async function uninstallForShell(shell) {
  try {
    console.log(chalk.cyan(`\n🗑️  Uninstalling completion for ${shell}...\n`));

    // Get paths
    const completionDir = getCompletionDir(shell);
    const filename = getCompletionFilename(shell);
    const scriptPath = path.join(completionDir, filename);

    // Remove completion script
    if (await fs.pathExists(scriptPath)) {
      await fs.remove(scriptPath);
      console.log(chalk.green(`✓ Removed completion script: ${scriptPath}`));
    } else {
      console.log(chalk.yellow('✓ Completion script not found (already removed)'));
    }

    // Update shell RC file
    const rcPath = getShellRCPath(shell);
    if (rcPath && await fs.pathExists(rcPath)) {
      await removeFromShellRC(shell, rcPath);
    }

    console.log(chalk.green('\n✓ Uninstallation complete'));
    console.log(chalk.gray('  Restart your terminal for changes to take effect\n'));

    return { success: true };
  } catch (error) {
    console.error(chalk.red(`✗ Uninstallation failed: ${error.message}`));
    return { success: false, error: error.message };
  }
}

/**
 * Remove completion from shell RC file
 */
async function removeFromShellRC(shell, rcPath) {
  try {
    let content = await fs.readFile(rcPath, 'utf8');

    // Remove TryForge completion lines
    const marker = '# TryForge completion';
    const lines = content.split('\n');
    const filteredLines = [];
    let skip = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(marker)) {
        skip = true;
        continue;
      }
      if (skip && lines[i].trim() === '') {
        skip = false;
        continue;
      }
      if (skip && (lines[i].includes('source') || lines[i].includes('.'))) {
        continue;
      }
      skip = false;
      filteredLines.push(lines[i]);
    }

    await fs.writeFile(rcPath, filteredLines.join('\n'));
    console.log(chalk.green(`✓ Updated ${rcPath}`));
  } catch (error) {
    console.log(chalk.yellow(`⚠ Could not update RC file: ${error.message}`));
  }
}

/**
 * Install completion (auto-detect shell)
 */
async function install(shell = null) {
  const targetShell = shell || detectShell();

  console.log(chalk.cyan('🔥 TryForge Completion Installer\n'));
  console.log(chalk.white(`Detected shell: ${chalk.bold(targetShell)}\n`));

  return await installForShell(targetShell);
}

/**
 * Uninstall completion
 */
async function uninstall(shell = null) {
  const targetShell = shell || detectShell();

  console.log(chalk.cyan('🔥 TryForge Completion Uninstaller\n'));
  console.log(chalk.white(`Detected shell: ${chalk.bold(targetShell)}\n`));

  return await uninstallForShell(targetShell);
}

/**
 * Generate completion script to stdout
 */
function generate(shell) {
  const generator = generators[shell];
  if (!generator) {
    throw new Error(`Unsupported shell: ${shell}`);
  }

  return generator();
}

/**
 * Verify installation
 */
async function verify(shell = null) {
  const targetShell = shell || detectShell();

  console.log(chalk.cyan('🔍 Verifying completion installation...\n'));

  const completionDir = getCompletionDir(targetShell);
  const filename = getCompletionFilename(targetShell);
  const scriptPath = path.join(completionDir, filename);

  const scriptExists = await fs.pathExists(scriptPath);
  const rcPath = getShellRCPath(targetShell);
  let rcConfigured = false;

  if (rcPath && await fs.pathExists(rcPath)) {
    const content = await fs.readFile(rcPath, 'utf8');
    rcConfigured = content.includes('TryForge completion');
  }

  console.log(chalk.white(`Shell: ${chalk.bold(targetShell)}`));
  console.log(chalk.white(`Script: ${scriptExists ? chalk.green('✓ Installed') : chalk.red('✗ Not found')}`));
  console.log(chalk.white(`  Path: ${scriptPath}`));
  console.log(chalk.white(`RC File: ${rcConfigured ? chalk.green('✓ Configured') : chalk.yellow('⚠ Not configured')}`));
  if (rcPath) {
    console.log(chalk.white(`  Path: ${rcPath}`));
  }
  console.log();

  if (scriptExists && rcConfigured) {
    console.log(chalk.green('✓ Completion is properly installed!\n'));
    return true;
  } else if (scriptExists && !rcConfigured) {
    console.log(chalk.yellow('⚠ Script installed but RC file not configured\n'));
    return false;
  } else {
    console.log(chalk.red('✗ Completion is not installed\n'));
    return false;
  }
}

module.exports = {
  install,
  uninstall,
  generate,
  verify,
  detectShell,
  installForShell,
  uninstallForShell,
};
