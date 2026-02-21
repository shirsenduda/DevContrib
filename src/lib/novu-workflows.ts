import { workflow } from '@novu/framework';

export const prMergedWorkflow = workflow(
  'dc-pr-merged',
  async ({ step, payload }) => {
    await step.inApp('notify', async () => ({
      subject: 'PR Merged!',
      body: `Your PR #${payload.prNumber} on ${payload.repoFullName} has been merged! Congratulations!`,
      primaryAction: {
        label: 'View PR',
        redirect: { url: payload.prUrl || '#', target: '_blank' as const },
      },
    }));
  },
  {
    name: 'PR Merged',
    description: 'Notifies when a pull request is merged',
    payloadSchema: {
      type: 'object' as const,
      properties: {
        repoFullName: { type: 'string' as const, default: '' },
        issueTitle: { type: 'string' as const, default: '' },
        prNumber: { type: 'number' as const, default: 0 },
        prUrl: { type: 'string' as const, default: '' },
      },
      required: ['repoFullName', 'issueTitle'] as const,
      additionalProperties: false as const,
    },
  },
);

export const prClosedWorkflow = workflow(
  'dc-pr-closed',
  async ({ step, payload }) => {
    await step.inApp('notify', async () => ({
      subject: 'PR Closed',
      body: `Your PR #${payload.prNumber} on ${payload.repoFullName} was closed without merging. Consider picking a new issue!`,
      primaryAction: {
        label: 'Find Issues',
        redirect: { url: '/explore', target: '_self' as const },
      },
    }));
  },
  {
    name: 'PR Closed',
    description: 'Notifies when a pull request is closed without merging',
    payloadSchema: {
      type: 'object' as const,
      properties: {
        repoFullName: { type: 'string' as const, default: '' },
        issueTitle: { type: 'string' as const, default: '' },
        prNumber: { type: 'number' as const, default: 0 },
        prUrl: { type: 'string' as const, default: '' },
      },
      required: ['repoFullName', 'issueTitle'] as const,
      additionalProperties: false as const,
    },
  },
);

export const contributionReminderWorkflow = workflow(
  'dc-contribution-reminder',
  async ({ step, payload }) => {
    await step.inApp('notify', async () => ({
      subject: 'Contribution Reminder',
      body: `You started working on "${payload.issueTitle}" in ${payload.repoFullName} ${payload.daysRemaining} days ago. Keep going or consider abandoning if you're stuck!`,
      primaryAction: {
        label: 'View Contributions',
        redirect: { url: '/contributions', target: '_self' as const },
      },
    }));
  },
  {
    name: 'Contribution Reminder',
    description: 'Reminds users about stale started contributions',
    payloadSchema: {
      type: 'object' as const,
      properties: {
        repoFullName: { type: 'string' as const, default: '' },
        issueTitle: { type: 'string' as const, default: '' },
        daysRemaining: { type: 'number' as const, default: 7 },
      },
      required: ['repoFullName', 'issueTitle', 'daysRemaining'] as const,
      additionalProperties: false as const,
    },
  },
);

export const prWaiting5dWorkflow = workflow(
  'dc-pr-waiting-5d',
  async ({ step, payload }) => {
    await step.inApp('notify', async () => ({
      subject: 'PR Waiting 5 Days',
      body: `Your PR #${payload.prNumber} on ${payload.repoFullName} has been waiting for review for ${payload.daysWaiting} days. Check if your CI is passing and leave a polite "Ready for review!" comment.`,
      primaryAction: {
        label: 'View PR',
        redirect: { url: payload.prUrl || '#', target: '_blank' as const },
      },
    }));
  },
  {
    name: 'PR Waiting 5 Days',
    description: 'Nudge when a PR has been waiting 5 days for review',
    payloadSchema: {
      type: 'object' as const,
      properties: {
        repoFullName: { type: 'string' as const, default: '' },
        issueTitle: { type: 'string' as const, default: '' },
        prNumber: { type: 'number' as const, default: 0 },
        prUrl: { type: 'string' as const, default: '' },
        daysWaiting: { type: 'number' as const, default: 5 },
        tips: { type: 'array' as const, items: { type: 'string' as const }, default: [] },
      },
      required: ['repoFullName', 'issueTitle', 'daysWaiting'] as const,
      additionalProperties: false as const,
    },
  },
);

export const prWaiting10dWorkflow = workflow(
  'dc-pr-waiting-10d',
  async ({ step, payload }) => {
    await step.inApp('notify', async () => ({
      subject: 'PR Waiting 10 Days',
      body: `Your PR #${payload.prNumber} on ${payload.repoFullName} has been open for ${payload.daysWaiting} days with no review. Try tagging a maintainer or start a parallel contribution.`,
      primaryAction: {
        label: 'View PR',
        redirect: { url: payload.prUrl || '#', target: '_blank' as const },
      },
    }));
  },
  {
    name: 'PR Waiting 10 Days',
    description: 'Alert when a PR has been waiting 10 days for review',
    payloadSchema: {
      type: 'object' as const,
      properties: {
        repoFullName: { type: 'string' as const, default: '' },
        issueTitle: { type: 'string' as const, default: '' },
        prNumber: { type: 'number' as const, default: 0 },
        prUrl: { type: 'string' as const, default: '' },
        daysWaiting: { type: 'number' as const, default: 10 },
        tips: { type: 'array' as const, items: { type: 'string' as const }, default: [] },
      },
      required: ['repoFullName', 'issueTitle', 'daysWaiting'] as const,
      additionalProperties: false as const,
    },
  },
);

export const allWorkflows = [
  prMergedWorkflow,
  prClosedWorkflow,
  contributionReminderWorkflow,
  prWaiting5dWorkflow,
  prWaiting10dWorkflow,
];
