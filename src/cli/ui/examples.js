/**
 * TryForge CLI - Progress System Usage Examples
 *
 * Comprehensive examples demonstrating all progress indicators and animations
 */

const {
  createSpinner,
  createProgressBar,
  createTaskList,
  createMultiBar,
  operationSpinners,
  patterns,
  success,
  error,
  warning,
  info,
  celebrate,
  colors,
  icons,
  asciiArt
} = require('./progress');

/**
 * Example 1: Basic Spinner
 */
async function basicSpinnerExample() {
  console.log('\n' + colors.bold('Example 1: Basic Spinner') + '\n');

  const spinner = createSpinner('Loading data...');

  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 2000));

  spinner.succeed('Data loaded successfully!');
}

/**
 * Example 2: Operation-Specific Spinners
 */
async function operationSpinnersExample() {
  console.log('\n' + colors.bold('Example 2: Operation-Specific Spinners') + '\n');

  // Generating code
  const genSpinner = operationSpinners.generating('UserModel.js');
  await new Promise(resolve => setTimeout(resolve, 1500));
  genSpinner.succeed('Generated UserModel.js');

  // Installing packages
  const installSpinner = operationSpinners.installing('react');
  await new Promise(resolve => setTimeout(resolve, 1500));
  installSpinner.succeed('Installed react');

  // Building project
  const buildSpinner = operationSpinners.building('production');
  await new Promise(resolve => setTimeout(resolve, 1500));
  buildSpinner.succeed('Built production bundle');
}

/**
 * Example 3: Progress Bar
 */
async function progressBarExample() {
  console.log('\n' + colors.bold('Example 3: Progress Bar') + '\n');

  const bar = createProgressBar('Installing dependencies');
  bar.start(100, 0);

  // Simulate progress
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 200));
    bar.update(i);
  }

  bar.stop();
  success('All dependencies installed');
}

/**
 * Example 4: Task List
 */
async function taskListExample() {
  console.log('\n' + colors.bold('Example 4: Task List') + '\n');

  const tasks = createTaskList('Building Application', [
    'Clean build directory',
    'Compile TypeScript',
    'Bundle assets',
    'Optimize images',
    'Generate sitemap'
  ]);

  tasks.start();

  // Execute tasks
  for (let i = 0; i < 5; i++) {
    tasks.startTask(i);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simulate occasional failure
    if (i === 3) {
      tasks.failTask(i, 'Image optimization failed');
    } else {
      tasks.completeTask(i);
    }
  }

  tasks.complete();
}

/**
 * Example 5: Multi-Bar Progress
 */
async function multiBarExample() {
  console.log('\n' + colors.bold('Example 5: Multi-Bar Progress') + '\n');

  const multibar = createMultiBar();

  // Add multiple progress bars
  const files = [
    { id: 'file1', name: 'component.js', total: 100 },
    { id: 'file2', name: 'styles.css', total: 100 },
    { id: 'file3', name: 'index.html', total: 100 }
  ];

  files.forEach(file => {
    multibar.add(file.id, file.name, file.total);
  });

  // Simulate file processing
  for (let i = 0; i <= 100; i += 20) {
    await new Promise(resolve => setTimeout(resolve, 300));

    files.forEach(file => {
      multibar.update(file.id, i + Math.random() * 10);
    });
  }

  // Complete all bars
  files.forEach(file => {
    multibar.complete(file.id);
  });

  multibar.stop();
  success('All files processed');
}

/**
 * Example 6: Multi-Step Process Pattern
 */
async function multiStepPatternExample() {
  console.log('\n' + colors.bold('Example 6: Multi-Step Process Pattern') + '\n');

  await patterns.multiStep('Setting up project', [
    {
      title: 'Initialize repository',
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    },
    {
      title: 'Install dependencies',
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    },
    {
      title: 'Configure environment',
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    },
    {
      title: 'Run initial build',
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    }
  ]);
}

/**
 * Example 7: Parallel Operations Pattern
 */
async function parallelOperationsExample() {
  console.log('\n' + colors.bold('Example 7: Parallel Operations') + '\n');

  const results = await patterns.parallel('Processing services', [
    {
      id: 'api',
      title: 'Starting API server',
      successMessage: 'API server started',
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { port: 3000 };
      }
    },
    {
      id: 'db',
      title: 'Connecting to database',
      successMessage: 'Database connected',
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { connected: true };
      }
    },
    {
      id: 'cache',
      title: 'Initializing cache',
      successMessage: 'Cache initialized',
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { ready: true };
      }
    }
  ]);

  console.log('\nResults:', results);
}

/**
 * Example 8: Status Messages
 */
function statusMessagesExample() {
  console.log('\n' + colors.bold('Example 8: Status Messages') + '\n');

  success('Operation completed successfully!');
  error('An error occurred');
  warning('This is a warning message');
  info('Here is some information');
}

/**
 * Example 9: Celebration
 */
function celebrationExample() {
  console.log('\n' + colors.bold('Example 9: Celebration') + '\n');

  celebrate('Project created successfully!', { showArt: true });
}

/**
 * Example 10: Custom Animations
 */
async function customAnimationsExample() {
  console.log('\n' + colors.bold('Example 10: ASCII Art') + '\n');

  console.log(asciiArt.rocket);
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(asciiArt.trophy);
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(asciiArt.celebration);
}

/**
 * Example 11: File Operations Progress
 */
async function fileOperationsExample() {
  console.log('\n' + colors.bold('Example 11: File Operations') + '\n');

  const spinner = operationSpinners.fileOperation('copying', 'project.zip');
  await new Promise(resolve => setTimeout(resolve, 2000));
  spinner.succeed('Copied project.zip');

  const readSpinner = operationSpinners.fileOperation('reading', 'config.json');
  await new Promise(resolve => setTimeout(resolve, 1000));
  readSpinner.succeed('Read config.json');

  const writeSpinner = operationSpinners.fileOperation('writing', 'output.txt');
  await new Promise(resolve => setTimeout(resolve, 1500));
  writeSpinner.succeed('Wrote output.txt');
}

/**
 * Example 12: Database Operations
 */
async function databaseOperationsExample() {
  console.log('\n' + colors.bold('Example 12: Database Operations') + '\n');

  const connectSpinner = operationSpinners.database('connecting');
  await new Promise(resolve => setTimeout(resolve, 1500));
  connectSpinner.succeed('Connected to database');

  const migrateSpinner = operationSpinners.database('migrating');
  await new Promise(resolve => setTimeout(resolve, 2000));
  migrateSpinner.succeed('Migrations complete');

  const seedSpinner = operationSpinners.database('seeding');
  await new Promise(resolve => setTimeout(resolve, 1000));
  seedSpinner.succeed('Database seeded');
}

/**
 * Example 13: AI Operations
 */
async function aiOperationsExample() {
  console.log('\n' + colors.bold('Example 13: AI Operations') + '\n');

  const thinkingSpinner = operationSpinners.ai('thinking');
  await new Promise(resolve => setTimeout(resolve, 2000));
  thinkingSpinner.succeed('Analysis complete');

  const generatingSpinner = operationSpinners.ai('generating');
  await new Promise(resolve => setTimeout(resolve, 2500));
  generatingSpinner.succeed('Code generated');
}

/**
 * Example 14: Network Operations
 */
async function networkOperationsExample() {
  console.log('\n' + colors.bold('Example 14: Network Operations') + '\n');

  const downloadSpinner = operationSpinners.network('downloading');
  await new Promise(resolve => setTimeout(resolve, 2000));
  downloadSpinner.succeed('Download complete');

  const uploadSpinner = operationSpinners.network('uploading');
  await new Promise(resolve => setTimeout(resolve, 1500));
  uploadSpinner.succeed('Upload complete');

  const syncSpinner = operationSpinners.network('syncing');
  await new Promise(resolve => setTimeout(resolve, 1800));
  syncSpinner.succeed('Sync complete');
}

/**
 * Example 15: Complete Project Generation Flow
 */
async function completeProjectFlowExample() {
  console.log('\n' + colors.bold('Example 15: Complete Project Generation Flow') + '\n');

  const mainTasks = createTaskList('Generating Full Stack Application', [
    'Analyze requirements',
    'Generate frontend',
    'Generate backend',
    'Setup database',
    'Create documentation',
    'Run tests'
  ]);

  mainTasks.start();

  // Task 1: Analyze requirements
  mainTasks.startTask(0);
  const analyzeSpinner = operationSpinners.ai('analyzing');
  await new Promise(resolve => setTimeout(resolve, 1500));
  analyzeSpinner.succeed('Requirements analyzed');
  mainTasks.completeTask(0);

  // Task 2: Generate frontend
  mainTasks.startTask(1);
  const frontendBar = createProgressBar('Generating frontend components');
  frontendBar.start(100, 0);
  for (let i = 0; i <= 100; i += 25) {
    await new Promise(resolve => setTimeout(resolve, 400));
    frontendBar.update(i);
  }
  frontendBar.stop();
  mainTasks.completeTask(1);

  // Task 3: Generate backend
  mainTasks.startTask(2);
  const backendBar = createProgressBar('Generating backend services');
  backendBar.start(100, 0);
  for (let i = 0; i <= 100; i += 20) {
    await new Promise(resolve => setTimeout(resolve, 300));
    backendBar.update(i);
  }
  backendBar.stop();
  mainTasks.completeTask(2);

  // Task 4: Setup database
  mainTasks.startTask(3);
  const dbSpinner = operationSpinners.database('migrating');
  await new Promise(resolve => setTimeout(resolve, 1200));
  dbSpinner.succeed('Database setup complete');
  mainTasks.completeTask(3);

  // Task 5: Create documentation
  mainTasks.startTask(4);
  const docsSpinner = operationSpinners.generating('README.md');
  await new Promise(resolve => setTimeout(resolve, 800));
  docsSpinner.succeed('Documentation created');
  mainTasks.completeTask(4);

  // Task 6: Run tests
  mainTasks.startTask(5);
  const testSpinner = operationSpinners.testing();
  await new Promise(resolve => setTimeout(resolve, 1500));
  testSpinner.succeed('All tests passed');
  mainTasks.completeTask(5);

  mainTasks.complete();

  celebrate('Full stack application generated successfully!', { showArt: true });

  console.log('\n' + colors.bold('Summary:'));
  console.log(colors.success('✓ Frontend: 15 components'));
  console.log(colors.success('✓ Backend: 8 API endpoints'));
  console.log(colors.success('✓ Database: 12 tables'));
  console.log(colors.success('✓ Tests: 45/45 passing'));
  console.log(colors.muted('\nTotal time: 12.3s'));
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log(colors.bold.cyan('\n========================================'));
  console.log(colors.bold.cyan('  TryForge Progress System Examples'));
  console.log(colors.bold.cyan('========================================\n'));

  try {
    await basicSpinnerExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await operationSpinnersExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await progressBarExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await taskListExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await multiBarExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await multiStepPatternExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await parallelOperationsExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    statusMessagesExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    celebrationExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await customAnimationsExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await fileOperationsExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await databaseOperationsExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await aiOperationsExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await networkOperationsExample();
    await new Promise(resolve => setTimeout(resolve, 500));

    await completeProjectFlowExample();

    console.log('\n' + colors.bold.green('All examples completed successfully!') + '\n');
  } catch (err) {
    error('Example execution failed', { error: err });
  }
}

// Export examples
module.exports = {
  basicSpinnerExample,
  operationSpinnersExample,
  progressBarExample,
  taskListExample,
  multiBarExample,
  multiStepPatternExample,
  parallelOperationsExample,
  statusMessagesExample,
  celebrationExample,
  customAnimationsExample,
  fileOperationsExample,
  databaseOperationsExample,
  aiOperationsExample,
  networkOperationsExample,
  completeProjectFlowExample,
  runAllExamples
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
