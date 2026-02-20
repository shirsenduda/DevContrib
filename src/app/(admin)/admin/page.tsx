'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, CircleDot, Users, GitMerge, Plus, Play, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { AddRepoDialog } from '@/components/admin/add-repo-dialog';
import { useAdminStats, useAdminScrapeLogs, useTriggerScrape } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: logsData } = useAdminScrapeLogs({ pageSize: 5 });
  const triggerScrape = useTriggerScrape();
  const [addRepoOpen, setAddRepoOpen] = useState(false);

  const recentLogs = logsData?.data || [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform overview and quick actions</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-24 rounded-xl border border-border bg-card" />
          ))
        ) : (
          <>
            <StatCard icon={Database} label="Total Repos" value={stats?.totalRepos ?? 0} description={`${stats?.activeRepos ?? 0} active`} />
            <StatCard icon={CircleDot} label="Open Issues" value={stats?.openIssues ?? 0} description={`${stats?.totalIssues ?? 0} total`} />
            <StatCard icon={Users} label="Users" value={stats?.totalUsers ?? 0} />
            <StatCard icon={GitMerge} label="Merged PRs" value={stats?.mergedPRs ?? 0} description={`${stats?.totalContributions ?? 0} contributions`} />
          </>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="mb-3 text-xs font-medium text-muted-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAddRepoOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-all hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Repository
          </button>
          <button
            onClick={() => triggerScrape.mutate()}
            disabled={triggerScrape.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-all hover:bg-secondary disabled:opacity-50"
          >
            {triggerScrape.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Trigger Scrape
          </button>
        </div>
        {triggerScrape.isSuccess && (
          <p className="mt-2 text-xs text-success">Scrape job queued successfully</p>
        )}
      </motion.div>

      {/* Recent Scrape Logs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <h2 className="mb-3 text-xs font-medium text-muted-foreground">Recent Activity</h2>
        {recentLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No scrape logs yet</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      log.status === 'COMPLETED'
                        ? 'bg-success/10 text-success'
                        : log.status === 'RUNNING'
                          ? 'bg-blue/10 text-blue'
                          : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-xs">
                    {log.reposScraped} repos, {log.issuesFound} issues
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {log.startedAt ? formatDate(log.startedAt) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Repo Dialog */}
      <AddRepoDialog open={addRepoOpen} onClose={() => setAddRepoOpen(false)} />
    </div>
  );
}
