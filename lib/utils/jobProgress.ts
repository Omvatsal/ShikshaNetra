import type { JobStatus } from "@/lib/types/job";

type JobProgressInput = {
  status: JobStatus;
  progress?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  statusStartedAt?: Date | string;
};

function toMillis(d?: Date | string): number | null {
  if (!d) return null;
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  return Number.isFinite(t) ? t : null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Estimates progress between stage updates using an exponential CDF:
 *   f(t) = 1 - exp(-t / expected)
 * This approaches 1 asymptotically (a “probabilistic” time-to-complete curve).
 *
 * - Respects stage boundaries (min/max percentages)
 * - Never decreases below stored progress
 * - Caps at 95% until status becomes "completed"
 */
export function computeJobProgress(job: JobProgressInput, nowMs: number = Date.now()): number {
  const status = job.status;

  // Hard terminal states
  if (status === "completed") return 100;
  if (status === "failed") {
    const p = typeof job.progress === "number" ? job.progress : 0;
    return clamp(Math.round(p), 0, 100);
  }

  // Stage boundaries (must match backend stage percentages)
  const stageMin: Record<JobStatus, number> = {
    created: 0,
    uploading: 5,
    uploaded: 20,
    analyzing: 30,
    analysis_done: 70,
    generating_feedback: 80,
    completed: 100,
    failed: 0,
  };

  // Cap at 95% until completed
  const stageMax: Record<JobStatus, number> = {
    created: 5,
    uploading: 20,
    uploaded: 30,
    analyzing: 70,
    analysis_done: 80,
    generating_feedback: 95,
    completed: 100,
    failed: 0,
  };

  // Expected durations per stage (ms). Tune as needed.
  const expectedMs: Partial<Record<JobStatus, number>> = {
    created: 5_000,
    uploading: 90_000,
    uploaded: 10_000,
    analyzing: 240_000,
    analysis_done: 15_000,
    generating_feedback: 120_000,
  };

  const min = stageMin[status] ?? 0;
  const max = stageMax[status] ?? min;

  // If stage is effectively a checkpoint, return min/max.
  if (max <= min) {
    const stored = typeof job.progress === "number" ? job.progress : min;
    return clamp(Math.round(Math.max(stored, min)), 0, 95);
  }

  const startedAtMs =
    toMillis(job.statusStartedAt) ??
    toMillis(job.updatedAt) ??
    toMillis(job.createdAt) ??
    nowMs;

  const elapsed = Math.max(0, nowMs - startedAtMs);
  const expected = expectedMs[status] ?? 60_000;

  // Exponential CDF (approaches 1 as time increases)
  const frac = 1 - Math.exp(-elapsed / expected);
  const estimate = min + (max - min) * frac;

  const stored = typeof job.progress === "number" ? job.progress : 0;
  const combined = Math.max(stored, estimate, min);

  // Cap at 95 until completed
  return clamp(Math.round(combined), 0, 95);
}
