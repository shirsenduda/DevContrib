import prisma from '@/lib/db';

export type NotificationType =
  | 'PR_MERGED'
  | 'PR_CLOSED'
  | 'PR_WAITING_5D'
  | 'PR_WAITING_10D'
  | 'CONTRIBUTION_REMINDER';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  ctaUrl?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({ data: input });
}

/* ─── Typed helpers for each event ─── */

export async function notifyPRMerged(
  userId: string,
  opts: { repoFullName: string; issueTitle: string; prNumber: number; prUrl: string },
) {
  return createNotification({
    userId,
    type: 'PR_MERGED',
    title: `🎉 PR #${opts.prNumber} merged!`,
    body: `Your PR on ${opts.repoFullName} was merged. Congratulations — your contribution is live!`,
    ctaUrl: opts.prUrl,
  });
}

export async function notifyPRClosed(
  userId: string,
  opts: { repoFullName: string; issueTitle: string; prNumber: number; prUrl: string },
) {
  return createNotification({
    userId,
    type: 'PR_CLOSED',
    title: `PR #${opts.prNumber} was closed`,
    body: `Your PR on ${opts.repoFullName} was closed without merging. Don't give up — pick a new issue!`,
    ctaUrl: opts.prUrl,
  });
}

export async function notifyPRWaiting5d(
  userId: string,
  opts: { repoFullName: string; issueTitle: string; prNumber: number; prUrl: string },
) {
  return createNotification({
    userId,
    type: 'PR_WAITING_5D',
    title: `PR #${opts.prNumber} waiting 5 days`,
    body: `Your PR on ${opts.repoFullName} hasn't been reviewed yet. Check CI status and leave a polite comment.`,
    ctaUrl: opts.prUrl,
  });
}

export async function notifyPRWaiting10d(
  userId: string,
  opts: { repoFullName: string; issueTitle: string; prNumber: number; prUrl: string },
) {
  return createNotification({
    userId,
    type: 'PR_WAITING_10D',
    title: `PR #${opts.prNumber} waiting 10 days`,
    body: `Your PR on ${opts.repoFullName} is still open after 10 days. Try tagging a maintainer or starting a parallel contribution.`,
    ctaUrl: opts.prUrl,
  });
}

export async function notifyContributionReminder(
  userId: string,
  opts: { repoFullName: string; issueTitle: string },
) {
  return createNotification({
    userId,
    type: 'CONTRIBUTION_REMINDER',
    title: 'Have you made progress?',
    body: `You started working on "${opts.issueTitle}" in ${opts.repoFullName} 7 days ago. Ready to open a PR?`,
    ctaUrl: '/contributions',
  });
}
