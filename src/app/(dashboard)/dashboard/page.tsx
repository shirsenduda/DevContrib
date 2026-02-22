'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, RefreshCw, AlertCircle, ArrowRight, Compass, GitFork, GitMerge, TrendingUp, Award } from 'lucide-react';
import { IssueCard } from '@/components/features/issue-card';
import { useRecommendation } from '@/hooks/use-issues';
import { useContributions, useStartContribution } from '@/hooks/use-contributions';
import { useUserStats, useDCS } from '@/hooks/use-profile';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [contributingIssueId, setContributingIssueId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    data: recommendations,
    isLoading: recLoading,
    isError: recError,
    error: recErrorMsg,
    refetch,
  } = useRecommendation(5);
  const startContribution = useStartContribution();
  const { data: contributionsData } = useContributions();
  const { data: stats } = useUserStats();
  const { data: dcs } = useDCS();

  const contributedIssueIds = new Set(
    (contributionsData?.data || [])
      .filter((c: { status: string; issueId: string }) => c.status !== 'ABANDONED')
      .map((c: { status: string; issueId: string }) => c.issueId),
  );

  const activeContributions = (contributionsData?.data || []).filter(
    (c: { status: string }) => c.status === 'STARTED' || c.status === 'PR_OPENED',
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

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

  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10"
      >
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what we found for you today
        </p>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <Link href="/contributions" className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight">{activeContributions.length}</p>
              <p className="text-[11px] text-muted-foreground">Active</p>
            </div>
            <div className="rounded-lg bg-blue/10 p-2.5 transition-colors group-hover:bg-blue/20">
              <GitFork className="h-5 w-5 text-blue" />
            </div>
          </div>
        </Link>
        <Link href="/contributions?tab=PR_MERGED" className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight">{stats?.mergedPRs ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Merged</p>
            </div>
            <div className="rounded-lg bg-success/10 p-2.5 transition-colors group-hover:bg-success/20">
              <GitMerge className="h-5 w-5 text-success" />
            </div>
          </div>
        </Link>
        <Link href="/profile" className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight">{stats?.successRate ?? 0}%</p>
              <p className="text-[11px] text-muted-foreground">Success Rate</p>
            </div>
            <div className="rounded-lg bg-orange-500/10 p-2.5 transition-colors group-hover:bg-orange-500/20">
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </Link>
        <Link href="/profile" className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight">{dcs?.score ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">DCS Score</p>
            </div>
            <div className="rounded-lg bg-violet-500/10 p-2.5 transition-colors group-hover:bg-violet-500/20">
              <Award className="h-5 w-5 text-violet-500" />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Featured Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-10"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue/10">
              <Sparkles className="h-4 w-4 text-blue" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Recommended for you</h2>
              <p className="text-[11px] text-muted-foreground">AI-matched based on your profile</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {recLoading ? (
          <div className="space-y-4">
            {/* Skeleton with shimmer */}
            <div className="shimmer h-64 rounded-xl border border-border bg-card" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="shimmer h-52 rounded-xl border border-border bg-card" />
              <div className="shimmer h-52 rounded-xl border border-border bg-card" />
            </div>
          </div>
        ) : recError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <h3 className="mb-1 text-sm font-semibold">
              Failed to load recommendations
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              {recErrorMsg?.message || 'Something went wrong.'}
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-all hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="space-y-4">
            {/* Featured card with glow */}
            <div className="glow-card">
              <IssueCard
                issue={recommendations[0]}
                onStartContributing={contributedIssueIds.has(recommendations[0].id) ? undefined : handleStartContributing}
                alreadyContributing={contributedIssueIds.has(recommendations[0].id)}
                isContributing={contributingIssueId === recommendations[0].id}
                variant="featured"
              />
            </div>

            {/* More recommendations */}
            {recommendations.length > 1 && (
              <>
                <div className="flex items-center gap-3 pt-6">
                  <h3 className="text-xs font-medium text-muted-foreground">More picks</h3>
                  <div className="h-px flex-1 bg-border" />
                  <Link
                    href="/explore"
                    className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View all
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {recommendations.slice(1).map((issue, i) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.15 + i * 0.05 }}
                    >
                      <IssueCard
                        issue={issue}
                        onStartContributing={contributedIssueIds.has(issue.id) ? undefined : handleStartContributing}
                        alreadyContributing={contributedIssueIds.has(issue.id)}
                        isContributing={contributingIssueId === issue.id}
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center"
          >
            <div className="float-animation mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue/10">
              <Sparkles className="h-6 w-6 text-blue" />
            </div>
            <h3 className="mb-1 text-sm font-semibold">No recommendations yet</h3>
            <p className="mb-5 text-xs text-muted-foreground">
              Set up your profile so we can match you with the right issues.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/profile"
                className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-all hover:opacity-90"
              >
                Set Up Profile
              </Link>
              <Link
                href="/explore"
                className="flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-xs font-medium transition-all hover:bg-secondary"
              >
                <Compass className="h-3 w-3" />
                Browse Issues
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Explore CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex justify-center pb-4"
      >
        <Link
          href="/explore"
          className="group flex items-center gap-2.5 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition-all hover:border-foreground/20 hover:bg-secondary hover:shadow-lg"
        >
          <Compass className="h-4 w-4 text-blue transition-transform group-hover:rotate-45" />
          Explore All Repositories
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm ${
            toast.type === 'success'
              ? 'border-success/20 bg-success/10 text-success'
              : 'border-destructive/20 bg-destructive/10 text-destructive'
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </div>
  );
}
