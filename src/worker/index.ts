/**
 * Agency OS — Background Worker
 *
 * This process connects to Redis and processes async jobs from BullMQ.
 * It runs independently from the Next.js web app.
 *
 * To run locally: npm run worker:dev
 * In production: runs as a separate Docker container
 */
import { Worker, type Job } from "bullmq";
import { type JobName, type JobData } from "@/lib/queue";
import { getRedisUrl, getDatabaseUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import { processAgentBriefing } from "./jobs/agent-briefing";
import { processGitHubSync } from "./jobs/github-sync";

const QUEUE_NAME = "agency-jobs";

function getRedisConnection() {
  const parsed = new URL(getRedisUrl());
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
  };
}

// ─── Job router ───────────────────────────────────────────────────────────────

async function processJob(job: Job<JobData, unknown, JobName>) {
  logger.info("Processing worker job", { jobName: job.name, jobId: job.id?.toString() });

  switch (job.name) {
    case "agent:generate-briefing":
      return processAgentBriefing(job.data as Parameters<typeof processAgentBriefing>[0]);

    case "github:sync-repo":
      return processGitHubSync(job.data as Parameters<typeof processGitHubSync>[0]);

    case "email:ingest":
      // Future: email parsing implementation
      logger.info("email:ingest job received but is not implemented yet");
      return { skipped: true };

    default:
      logger.warn("Unknown worker job name", { jobName: (job as Job).name });
      return null;
  }
}

// ─── Worker startup ───────────────────────────────────────────────────────────

function startWorker() {
  const connection = getRedisConnection();

  const worker = new Worker<JobData, unknown, JobName>(
    QUEUE_NAME,
    processJob,
    {
      connection,
      concurrency: 5, // process up to 5 jobs in parallel
      limiter: {
        max: 10,
        duration: 1000, // max 10 jobs per second
      },
    }
  );

  worker.on("completed", (job) => {
    logger.info("Worker job completed", { jobName: job.name, jobId: job.id?.toString() });
  });

  worker.on("failed", (job, err) => {
    logger.error("Worker job failed", err, {
      jobName: job?.name ?? "unknown",
      jobId: job?.id?.toString(),
    });
  });

  worker.on("error", (err) => {
    logger.error("Worker process error", err);
  });

  const redisUrl = new URL(getRedisUrl());
  const databaseUrl = new URL(getDatabaseUrl());
  logger.info("Worker started", {
    queueName: QUEUE_NAME,
    redisHost: redisUrl.hostname,
    redisPort: redisUrl.port || "6379",
    databaseHost: databaseUrl.hostname,
    databasePort: databaseUrl.port || "5432",
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting worker down gracefully");
    await worker.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startWorker();
