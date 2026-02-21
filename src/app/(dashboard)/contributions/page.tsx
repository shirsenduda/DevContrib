'use client';

import { useState } from 'react';
import Link from 'next/link';
import { History, Compass, Lightbulb } from 'lucide-react';
import { ContributionCard } from '@/components/features/contribution-card';
import { IssueCard } from '@/components/features/issue-card';
import { useContributions, useUpdateContribution, useSyncContribution } from '@/hooks/use-contributions';
import { useRecommendation } from '@/hooks/use-issues';
import type { ContributionStatus } from '@/types';
import { cn } from '@/lib/utils';

const TABS = [
  { value: '', label: 'All' },
  { value: 'STARTED', label: 'In Progress' },
  { value: 'PR_OPENED', label: 'PR Opened' },
  { value: 'PR_MERGED', label: 'Merged' },
  { value: 'ABANDONED', label: 'Abandoned' },
] as const;

export default function ContributionsPage() {
  const [activeTab, setActiveTab] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { data, isLoading } = useContributions(activeTab || undefined);
  const { data: allData } = useContributions();
  const updateContribution = useUpdateContribution();
  const syncContribution = useSyncContribution();

  const contributions = data?.data || [];
  const allContributions = allData?.data || [];

  const hasOpenPRs = allContributions.some((c: { status: string }) => c.status === 'PR_OPENED');
  const { data: recommendations } = useRecommendation(3);

  const counts: Record<string, number> = { '': allContributions.length };
  for (const c of allContributions) {
    counts[c.status] = (counts[c.status] || 0) + 1;
  }

  const handleUpdateStatus = (id: string, status: ContributionStatus, prUrl?: string, prNumber?: number) => {
    updateContribution.mutate(
      { id, status, prUrl, prNumber },
      {
        onSuccess: () => {
          const messages: Record<string, string> = {
            PR_OPENED: 'PR submitted! Click "Sync with GitHub" to check its status.',
            ABANDONED: 'Contribution abandoned.',
          };
          setToast({ message: messages[status] || 'Status updated.', type: 'success' });
          setTimeout(() => setToast(null), 4000);
        },
        onError: (error) => {
          setToast({ message: error.message || 'Failed to update status.', type: 'error' });
          setTimeout(() => setToast(null), 4000);
        },
      },
    );
  };

  const handleSync = (id: string) => {
    syncContribution.mutate(id, {
      onSuccess: (data) => {
        const status = data?.data?.status;
        const messages: Record<string, string> = {
          PR_MERGED: 'Your PR has been merged! Congratulations!',
          PR_CLOSED: 'Your PR was closed without merging.',
          PR_OPENED: 'Your PR is still open. The maintainers haven\'t reviewed it yet.',
        };
        setToast({ message: messages[status] || 'Status synced with GitHub.', type: status === 'PR_CLOSED' ? 'error' : 'success' });
        setTimeout(() => setToast(null), 5000);
      },
      onError: (error) => {
        setToast({ message: error.message || 'Failed to sync with GitHub.', type: 'error' });
        setTimeout(() => setToast(null), 4000);
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Contributions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your open source contribution journey</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {(counts[tab.value] || 0) > 0 && (
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-medium',
                  activeTab === tab.value
                    ? 'bg-foreground/10 text-foreground'
                    : 'bg-secondary text-muted-foreground',
                )}
              >
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* While you wait — recommendations for users with open PRs */}
      {hasOpenPRs && recommendations && recommendations.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold">While you wait</h3>
              <p className="text-xs text-muted-foreground">Pick up another issue while your PR is being reviewed</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recommendations.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Contribution list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : contributions.length > 0 ? (
        <div className="space-y-3">
          {contributions.map((contribution: { id: string; status: ContributionStatus; prUrl: string | null; prNumber: number | null; startedAt: string; prOpenedAt: string | null; mergedAt: string | null; issueId: string; issue: { title: string; number: number; repository: { fullName: string; owner?: string; name?: string; language: string | null } } }) => (
            <ContributionCard
              key={contribution.id}
              contribution={contribution}
              onUpdateStatus={handleUpdateStatus}
              onSync={handleSync}
              isUpdating={updateContribution.isPending}
              isSyncing={syncContribution.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <History className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 text-sm font-semibold">
            {activeTab ? 'No contributions in this category' : 'No contributions yet'}
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {activeTab
              ? 'Try switching to a different tab.'
              : 'Start by picking an issue from the dashboard or explore page.'}
          </p>
          {!activeTab && (
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-all hover:opacity-90"
            >
              <Compass className="h-3.5 w-3.5" />
              Explore Issues
            </Link>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'success'
              ? 'border-success/20 bg-success/10 text-success'
              : 'border-destructive/20 bg-destructive/10 text-destructive'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
