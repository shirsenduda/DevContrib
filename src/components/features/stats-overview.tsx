'use client';

import { motion } from 'framer-motion';
import { GitPullRequest, CheckCircle2, Flame, TrendingUp } from 'lucide-react';
import type { UserStats } from '@/types';

interface StatsOverviewProps {
  stats: UserStats;
}

const statItems = [
  {
    key: 'totalContributions' as const,
    label: 'Total Contributions',
    icon: GitPullRequest,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
  },
  {
    key: 'mergedPRs' as const,
    label: 'Merged PRs',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
  },
  {
    key: 'successRate' as const,
    label: 'Success Rate',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50',
    suffix: '%',
  },
  {
    key: 'currentStreak' as const,
    label: 'Week Streak',
    icon: Flame,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
  },
];

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        const value = stats[item.key];

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="rounded-xl border border-border bg-background p-4"
          >
            <div className={`inline-flex rounded-lg p-2 ${item.bgColor}`}>
              <Icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <p className="mt-3 text-2xl font-bold">
              {value}
              {item.suffix || ''}
            </p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
