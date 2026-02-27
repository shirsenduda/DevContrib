'use client';

import { useState } from 'react';
import {
  ExternalLink,
  Clock,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  Hourglass,
  Check,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { ContributionStatus } from '@/types';

/* ─── PR Progress Pipeline ─── */
type PipelineStep = { label: string; key: ContributionStatus[] };

const PIPELINE_STEPS: PipelineStep[] = [
  { label: 'Started', key: ['STARTED', 'PR_OPENED', 'PR_MERGED', 'PR_CLOSED', 'ABANDONED'] },
  { label: 'PR Open', key: ['PR_OPENED', 'PR_MERGED', 'PR_CLOSED'] },
  { label: 'Merged', key: ['PR_MERGED'] },
];

function getPipelineIndex(status: ContributionStatus): number {
  if (status === 'PR_MERGED' || status === 'PR_CLOSED') return 2;
  if (status === 'PR_OPENED') return 1;
  return 0;
}

function PRPipeline({ status }: { status: ContributionStatus }) {
  if (status === 'ABANDONED') return null;

  const activeIndex = getPipelineIndex(status);
  const isClosed = status === 'PR_CLOSED';

  return (
    <div className="mb-4 flex items-center gap-0">
      {PIPELINE_STEPS.map((step, i) => {
        const isCompleted = i < activeIndex || (i === 2 && status === 'PR_MERGED');
        const isActive = i === activeIndex && !isClosed;
        const isFailed = i === activeIndex && isClosed;
        const isPending = i > activeIndex;

        return (
          <div key={step.label} className="flex flex-1 items-center">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors',
                  isCompleted && 'border-success bg-success/15 text-success',
                  isActive && 'border-foreground bg-foreground text-background',
                  isFailed && 'border-destructive bg-destructive/15 text-destructive',
                  isPending && 'border-border bg-secondary text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : isFailed ? (
                  <XCircle className="h-3 w-3" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-[10px] font-medium',
                  isCompleted && 'text-success',
                  isActive && 'text-foreground',
                  isFailed && 'text-destructive',
                  isPending && 'text-muted-foreground',
                )}
              >
                {i === 2 && isClosed ? 'Closed' : step.label}
              </span>
            </div>
            {/* Connector line */}
            {i < PIPELINE_STEPS.length - 1 && (
              <div
                className={cn(
                  'mb-4 h-px flex-1',
                  i < activeIndex ? 'bg-success/40' : 'bg-border',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const statusConfig: Record<
  ContributionStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  STARTED: {
    label: 'Started',
    color: 'text-blue bg-blue/10',
    icon: Clock,
  },
  PR_OPENED: {
    label: 'PR Opened',
    color: 'text-amber-500 bg-amber-500/10',
    icon: GitPullRequest,
  },
  PR_MERGED: {
    label: 'Merged',
    color: 'text-success bg-success/10',
    icon: CheckCircle2,
  },
  PR_CLOSED: {
    label: 'Closed',
    color: 'text-destructive bg-destructive/10',
    icon: XCircle,
  },
  ABANDONED: {
    label: 'Abandoned',
    color: 'text-muted-foreground bg-secondary',
    icon: AlertCircle,
  },
};

interface ContributionCardProps {
  contribution: {
    id: string;
    status: ContributionStatus;
    prUrl: string | null;
    prNumber: number | null;
    startedAt: string;
    prOpenedAt: string | null;
    mergedAt: string | null;
    issue: {
      title: string;
      number: number;
      repository: {
        fullName: string;
        owner?: string;
        name?: string;
        language: string | null;
      };
    };
  };
  onUpdateStatus?: (id: string, status: ContributionStatus, prUrl?: string, prNumber?: number) => void;
  onSync?: (id: string) => void;
  isUpdating?: boolean;
  isSyncing?: boolean;
}

export function ContributionCard({ contribution, onUpdateStatus, onSync, isUpdating, isSyncing }: ContributionCardProps) {
  const config = statusConfig[contribution.status];
  const StatusIcon = config.icon;
  const [showPrForm, setShowPrForm] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [prUrl, setPrUrl] = useState('');
  const [prUrlError, setPrUrlError] = useState('');

  const issueUrl = `https://github.com/${contribution.issue.repository.fullName}/issues/${contribution.issue.number}`;

  // Stale PR detection
  const [mountTime] = useState(() => Date.now());
  const prAgeDays = contribution.status === 'PR_OPENED' && contribution.prOpenedAt
    ? Math.floor((mountTime - new Date(contribution.prOpenedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const staleLevel = prAgeDays >= 14 ? 'critical' : prAgeDays >= 10 ? 'stale' : prAgeDays >= 5 ? 'waiting' : null;

  const handlePrSubmit = () => {
    if (!prUrl.trim()) {
      setPrUrlError('Please enter the PR URL');
      return;
    }

    const prMatch = prUrl.match(/\/pull\/(\d+)/);
    const prNumber = prMatch ? parseInt(prMatch[1], 10) : undefined;

    if (!prUrl.includes('github.com') || !prMatch) {
      setPrUrlError('Please enter a valid GitHub PR URL (e.g. https://github.com/owner/repo/pull/123)');
      return;
    }

    setPrUrlError('');
    onUpdateStatus?.(contribution.id, 'PR_OPENED', prUrl.trim(), prNumber);
    setShowPrForm(false);
    setPrUrl('');
  };

  const handleAbandon = () => {
    onUpdateStatus?.(contribution.id, 'ABANDONED');
    setShowAbandonConfirm(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/15">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Repo + language */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{contribution.issue.repository.fullName}</span>
            {contribution.issue.repository.language && (
              <>
                <span className="text-border">/</span>
                <span>{contribution.issue.repository.language}</span>
              </>
            )}
          </div>

          {/* Issue title */}
          <h3 className="mt-1.5 text-sm font-semibold leading-snug tracking-tight">
            <span className="text-muted-foreground">#{contribution.issue.number}</span>{' '}
            {contribution.issue.title}
          </h3>

          {/* Timeline */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>Started {formatRelativeTime(contribution.startedAt)}</span>
            {contribution.prOpenedAt && (
              <>
                <span className="text-border">&middot;</span>
                <span>PR opened {formatRelativeTime(contribution.prOpenedAt)}</span>
              </>
            )}
            {contribution.mergedAt && (
              <>
                <span className="text-border">&middot;</span>
                <span>Merged {formatRelativeTime(contribution.mergedAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium',
            config.color,
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </span>
      </div>

      {/* PR Progress Pipeline */}
      <PRPipeline status={contribution.status} />

      {/* Stale PR warning */}
      {staleLevel && (
        <div className={cn(
          'mt-3 flex items-start gap-2 rounded-lg border p-3 text-xs',
          staleLevel === 'critical'
            ? 'border-destructive/20 bg-destructive/5 text-destructive'
            : staleLevel === 'stale'
              ? 'border-amber-500/20 bg-amber-500/5 text-amber-500'
              : 'border-blue/20 bg-blue/5 text-blue',
        )}>
          <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <p className="font-medium">
              {staleLevel === 'critical'
                ? `PR open for ${prAgeDays} days — likely needs attention`
                : staleLevel === 'stale'
                  ? `PR open for ${prAgeDays} days — still no review activity`
                  : `PR waiting for ${prAgeDays} days — no reviews yet`}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {staleLevel === 'critical'
                ? 'The maintainers may be inactive. Consider abandoning and picking a more responsive repo, or try reaching out on their Discord/Slack.'
                : staleLevel === 'stale'
                  ? 'Try tagging a maintainer or check the CODEOWNERS file. You can also start working on another issue while waiting.'
                  : 'Check if your CI is passing. A polite comment like "Ready for review!" can help.'}
            </p>
          </div>
        </div>
      )}

      {/* PR URL Form */}
      {showPrForm && (
        <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium">Paste your Pull Request URL</label>
            <button onClick={() => { setShowPrForm(false); setPrUrlError(''); }}>
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <input
            type="url"
            value={prUrl}
            onChange={(e) => { setPrUrl(e.target.value); setPrUrlError(''); }}
            placeholder="https://github.com/owner/repo/pull/123"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handlePrSubmit()}
            autoFocus
          />
          {prUrlError && <p className="mt-1.5 text-[11px] text-destructive">{prUrlError}</p>}
          <button
            onClick={handlePrSubmit}
            disabled={isUpdating}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <GitPullRequest className="h-3 w-3" />
                Submit PR
              </>
            )}
          </button>
        </div>
      )}

      {/* Abandon confirmation */}
      {showAbandonConfirm && (
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-xs font-medium text-destructive">
            Are you sure you want to abandon this contribution?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAbandon}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Abandoning...
                </>
              ) : (
                'Yes, abandon'
              )}
            </button>
            <button
              onClick={() => setShowAbandonConfirm(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-secondary"
        >
          <ExternalLink className="h-3 w-3" />
          View Issue
        </a>

        {contribution.prUrl && (
          <a
            href={contribution.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-secondary"
          >
            <GitPullRequest className="h-3 w-3" />
            PR #{contribution.prNumber}
          </a>
        )}

        {contribution.status === 'STARTED' && onUpdateStatus && !showPrForm && !showAbandonConfirm && (
          <>
            <button
              onClick={() => setShowPrForm(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-all hover:opacity-90"
            >
              <GitPullRequest className="h-3 w-3" />
              I opened a PR
            </button>
            <button
              onClick={() => setShowAbandonConfirm(true)}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive"
            >
              Abandon
            </button>
          </>
        )}

        {contribution.status === 'PR_OPENED' && onUpdateStatus && !showAbandonConfirm && (
          <button
            onClick={() => setShowAbandonConfirm(true)}
            disabled={isUpdating}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive"
          >
            Abandon
          </button>
        )}

        {(contribution.status === 'PR_OPENED' || contribution.status === 'PR_MERGED' || contribution.status === 'PR_CLOSED') && onSync && (
          <button
            onClick={() => onSync(contribution.id)}
            disabled={isSyncing}
            className="inline-flex items-center gap-1 rounded-lg border border-blue/20 bg-blue/10 px-2.5 py-1 text-[11px] font-medium text-blue transition-colors hover:bg-blue/20 disabled:opacity-50"
          >
            {isSyncing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync with GitHub'}
          </button>
        )}
      </div>
    </div>
  );
}
