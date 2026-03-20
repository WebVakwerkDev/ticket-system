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
import { type JobName, type JobData, QUEUE_NAME, getRedisConnection } from "@/lib/queue";
import { logger } from "@/lib/logger";
import { processAgentBriefing } from "./jobs/agent-briefing";
import { processGitHubSync } from "./jobs/github-sync";

// ─── Job router ───────────────────────────────────────────────────────────────

async function processJob(job: Job<JobData, unknown, JobName>) {
  logger.info("Processing worker job", { jobName: job.name, jobId: job.id?.toString() });

  switch (job.name) {
    case "agent:generate-briefing":
      return processAgentBriefing(job.data as Parameters<typeof processAgentBriefing>[0]);

    case "github:sync-repo":
      return processGitHubSync(job.data as Parameters<typeof processGitHubSync>[0]);

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

  logger.info("Worker started", { queueName: QUEUE_NAME });

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
