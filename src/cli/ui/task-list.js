/**
 * TryForge CLI - Task List Manager
 *
 * Provides task list functionality for multi-step operations
 */

const { colors, icons } = require('./themes');
const { formatDuration } = require('./formatters');

/**
 * Task status enum
 */
const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  WARNING: 'warning'
};

/**
 * Task class
 */
class Task {
  constructor(title, options = {}) {
    this.title = title;
    this.status = TaskStatus.PENDING;
    this.startTime = null;
    this.endTime = null;
    this.error = null;
    this.warning = null;
    this.subtasks = [];
    this.metadata = options.metadata || {};
    this.indent = options.indent || 0;
  }

  /**
   * Start the task
   */
  start() {
    this.status = TaskStatus.IN_PROGRESS;
    this.startTime = Date.now();
    return this;
  }

  /**
   * Complete the task
   */
  complete() {
    this.status = TaskStatus.COMPLETED;
    this.endTime = Date.now();
    return this;
  }

  /**
   * Fail the task
   */
  fail(error = null) {
    this.status = TaskStatus.FAILED;
    this.endTime = Date.now();
    this.error = error;
    return this;
  }

  /**
   * Skip the task
   */
  skip() {
    this.status = TaskStatus.SKIPPED;
    this.endTime = Date.now();
    return this;
  }

  /**
   * Mark with warning
   */
  warn(warning) {
    this.status = TaskStatus.WARNING;
    this.endTime = Date.now();
    this.warning = warning;
    return this;
  }

  /**
   * Get duration
   */
  getDuration() {
    if (!this.startTime) return 0;
    const endTime = this.endTime || Date.now();
    return endTime - this.startTime;
  }

  /**
   * Add a subtask
   */
  addSubtask(title, options = {}) {
    const subtask = new Task(title, {
      ...options,
      indent: this.indent + 1
    });
    this.subtasks.push(subtask);
    return subtask;
  }

  /**
   * Get status icon
   */
  getIcon() {
    const iconMap = {
      [TaskStatus.PENDING]: colors.muted(icons.pending),
      [TaskStatus.IN_PROGRESS]: colors.primary(icons.inProgress),
      [TaskStatus.COMPLETED]: colors.success(icons.success),
      [TaskStatus.FAILED]: colors.error(icons.error),
      [TaskStatus.SKIPPED]: colors.muted('⊘'),
      [TaskStatus.WARNING]: colors.warning(icons.warning)
    };

    return iconMap[this.status] || icons.pending;
  }

  /**
   * Format task for display
   */
  format(options = {}) {
    const { showDuration = true, showSubtasks = true } = options;

    const indent = '  '.repeat(this.indent);
    const icon = this.getIcon();
    let output = `${indent}${icon} ${this.title}`;

    // Add duration if completed
    if (showDuration && this.endTime) {
      const duration = formatDuration(this.getDuration());
      output += ` ${colors.muted(`(${duration})`)}`;
    }

    // Add error message if failed
    if (this.error) {
      output += `\n${indent}  ${colors.error(`Error: ${this.error}`)}`;
    }

    // Add warning message if warned
    if (this.warning) {
      output += `\n${indent}  ${colors.warning(`Warning: ${this.warning}`)}`;
    }

    // Add subtasks
    if (showSubtasks && this.subtasks.length > 0) {
      const subtasksOutput = this.subtasks
        .map(subtask => subtask.format(options))
        .join('\n');
      output += '\n' + subtasksOutput;
    }

    return output;
  }
}

/**
 * Task list manager
 */
class TaskListManager {
  constructor(title, options = {}) {
    this.title = title;
    this.tasks = [];
    this.startTime = null;
    this.endTime = null;
    this.options = {
      clearOnComplete: false,
      showProgress: true,
      showDuration: true,
      showSummary: true,
      ...options
    };
  }

  /**
   * Add a task
   */
  add(title, options = {}) {
    const task = new Task(title, options);
    this.tasks.push(task);
    return task;
  }

  /**
   * Add multiple tasks
   */
  addMultiple(titles) {
    return titles.map(title => this.add(title));
  }

  /**
   * Get task by index
   */
  get(index) {
    return this.tasks[index];
  }

  /**
   * Start task list
   */
  start() {
    this.startTime = Date.now();
    this.render();
    return this;
  }

  /**
   * Complete task list
   */
  complete() {
    this.endTime = Date.now();
    this.render();
    return this;
  }

  /**
   * Start a task by index
   */
  startTask(index) {
    const task = this.tasks[index];
    if (task) {
      task.start();
      this.render();
    }
    return this;
  }

  /**
   * Complete a task by index
   */
  completeTask(index) {
    const task = this.tasks[index];
    if (task) {
      task.complete();
      this.render();
    }
    return this;
  }

  /**
   * Fail a task by index
   */
  failTask(index, error = null) {
    const task = this.tasks[index];
    if (task) {
      task.fail(error);
      this.render();
    }
    return this;
  }

  /**
   * Skip a task by index
   */
  skipTask(index) {
    const task = this.tasks[index];
    if (task) {
      task.skip();
      this.render();
    }
    return this;
  }

  /**
   * Warn a task by index
   */
  warnTask(index, warning) {
    const task = this.tasks[index];
    if (task) {
      task.warn(warning);
      this.render();
    }
    return this;
  }

  /**
   * Get task counts
   */
  getCounts() {
    const counts = {
      total: this.tasks.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      warning: 0
    };

    this.tasks.forEach(task => {
      switch (task.status) {
        case TaskStatus.PENDING:
          counts.pending++;
          break;
        case TaskStatus.IN_PROGRESS:
          counts.inProgress++;
          break;
        case TaskStatus.COMPLETED:
          counts.completed++;
          break;
        case TaskStatus.FAILED:
          counts.failed++;
          break;
        case TaskStatus.SKIPPED:
          counts.skipped++;
          break;
        case TaskStatus.WARNING:
          counts.warning++;
          break;
      }
    });

    return counts;
  }

  /**
   * Get progress percentage
   */
  getProgress() {
    const counts = this.getCounts();
    const finished = counts.completed + counts.failed + counts.skipped + counts.warning;
    return counts.total > 0 ? (finished / counts.total) * 100 : 0;
  }

  /**
   * Check if all tasks are complete
   */
  isComplete() {
    return this.tasks.every(task =>
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.FAILED ||
      task.status === TaskStatus.SKIPPED ||
      task.status === TaskStatus.WARNING
    );
  }

  /**
   * Check if any task failed
   */
  hasFailed() {
    return this.tasks.some(task => task.status === TaskStatus.FAILED);
  }

  /**
   * Render the task list
   */
  render() {
    // Clear previous output
    if (this.options.clearOnComplete && this.isComplete()) {
      console.clear();
    }

    // Print title
    if (this.title) {
      console.log('\n' + colors.bold(this.title));
      console.log(colors.muted('─'.repeat(this.title.length)) + '\n');
    }

    // Print tasks
    this.tasks.forEach(task => {
      console.log(task.format({
        showDuration: this.options.showDuration,
        showSubtasks: true
      }));
    });

    // Print progress
    if (this.options.showProgress) {
      const progress = Math.floor(this.getProgress());
      console.log(`\n${colors.muted(`Progress: ${progress}%`)}`);
    }

    // Print summary
    if (this.options.showSummary && this.isComplete()) {
      this.renderSummary();
    }

    console.log('');
  }

  /**
   * Render summary
   */
  renderSummary() {
    const counts = this.getCounts();
    const duration = this.endTime ? this.endTime - this.startTime : Date.now() - this.startTime;

    console.log('\n' + colors.bold('Summary:'));
    console.log(colors.muted('─'.repeat(50)));

    if (counts.completed > 0) {
      console.log(colors.success(`${icons.success} Completed: ${counts.completed}`));
    }
    if (counts.failed > 0) {
      console.log(colors.error(`${icons.error} Failed: ${counts.failed}`));
    }
    if (counts.warning > 0) {
      console.log(colors.warning(`${icons.warning} Warnings: ${counts.warning}`));
    }
    if (counts.skipped > 0) {
      console.log(colors.muted(`⊘ Skipped: ${counts.skipped}`));
    }

    console.log(colors.muted(`${icons.clock} Total time: ${formatDuration(duration)}`));
  }

  /**
   * Get a formatted summary string
   */
  getSummary() {
    const counts = this.getCounts();
    const parts = [];

    if (counts.completed > 0) parts.push(colors.success(`${counts.completed} completed`));
    if (counts.failed > 0) parts.push(colors.error(`${counts.failed} failed`));
    if (counts.warning > 0) parts.push(colors.warning(`${counts.warning} warnings`));
    if (counts.skipped > 0) parts.push(colors.muted(`${counts.skipped} skipped`));

    return parts.join(', ');
  }
}

/**
 * Collapsible task group
 */
class TaskGroup extends Task {
  constructor(title, options = {}) {
    super(title, options);
    this.isExpanded = options.expanded !== false;
    this.tasks = [];
  }

  /**
   * Add a task to the group
   */
  addTask(title, options = {}) {
    const task = new Task(title, {
      ...options,
      indent: this.indent + 1
    });
    this.tasks.push(task);
    return task;
  }

  /**
   * Toggle expansion
   */
  toggle() {
    this.isExpanded = !this.isExpanded;
    return this;
  }

  /**
   * Expand the group
   */
  expand() {
    this.isExpanded = true;
    return this;
  }

  /**
   * Collapse the group
   */
  collapse() {
    this.isExpanded = false;
    return this;
  }

  /**
   * Format task group for display
   */
  format(options = {}) {
    const { showDuration = true } = options;

    const indent = '  '.repeat(this.indent);
    const icon = this.getIcon();
    const expandIcon = this.isExpanded ? '▼' : '▶';
    let output = `${indent}${expandIcon} ${icon} ${this.title}`;

    // Add task count
    const completedTasks = this.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    output += ` ${colors.muted(`(${completedTasks}/${this.tasks.length})`)}`;

    // Add duration if completed
    if (showDuration && this.endTime) {
      const duration = formatDuration(this.getDuration());
      output += ` ${colors.muted(`${duration}`)}`;
    }

    // Add tasks if expanded
    if (this.isExpanded && this.tasks.length > 0) {
      const tasksOutput = this.tasks
        .map(task => task.format(options))
        .join('\n');
      output += '\n' + tasksOutput;
    }

    return output;
  }
}

/**
 * Create a task list
 */
function createTaskList(title, tasks = [], options = {}) {
  const taskList = new TaskListManager(title, options);

  if (Array.isArray(tasks)) {
    taskList.addMultiple(tasks);
  }

  return taskList;
}

/**
 * Create a task group
 */
function createTaskGroup(title, options = {}) {
  return new TaskGroup(title, options);
}

/**
 * Quick task list for simple use cases
 */
async function runTaskList(title, taskFunctions, options = {}) {
  const taskList = new TaskListManager(title, options);

  // Add all tasks
  const tasks = taskFunctions.map(({ title }) => taskList.add(title));

  taskList.start();

  // Run tasks sequentially
  for (let i = 0; i < taskFunctions.length; i++) {
    const task = tasks[i];
    const taskFn = taskFunctions[i].fn;

    task.start();
    taskList.render();

    try {
      await taskFn();
      task.complete();
    } catch (error) {
      task.fail(error.message);
    }

    taskList.render();
  }

  taskList.complete();

  return taskList;
}

module.exports = {
  TaskStatus,
  Task,
  TaskListManager,
  TaskGroup,
  createTaskList,
  createTaskGroup,
  runTaskList
};
