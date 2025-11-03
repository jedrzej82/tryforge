/**
 * TryForge CLI - Prompt Templates
 * Custom prompt templates and wizards
 */

const chalk = require('chalk');

/**
 * Create a section header for prompts
 */
function createSectionHeader(title, subtitle = null) {
  const divider = chalk.gray('─'.repeat(50));

  return [
    '',
    divider,
    chalk.bold.cyan(title),
    subtitle ? chalk.gray(subtitle) : null,
    divider,
    ''
  ].filter(Boolean).join('\n');
}

/**
 * Create a summary section
 */
function createSummary(title, items) {
  const lines = [
    '',
    chalk.bold.green(`✓ ${title}`),
    ''
  ];

  for (const [key, value] of Object.entries(items)) {
    if (value !== null && value !== undefined && value !== '') {
      const displayKey = chalk.gray(`  ${key}:`);
      const displayValue = chalk.white(value);
      lines.push(`${displayKey} ${displayValue}`);
    }
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Create a confirmation prompt with summary
 */
function createConfirmationPrompt(config, message = 'Continue with this configuration?') {
  return {
    type: 'confirm',
    name: 'confirmed',
    message,
    default: true,
    prefix: chalk.yellow('⚠')
  };
}

/**
 * Create a multi-step wizard template
 */
class WizardTemplate {
  constructor(title) {
    this.title = title;
    this.steps = [];
    this.currentStep = 0;
    this.results = {};
  }

  /**
   * Add a step to the wizard
   */
  addStep(name, prompts, options = {}) {
    this.steps.push({
      name,
      prompts: typeof prompts === 'function' ? prompts : () => prompts,
      validate: options.validate || (() => true),
      transform: options.transform || ((data) => data),
      skip: options.skip || (() => false),
      onComplete: options.onComplete || (() => {})
    });

    return this;
  }

  /**
   * Get the header for current step
   */
  getStepHeader() {
    const step = this.steps[this.currentStep];
    const progress = `Step ${this.currentStep + 1} of ${this.steps.length}`;

    return createSectionHeader(
      `${this.title} - ${step.name}`,
      progress
    );
  }

  /**
   * Get prompts for current step
   */
  getCurrentPrompts() {
    const step = this.steps[this.currentStep];

    // Check if step should be skipped
    if (step.skip(this.results)) {
      return null;
    }

    // Get prompts (can be dynamic based on previous results)
    const prompts = step.prompts(this.results);

    // Ensure prompts is an array
    return Array.isArray(prompts) ? prompts : [prompts];
  }

  /**
   * Process step results
   */
  processStepResults(answers) {
    const step = this.steps[this.currentStep];

    // Validate
    const validationResult = step.validate(answers, this.results);
    if (validationResult !== true) {
      throw new Error(validationResult);
    }

    // Transform
    const transformed = step.transform(answers, this.results);

    // Merge results
    this.results = { ...this.results, ...transformed };

    // Call onComplete callback
    step.onComplete(this.results);

    // Move to next step
    this.currentStep++;

    return this.results;
  }

  /**
   * Check if wizard is complete
   */
  isComplete() {
    return this.currentStep >= this.steps.length;
  }

  /**
   * Get final results
   */
  getResults() {
    return this.results;
  }

  /**
   * Reset wizard
   */
  reset() {
    this.currentStep = 0;
    this.results = {};
  }
}

/**
 * Create a conditional prompt based on previous answer
 */
function createConditionalPrompt(condition, prompt) {
  return {
    ...prompt,
    when: (answers) => {
      if (typeof condition === 'function') {
        return condition(answers);
      }

      // Simple key-value condition
      if (typeof condition === 'object') {
        return Object.entries(condition).every(([key, value]) => {
          return answers[key] === value;
        });
      }

      return Boolean(condition);
    }
  };
}

/**
 * Create a list prompt with search/filter
 */
function createSearchableList(name, message, choices, options = {}) {
  return {
    type: 'autocomplete',
    name,
    message,
    source: async (answersSoFar, input) => {
      if (!input) {
        return choices;
      }

      const searchTerm = input.toLowerCase();

      return choices.filter(choice => {
        const searchableText = [
          choice.name,
          choice.value,
          choice.description,
          ...(choice.tags || [])
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
      });
    },
    ...options
  };
}

/**
 * Create a progress indicator
 */
function createProgressIndicator(current, total, label = '') {
  const percentage = Math.round((current / total) * 100);
  const barLength = 20;
  const filled = Math.round((current / total) * barLength);
  const empty = barLength - filled;

  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  const percentText = chalk.cyan(`${percentage}%`);
  const labelText = label ? chalk.gray(label) : '';

  return `${bar} ${percentText} ${labelText}`;
}

/**
 * Create a table display for summary
 */
function createTable(data, headers = null) {
  const lines = [];

  if (headers) {
    lines.push(chalk.bold(headers.join(' | ')));
    lines.push(chalk.gray('─'.repeat(headers.join(' | ').length)));
  }

  for (const row of data) {
    const cells = Array.isArray(row) ? row : Object.values(row);
    lines.push(cells.join(' | '));
  }

  return lines.join('\n');
}

/**
 * Create a loading message template
 */
function createLoadingMessage(action, item = '') {
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const frame = spinner[Math.floor(Math.random() * spinner.length)];

  return chalk.cyan(`${frame} ${action}${item ? ` ${item}` : ''}...`);
}

/**
 * Create a success message template
 */
function createSuccessMessage(message, details = null) {
  const lines = [
    '',
    chalk.green.bold('✓ ') + chalk.green(message)
  ];

  if (details) {
    if (typeof details === 'string') {
      lines.push(chalk.gray(`  ${details}`));
    } else if (Array.isArray(details)) {
      details.forEach(detail => {
        lines.push(chalk.gray(`  • ${detail}`));
      });
    }
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Create an error message template
 */
function createErrorMessage(message, error = null) {
  const lines = [
    '',
    chalk.red.bold('✗ ') + chalk.red(message)
  ];

  if (error) {
    if (error instanceof Error) {
      lines.push(chalk.gray(`  ${error.message}`));
      if (error.stack) {
        lines.push(chalk.gray(`  ${error.stack.split('\n').slice(0, 3).join('\n  ')}`));
      }
    } else {
      lines.push(chalk.gray(`  ${error}`));
    }
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Create a warning message template
 */
function createWarningMessage(message, details = null) {
  const lines = [
    '',
    chalk.yellow.bold('⚠ ') + chalk.yellow(message)
  ];

  if (details) {
    if (typeof details === 'string') {
      lines.push(chalk.gray(`  ${details}`));
    } else if (Array.isArray(details)) {
      details.forEach(detail => {
        lines.push(chalk.gray(`  • ${detail}`));
      });
    }
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Create an info message template
 */
function createInfoMessage(message, details = null) {
  const lines = [
    '',
    chalk.blue.bold('ℹ ') + chalk.blue(message)
  ];

  if (details) {
    if (typeof details === 'string') {
      lines.push(chalk.gray(`  ${details}`));
    } else if (Array.isArray(details)) {
      details.forEach(detail => {
        lines.push(chalk.gray(`  • ${detail}`));
      });
    }
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Create a banner template
 */
function createBanner(title, subtitle = null, width = 60) {
  const border = chalk.cyan('═'.repeat(width));
  const padding = ' '.repeat(Math.max(0, Math.floor((width - title.length) / 2)));

  const lines = [
    '',
    border,
    padding + chalk.bold.cyan(title),
  ];

  if (subtitle) {
    const subtitlePadding = ' '.repeat(Math.max(0, Math.floor((width - subtitle.length) / 2)));
    lines.push(subtitlePadding + chalk.gray(subtitle));
  }

  lines.push(border);
  lines.push('');

  return lines.join('\n');
}

/**
 * Create a multi-select helper text
 */
function createMultiSelectHelper() {
  return chalk.gray('(Use arrow keys, space to select, enter to confirm)');
}

/**
 * Create a list with descriptions
 */
function createDescriptiveList(items) {
  const lines = [];

  for (const item of items) {
    lines.push(chalk.bold(item.title || item.name));
    if (item.description) {
      lines.push(chalk.gray(`  ${item.description}`));
    }
    if (item.details) {
      item.details.forEach(detail => {
        lines.push(chalk.gray(`  • ${detail}`));
      });
    }
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = {
  createSectionHeader,
  createSummary,
  createConfirmationPrompt,
  WizardTemplate,
  createConditionalPrompt,
  createSearchableList,
  createProgressIndicator,
  createTable,
  createLoadingMessage,
  createSuccessMessage,
  createErrorMessage,
  createWarningMessage,
  createInfoMessage,
  createBanner,
  createMultiSelectHelper,
  createDescriptiveList
};
