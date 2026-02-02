/**
 * Cron Job Scheduler
 *
 * Manages and runs all scheduled jobs using node-cron.
 *
 * Usage:
 *   npm run scheduler       # Start the scheduler daemon
 *   npm run scheduler:once  # Run all enabled jobs once (for testing)
 */

import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { scheduledJobs, getEnabledJobs, describeSchedule, type ScheduledJob } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

const prisma = new PrismaClient();

interface JobResult {
  success: boolean;
  duration: number;
  error?: string;
  output?: string;
}

/**
 * Log job execution to database
 */
async function logJobExecution(
  job: ScheduledJob,
  status: 'started' | 'completed' | 'failed',
  result?: JobResult
): Promise<void> {
  try {
    await prisma.googleTrendsJobLog.create({
      data: {
        jobType: job.name,
        status,
        keywordCount: null,
        errorMessage: result?.error || null,
        duration: result?.duration ? Math.round(result.duration / 1000) : null,
      },
    });
  } catch (error) {
    console.error(`[Scheduler] Failed to log job execution:`, error);
  }
}

/**
 * Run a single job script
 */
async function runJob(job: ScheduledJob): Promise<JobResult> {
  const startTime = Date.now();
  const scriptPath = path.resolve(ROOT_DIR, job.script);

  console.log(`[${new Date().toISOString()}] Starting job: ${job.name}`);
  console.log(`  Script: ${job.script}`);

  await logJobExecution(job, 'started');

  return new Promise((resolve) => {
    const timeout = job.timeout || 30 * 60 * 1000; // Default 30 minutes
    let output = '';
    let killed = false;

    const child = spawn('npx', ['tsx', scriptPath], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' },
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      console.error(`[${new Date().toISOString()}] Job ${job.name} timed out after ${timeout / 1000}s`);
    }, timeout);

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(`  [${job.name}] ${text}`);
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(`  [${job.name}] ${text}`);
    });

    child.on('close', async (code) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (killed) {
        const result: JobResult = {
          success: false,
          duration,
          error: `Job timed out after ${timeout / 1000} seconds`,
          output,
        };
        await logJobExecution(job, 'failed', result);
        resolve(result);
      } else if (code === 0) {
        const result: JobResult = { success: true, duration, output };
        await logJobExecution(job, 'completed', result);
        console.log(`[${new Date().toISOString()}] Job ${job.name} completed in ${(duration / 1000).toFixed(1)}s`);
        resolve(result);
      } else {
        const result: JobResult = {
          success: false,
          duration,
          error: `Exit code: ${code}`,
          output,
        };
        await logJobExecution(job, 'failed', result);
        console.error(`[${new Date().toISOString()}] Job ${job.name} failed with code ${code}`);
        resolve(result);
      }
    });

    child.on('error', async (error) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      const result: JobResult = {
        success: false,
        duration,
        error: error.message,
        output,
      };
      await logJobExecution(job, 'failed', result);
      console.error(`[${new Date().toISOString()}] Job ${job.name} error:`, error.message);
      resolve(result);
    });
  });
}

/**
 * Start the scheduler daemon
 */
function startScheduler(): void {
  const enabledJobs = getEnabledJobs();

  console.log('============================================');
  console.log('  Kitvas Cron Scheduler');
  console.log('============================================');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Timezone: UTC`);
  console.log(`Enabled jobs: ${enabledJobs.length}`);
  console.log('');

  for (const job of enabledJobs) {
    console.log(`  [${job.name}]`);
    console.log(`    ${job.description}`);
    console.log(`    Schedule: ${describeSchedule(job.schedule)}`);
    console.log('');

    // Validate cron expression
    if (!cron.validate(job.schedule)) {
      console.error(`    ERROR: Invalid cron expression!`);
      continue;
    }

    // Schedule the job
    cron.schedule(
      job.schedule,
      () => {
        runJob(job).catch((error) => {
          console.error(`[${new Date().toISOString()}] Unhandled error in job ${job.name}:`, error);
        });
      },
      {
        timezone: 'UTC',
      }
    );
  }

  console.log('============================================');
  console.log('Scheduler running. Press Ctrl+C to stop.');
  console.log('============================================');
  console.log('');

  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\nShutting down scheduler...');
    prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down...');
    prisma.$disconnect();
    process.exit(0);
  });
}

/**
 * Run all enabled jobs once (for testing)
 */
async function runAllOnce(): Promise<void> {
  const enabledJobs = getEnabledJobs();

  console.log('============================================');
  console.log('  Running all enabled jobs once');
  console.log('============================================');
  console.log(`Jobs to run: ${enabledJobs.length}`);
  console.log('');

  const results: { job: string; success: boolean; duration: number; error?: string }[] = [];

  for (const job of enabledJobs) {
    const result = await runJob(job);
    results.push({
      job: job.name,
      success: result.success,
      duration: result.duration,
      error: result.error,
    });
    console.log('');
  }

  console.log('============================================');
  console.log('  Summary');
  console.log('============================================');
  for (const r of results) {
    const status = r.success ? '✓' : '✗';
    const duration = (r.duration / 1000).toFixed(1);
    console.log(`  ${status} ${r.job} (${duration}s)${r.error ? ` - ${r.error}` : ''}`);
  }

  const passed = results.filter((r) => r.success).length;
  console.log('');
  console.log(`Result: ${passed}/${results.length} jobs succeeded`);

  await prisma.$disconnect();
}

/**
 * Run a specific job by name
 */
async function runSingleJob(jobName: string): Promise<void> {
  const job = scheduledJobs.find((j) => j.name === jobName);

  if (!job) {
    console.error(`Job not found: ${jobName}`);
    console.log('Available jobs:');
    for (const j of scheduledJobs) {
      console.log(`  - ${j.name}`);
    }
    process.exit(1);
  }

  console.log(`Running job: ${job.name}`);
  const result = await runJob(job);

  if (!result.success) {
    console.error('Job failed:', result.error);
    process.exit(1);
  }

  console.log('Job completed successfully');
  await prisma.$disconnect();
}

/**
 * List all configured jobs
 */
function listJobs(): void {
  console.log('============================================');
  console.log('  Configured Cron Jobs');
  console.log('============================================');
  console.log('');

  for (const job of scheduledJobs) {
    const status = job.enabled ? '✓ Enabled' : '✗ Disabled';
    console.log(`[${job.name}] ${status}`);
    console.log(`  ${job.description}`);
    console.log(`  Schedule: ${describeSchedule(job.schedule)} (${job.schedule})`);
    console.log(`  Script: ${job.script}`);
    console.log(`  Timeout: ${(job.timeout || 30 * 60 * 1000) / 1000 / 60} minutes`);
    console.log('');
  }
}

// CLI handling
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'run':
    if (args[1]) {
      runSingleJob(args[1]);
    } else {
      console.error('Usage: scheduler run <job-name>');
      process.exit(1);
    }
    break;

  case 'once':
    runAllOnce();
    break;

  case 'list':
    listJobs();
    break;

  case 'start':
  default:
    startScheduler();
    break;
}
