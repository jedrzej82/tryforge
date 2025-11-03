/**
 * Completion Command
 * Manage shell auto-completion for TryForge CLI
 */

const chalk = require('chalk');
const logger = require('../../utils/logger');
const { handleError } = require('../../utils/error-handler');
const installer = require('../completion/installer');
const { generators } = require('../completion/generators');

class CompletionCommand {
  /**
   * Install completion
   */
  static async install(options = {}) {
    try {
      const shell = options.shell || null;

      console.log(chalk.cyan.bold('\n🔥 TryForge Completion Installer\n'));

      // Install completion
      const result = await installer.install(shell);

      if (result.success) {
        logger.success('Completion installed successfully!');
        return result;
      } else {
        throw new Error(result.error || 'Installation failed');
      }
    } catch (error) {
      handleError(error, {
        context: 'Completion Installation',
        exitOnError: true,
      });
    }
  }

  /**
   * Uninstall completion
   */
  static async uninstall(options = {}) {
    try {
      const shell = options.shell || null;

      console.log(chalk.cyan.bold('\n🔥 TryForge Completion Uninstaller\n'));

      // Uninstall completion
      const result = await installer.uninstall(shell);

      if (result.success) {
        logger.success('Completion uninstalled successfully!');
        return result;
      } else {
        throw new Error(result.error || 'Uninstallation failed');
      }
    } catch (error) {
      handleError(error, {
        context: 'Completion Uninstallation',
        exitOnError: true,
      });
    }
  }

  /**
   * Generate completion script
   */
  static async generate(shell, options = {}) {
    try {
      if (!shell) {
        throw new Error('Shell type is required. Use: bash, zsh, fish, or powershell');
      }

      const validShells = ['bash', 'zsh', 'fish', 'powershell'];
      if (!validShells.includes(shell)) {
        throw new Error(`Invalid shell: ${shell}. Must be one of: ${validShells.join(', ')}`);
      }

      // Generate script
      const script = generators[shell]();

      // Output to stdout or file
      if (options.output) {
        const fs = require('fs-extra');
        await fs.writeFile(options.output, script);
        console.log(chalk.green(`✓ Completion script written to: ${options.output}`));
      } else {
        // Output to stdout
        console.log(script);
      }

      return { success: true };
    } catch (error) {
      handleError(error, {
        context: 'Completion Generation',
        exitOnError: true,
      });
    }
  }

  /**
   * Verify completion installation
   */
  static async verify(options = {}) {
    try {
      const shell = options.shell || null;

      console.log(chalk.cyan.bold('\n🔍 TryForge Completion Verification\n'));

      // Verify installation
      const isInstalled = await installer.verify(shell);

      return { success: true, isInstalled };
    } catch (error) {
      handleError(error, {
        context: 'Completion Verification',
        exitOnError: true,
      });
    }
  }

  /**
   * Show completion status
   */
  static async status(options = {}) {
    try {
      console.log(chalk.cyan.bold('\n📊 TryForge Completion Status\n'));

      const shell = installer.detectShell();
      console.log(chalk.white(`Current shell: ${chalk.bold(shell)}\n`));

      // Check all shells
      const shells = ['bash', 'zsh', 'fish', 'powershell'];

      console.log(chalk.white('Completion status:\n'));

      const path = require('path');
      const fs = require('fs-extra');
      const os = require('os');

      for (const sh of shells) {
        try {
          // Manually construct paths for checking
          const homeDir = os.homedir();
          let scriptPath;

          switch (sh) {
            case 'bash':
              scriptPath = path.join(homeDir, '.bash_completion.d/tryforge-completion.bash');
              if (!await fs.pathExists(scriptPath)) {
                scriptPath = path.join(homeDir, 'tryforge-completion.bash');
              }
              break;
            case 'zsh':
              scriptPath = path.join(homeDir, '.zsh/completion/_tryforge');
              break;
            case 'fish':
              scriptPath = path.join(homeDir, '.config/fish/completions/tryforge.fish');
              break;
            case 'powershell':
              scriptPath = path.join(homeDir, 'Documents/PowerShell/Scripts/tryforge-completion.ps1');
              break;
          }

          const installed = await fs.pathExists(scriptPath);
          const status = installed ? chalk.green('✓ Installed') : chalk.gray('✗ Not installed');
          console.log(chalk.white(`  ${sh.padEnd(12)} ${status}`));
        } catch (error) {
          console.log(chalk.white(`  ${sh.padEnd(12)} ${chalk.gray('✗ Not available')}`));
        }
      }

      console.log();

      return { success: true };
    } catch (error) {
      handleError(error, {
        context: 'Completion Status',
        exitOnError: true,
      });
    }
  }

  /**
   * Main execute method (handles subcommands)
   */
  static async execute(action, shellOrOptions, options = {}) {
    switch (action) {
      case 'install':
        return await this.install(typeof shellOrOptions === 'object' ? shellOrOptions : { shell: shellOrOptions, ...options });

      case 'uninstall':
        return await this.uninstall(typeof shellOrOptions === 'object' ? shellOrOptions : { shell: shellOrOptions, ...options });

      case 'generate':
        if (!shellOrOptions || typeof shellOrOptions === 'object') {
          throw new Error('Shell type is required for generate. Use: bash, zsh, fish, or powershell');
        }
        return await this.generate(shellOrOptions, options);

      case 'verify':
        return await this.verify(typeof shellOrOptions === 'object' ? shellOrOptions : { shell: shellOrOptions, ...options });

      case 'status':
        return await this.status(typeof shellOrOptions === 'object' ? shellOrOptions : options);

      default:
        // Default action: show status
        return await this.status(options);
    }
  }
}

module.exports = CompletionCommand;
