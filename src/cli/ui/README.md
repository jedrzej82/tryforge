# TryForge CLI - Progress Indicators & Loading Animations System

A comprehensive, production-ready progress visualization system for TryForge CLI operations.

## 📦 Features

- **Spinners**: Animated loading indicators for indeterminate operations
- **Progress Bars**: Visual progress tracking for determinate operations
- **Task Lists**: Multi-step process visualization with status tracking
- **Animations**: Custom animation frames for various operations
- **Themes**: Consistent color schemes and styling
- **Formatters**: Utilities for formatting sizes, durations, percentages, etc.

## 🚀 Quick Start

```javascript
const { createSpinner, createProgressBar, createTaskList } = require('./src/cli/ui/progress');

// Basic spinner
const spinner = createSpinner('Loading...');
spinner.succeed('Done!');

// Progress bar
const bar = createProgressBar('Installing');
bar.start(100, 0);
bar.update(50);
bar.stop();

// Task list
const tasks = createTaskList('Setup', ['Step 1', 'Step 2']);
tasks.start();
tasks.completeTask(0);
```

## 📚 Core Modules

### 1. **progress.js** - Main Entry Point
The unified interface for all progress indicators.

```javascript
const {
  createSpinner,
  createProgressBar,
  createTaskList,
  operationSpinners,
  success,
  error,
  warning,
  info
} = require('./src/cli/ui/progress');
```

### 2. **spinners.js** - Spinner Management
Animated indicators for indeterminate operations.

**Basic Usage:**
```javascript
const spinner = createSpinner('Processing...');
// ... work
spinner.succeed('Complete!');
```

**Operation-Specific Spinners:**
```javascript
// Code generation
operationSpinners.generating('UserModel.js');

// Package installation
operationSpinners.installing('react');

// Database operations
operationSpinners.database('migrating');

// AI operations
operationSpinners.ai('thinking');

// Network operations
operationSpinners.network('downloading');
```

### 3. **progress-bar.js** - Progress Bars
Visual progress tracking with percentage, ETA, and speed.

**Single Progress Bar:**
```javascript
const bar = createProgressBar('Downloading');
bar.start(100, 0);
bar.update(50);
bar.stop();
```

**File Progress Bar:**
```javascript
const fileBar = createFileProgressBar('package.zip');
fileBar.start(1048576); // 1MB
fileBar.updateBytes(524288); // 512KB
```

**Multi-Bar Progress:**
```javascript
const multibar = createMultiBar();
multibar.add('file1', 'component.js', 100);
multibar.add('file2', 'styles.css', 100);

multibar.update('file1', 50);
multibar.complete('file1');
```

### 4. **task-list.js** - Task Management
Track multi-step processes with status indicators.

```javascript
const tasks = createTaskList('Building Project', [
  'Clean directory',
  'Compile TypeScript',
  'Bundle assets',
  'Run tests'
]);

tasks.start();
tasks.startTask(0);
tasks.completeTask(0);
tasks.failTask(1, 'Compilation error');
tasks.skipTask(2);
tasks.complete();
```

### 5. **animations.js** - Animation Frames
Pre-built animation sequences for various operations.

```javascript
const { asciiArt, celebrationFrames } = require('./src/cli/ui/animations');

console.log(asciiArt.rocket);
console.log(asciiArt.trophy);
console.log(asciiArt.celebration);
```

### 6. **formatters.js** - Formatting Utilities
Format data for display in the CLI.

```javascript
const {
  formatFileSize,
  formatDuration,
  formatPercentage,
  formatETA
} = require('./src/cli/ui/formatters');

formatFileSize(1048576);      // "1.00 MB"
formatDuration(125000);       // "2m 5s"
formatPercentage(75, 100);    // "75.0%"
formatETA(30000);             // "30s"
```

### 7. **themes.js** - Color Themes
Consistent styling and color schemes.

```javascript
const { colors, icons } = require('./src/cli/ui/themes');

console.log(colors.success('Success!'));
console.log(colors.error('Error!'));
console.log(colors.warning('Warning!'));

console.log(icons.success);   // ✔
console.log(icons.rocket);    // 🚀
```

## 🎨 Visual Examples

### Spinner
```
⠋ Generating React components...
✔ Generated React components (2.3s)
```

### Progress Bar
```
Installing dependencies [████████████░░░░░░░░] 60% | ETA: 15s | 156/260 packages
```

### Task List
```
Building Application
────────────────────

✔ Clean build directory (0.5s)
⠋ Compile TypeScript...
○ Bundle assets
○ Run tests

Progress: 25%
```

### Multi-Bar Progress
```
component.js    [████████████████████] 100%
styles.css      [████████████░░░░░░░░] 60%
index.html      [████░░░░░░░░░░░░░░░░] 20%
```

### Success Message
```
✔ Project created successfully!
  Total time: 45.2s
  Files created: 127
  Lines of code: 8,543
```

## 🔧 Advanced Patterns

### Multi-Step Process
```javascript
const { patterns } = require('./src/cli/ui/progress');

await patterns.multiStep('Setup Project', [
  {
    title: 'Initialize repository',
    fn: async () => { /* ... */ }
  },
  {
    title: 'Install dependencies',
    fn: async () => { /* ... */ }
  }
]);
```

### Parallel Operations
```javascript
await patterns.parallel('Starting Services', [
  {
    id: 'api',
    title: 'Starting API server',
    fn: async () => { /* ... */ }
  },
  {
    id: 'db',
    title: 'Connecting to database',
    fn: async () => { /* ... */ }
  }
]);
```

### File Batch Processing
```javascript
await patterns.fileBatch('Processing Files', files, async (file, updateProgress) => {
  // Process file
  updateProgress(50);
  // Continue processing
  updateProgress(100);
});
```

## 📖 Integration Examples

### Project Generator Integration
```javascript
const { createTaskList } = require('../cli/ui/progress');

async function generateProject(results) {
  const tasks = createTaskList('Generating Project', [
    'Create structure',
    'Generate frontend',
    'Generate backend'
  ]);

  tasks.start();

  tasks.startTask(0);
  await this.createStructure();
  tasks.completeTask(0);

  // ... more tasks

  tasks.complete();
}
```

### Migration Manager Integration
```javascript
const { createProgressBar, operationSpinners } = require('../cli/ui/progress');

async function migrate() {
  const spinner = operationSpinners.database('migrating');

  const migrations = await getPendingMigrations();
  spinner.stop();

  const bar = createProgressBar('Applying migrations');
  bar.start(migrations.length, 0);

  for (let i = 0; i < migrations.length; i++) {
    await applyMigration(migrations[i]);
    bar.update(i + 1);
  }

  bar.stop();
}
```

### Backup Manager Integration
```javascript
const { createTaskList, success } = require('../../cli/ui/progress');

async function createBackup() {
  const tasks = createTaskList('Creating Backup', [
    'Register backup',
    'Create database backup',
    'Compress backup',
    'Encrypt backup',
    'Save to storage',
    'Verify integrity'
  ]);

  tasks.start();

  // Execute each task
  for (let i = 0; i < tasks.tasks.length; i++) {
    tasks.startTask(i);
    await executeTask(i);
    tasks.completeTask(i);
  }

  tasks.complete();
  success('Backup created successfully');
}
```

## 🎯 Best Practices

1. **Choose the Right Indicator:**
   - Use **spinners** for indeterminate operations (unknown duration)
   - Use **progress bars** for operations with known progress
   - Use **task lists** for multi-step processes

2. **Provide Meaningful Feedback:**
   - Include specific file names, operation details
   - Show timing information
   - Display relevant metrics (file size, count, etc.)

3. **Handle Errors Gracefully:**
   - Use `.fail()` for spinners
   - Show error messages with context
   - Continue or rollback as appropriate

4. **Consistent Styling:**
   - Use provided color functions
   - Leverage operation-specific spinners
   - Maintain consistent message format

5. **Performance Considerations:**
   - Don't update progress bars too frequently (>10fps)
   - Use multi-bar for parallel operations
   - Clean up indicators when done

## 📊 Performance Guidelines

- **Spinner updates**: Every 80-100ms
- **Progress bar updates**: Every 100-200ms
- **Task list renders**: On status change only
- **Multi-bar updates**: Batch updates when possible

## 🧪 Testing

Run the examples to see all indicators in action:

```bash
node src/cli/ui/examples.js
```

## 📁 File Structure

```
src/cli/ui/
├── progress.js        # Main entry point (536 lines)
├── spinners.js        # Spinner utilities (577 lines)
├── progress-bar.js    # Progress bars (556 lines)
├── task-list.js       # Task management (567 lines)
├── animations.js      # Animation frames (467 lines)
├── formatters.js      # Formatting utils (369 lines)
├── themes.js          # Colors & styles (257 lines)
├── examples.js        # Usage examples (490 lines)
└── README.md          # This file
```

**Total**: 3,819 lines of production-ready code

## 🔗 Dependencies

- `ora@^5.4.1` - Terminal spinners
- `chalk@^4.1.2` - Terminal colors
- `cli-progress@^3.12.0` - Progress bars

## 📝 API Reference

### Main Progress Manager

#### `createSpinner(text, options)`
Create a basic spinner.

**Parameters:**
- `text` (string): Loading message
- `options` (object): Spinner configuration

**Returns:** SpinnerManager instance

#### `createProgressBar(title, options)`
Create a progress bar.

**Parameters:**
- `title` (string): Progress bar title
- `options` (object): Configuration

**Returns:** ProgressBarManager instance

#### `createTaskList(title, tasks, options)`
Create a task list.

**Parameters:**
- `title` (string): List title
- `tasks` (array): Task titles
- `options` (object): Configuration

**Returns:** TaskListManager instance

### Status Messages

#### `success(message, options)`
Display success message.

#### `error(message, options)`
Display error message.

#### `warning(message, options)`
Display warning message.

#### `info(message, options)`
Display info message.

#### `celebrate(message, options)`
Display celebration with optional ASCII art.

## 🤝 Contributing

When adding new progress indicators:

1. Follow existing patterns
2. Add examples to `examples.js`
3. Update this README
4. Ensure consistent styling
5. Test with real operations

## 📄 License

MIT License - Part of TryForge Framework

---

**Created by:** TryForge Team
**Version:** 1.0.0
**Last Updated:** 2025-11-02
