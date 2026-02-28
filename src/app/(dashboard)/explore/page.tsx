'use client';

import { IssueCard } from '@/components/features/issue-card';
import { IssueFilters } from '@/components/features/issue-filters';
import { useIssues } from '@/hooks/use-issues';
import { useContributions, useStartContribution } from '@/hooks/use-contributions';
import type { Difficulty } from '@/types';
import { useFilterStore } from '@/stores/filter-store';
import { useRouter } from 'next/navigation';
import { Compass, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ExplorePage() {
  // Mark onboarding "explore" step as complete on first visit
  useEffect(() => {
    localStorage.setItem('devcontrib:explored', '1');
  }, []);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [contributingIssueId, setContributingIssueId] = useState<string | null>(null);
  const { difficulty, language, owner, minStars, sortBy } = useFilterStore();
  const startContribution = useStartContribution();
  const { data: contributionsData } = useContributions();

  const { data, isLoading } = useIssues({
    difficulty,
    language,
    owner,
    minStars,
    sortBy,
    page,
    pageSize: 12,
  });

  const issues = data?.data || [];
  const meta = data?.meta;

  const contributedIssueIds = new Set(
    (contributionsData?.data || [])
      .filter((c: { status: string; issueId: string }) => c.status !== 'ABANDONED')
      .map((c: { status: string; issueId: string }) => c.issueId),
  );

  const handleStartContributing = (issueId: string) => {
    setContributingIssueId(issueId);
    startContribution.mutate(issueId, {
      onSuccess: () => {
        setContributingIssueId(null);
        setToast({ message: 'Contribution started! Redirecting...', type: 'success' });
        setTimeout(() => {
          setToast(null);
          router.push('/contributions');
        }, 1500);
      },
      onError: (error) => {
        setContributingIssueId(null);
        setToast({ message: error.message, type: 'error' });
        setTimeout(() => setToast(null), 4000);
      },
    });
  };

  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
        <p className="mt-1 text-sm text-muted-foreground">Browse curated issues from top open-source projects</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters sidebar */}
        <div className="w-full shrink-0 lg:w-60">
          <IssueFilters />
        </div>

        {/* Issue grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-xl border border-border bg-card"
                />
              ))}
            </div>
          ) : issues.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {issues.map((issue: { id: string; title: string; body: string | null; number: number; difficulty: Difficulty; mergeProbability: number | null; labels: string[]; commentCount: number; createdAtGithub: string; repository: { fullName: string; owner: string; name: string; language: string | null; stars: number } }) => {
                  const alreadyContributing = contributedIssueIds.has(issue.id);
                  return (
                    <IssueCard
                      key={issue.id}
                      issue={{
                        id: issue.id,
                        title: issue.title,
                        body: issue.body,
                        number: issue.number,
                        repoFullName: issue.repository.fullName,
                        repoOwner: issue.repository.owner,
                        repoName: issue.repository.name,
                        language: issue.repository.language,
                        stars: issue.repository.stars,
                        difficulty: issue.difficulty,
                        mergeProbability: issue.mergeProbability ?? 0,
                        labels: issue.labels,
                        commentCount: issue.commentCount,
                        matchScore: 0,
                        createdAtGithub: issue.createdAtGithub,
                      }}
                      onStartContributing={alreadyContributing ? undefined : handleStartContributing}
                      alreadyContributing={alreadyContributing}
                      isContributing={contributingIssueId === issue.id}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              {meta && totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <span className="px-3 text-xs text-muted-foreground">
                    {meta.page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Compass className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="mb-1 text-sm font-semibold">No issues found</h3>
              <p className="text-xs text-muted-foreground">
                Try adjusting your filters to find more issues.
              </p>
            </div>
          )}
        </div>
      </div>

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
