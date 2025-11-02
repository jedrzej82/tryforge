/**
 * Background Job Processor
 * Queue-based job processing with Bull and Redis
 */

const Queue = require('bull');
const Logger = require('../utils/logger');

class JobProcessor {
  constructor(redisConfig = {}) {
    this.redis = {
      host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig.port || process.env.REDIS_PORT || 6379,
      password: redisConfig.password || process.env.REDIS_PASSWORD
    };
    
    this.queues = {};
    this.logger = new Logger();
  }

  /**
   * Create a new job queue
   */
  createQueue(name, options = {}) {
    if (this.queues[name]) {
      return this.queues[name];
    }

    this.logger.info(`Creating queue: ${name}`);
    
    const queue = new Queue(name, {
      redis: this.redis,
      defaultJobOptions: {
        attempts: options.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: options.backoffDelay || 2000
        },
        removeOnComplete: options.removeOnComplete !== false,
        removeOnFail: false
      }
    });

    this.queues[name] = queue;
    return queue;
  }

  /**
   * Add a job to queue
   */
  async addJob(queueName, jobData, options = {}) {
    const queue = this.queues[queueName] || this.createQueue(queueName);
    
    const job = await queue.add(jobData, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      jobId: options.jobId
    });

    this.logger.info(`Job added to ${queueName}: ${job.id}`);
    return job;
  }

  /**
   * Process jobs from queue
   */
  processQueue(queueName, processor, options = {}) {
    const queue = this.queues[queueName] || this.createQueue(queueName);
    const concurrency = options.concurrency || 1;

    this.logger.info(`Processing queue: ${queueName} (concurrency: ${concurrency})`);

    queue.process(concurrency, async (job) => {
      this.logger.info(`Processing job ${job.id} from ${queueName}`);
      
      try {
        const result = await processor(job.data, job);
        this.logger.success(`Job ${job.id} completed`);
        return result;
      } catch (error) {
        this.logger.error(`Job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Event listeners
    queue.on('completed', (job, result) => {
      this.logger.debug(`Job ${job.id} completed with result:`, result);
    });

    queue.on('failed', (job, err) => {
      this.logger.error(`Job ${job.id} failed:`, err.message);
    });

    queue.on('stalled', (job) => {
      this.logger.warn(`Job ${job.id} stalled`);
    });

    return queue;
  }

  /**
   * Schedule recurring job
   */
  async scheduleJob(queueName, jobData, cronSchedule, options = {}) {
    const queue = this.queues[queueName] || this.createQueue(queueName);
    
    const job = await queue.add(jobData, {
      repeat: {
        cron: cronSchedule,
        tz: options.timezone || 'UTC'
      },
      jobId: options.jobId || `scheduled-${queueName}-${Date.now()}`
    });

    this.logger.info(`Scheduled job in ${queueName}: ${cronSchedule}`);
    return job;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    return {
      queue: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  /**
   * Clean completed jobs
   */
  async cleanQueue(queueName, grace = 24 * 3600 * 1000) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
    
    this.logger.info(`Cleaned queue: ${queueName}`);
  }

  /**
   * Close all queues
   */
  async close() {
    this.logger.info('Closing all queues...');
    
    const closePromises = Object.values(this.queues).map(queue => queue.close());
    await Promise.all(closePromises);
    
    this.logger.info('All queues closed');
  }
}

// Example job processors
const exampleProcessors = {
  /**
   * Email sending job
   */
  async sendEmail(data) {
    const { to, subject, body } = data;
    // Implement email sending logic
    console.log(`Sending email to ${to}: ${subject}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { sent: true, to };
  },

  /**
   * Report generation job
   */
  async generateReport(data) {
    const { reportType, params } = data;
    console.log(`Generating ${reportType} report`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return { reportId: `report-${Date.now()}`, type: reportType };
  },

  /**
   * Data import job
   */
  async importData(data) {
    const { source, destination } = data;
    console.log(`Importing data from ${source} to ${destination}`);
    await new Promise(resolve => setTimeout(resolve, 10000));
    return { imported: true, recordCount: 1000 };
  }
};

module.exports = JobProcessor;
module.exports.exampleProcessors = exampleProcessors;
