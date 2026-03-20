/**
 * BullMQ queue client — shared between web and worker.
 *
 * The web app enqueues jobs here.
 * The worker (src/worker/index.ts) processes them.
 *
 * Redis connection is configured via REDIS_URL env var.
 */
import { Queue, type ConnectionOptions } from "bullmq";
import { getRedisUrl } from "@/lib/env";

// ─── Job type definitions ─────────────────────────────────────────────────────

export type AgentBriefingJobData = {
  projectId: string;
  changeRequestId: string | null;
  actorUserId: string;
};

export type InvoiceReminderJobData = {
  invoiceId: string;
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
};

export type GitHubSyncJobData = {
  projectId: string;
  repositoryId: string;
  actorUserId: string;
};

export type JobData =
  | AgentBriefingJobData
  | InvoiceReminderJobData
  | GitHubSyncJobData

export type JobName =
  | "agent:generate-briefing"
  | "invoice:send-reminder"
  | "github:sync-repo"

// ─── Redis connection ─────────────────────────────────────────────────────────

export function getRedisConnection(): ConnectionOptions {
  const parsed = new URL(getRedisUrl());
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    tls: parsed.protocol === "rediss:" ? {} : undefined,
  };
}

// ─── Queue singleton ──────────────────────────────────────────────────────────

export const QUEUE_NAME = "agency-jobs";

let _queue: Queue | null = null;

export function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return _queue;
}

// ─── Helper to enqueue a job ──────────────────────────────────────────────────

export async function enqueueJob(name: JobName, data: JobData, opts?: { delay?: number; priority?: number }) {
  const queue = getQueue();
  const job = await queue.add(name, data, {
    delay: opts?.delay,
    priority: opts?.priority,
  });
  return job;
}
