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
    accent: '#3b82f6',
    accentMuted: 'rgba(59,130,246,0.08)',
  },
  {
    key: 'mergedPRs' as const,
    label: 'Merged PRs',
    icon: CheckCircle2,
    accent: '#22c55e',
    accentMuted: 'rgba(34,197,94,0.08)',
  },
  {
    key: 'successRate' as const,
    label: 'Success Rate',
    icon: TrendingUp,
    accent: '#a855f7',
    accentMuted: 'rgba(168,85,247,0.08)',
    suffix: '%',
  },
  {
    key: 'currentStreak' as const,
    label: 'Week Streak',
    icon: Flame,
    accent: '#f97316',
    accentMuted: 'rgba(249,115,22,0.08)',
  },
];

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        const value = stats[item.key];

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.07, ease: [0.23, 1, 0.32, 1] }}
            className="group relative overflow-hidden rounded-xl border border-border bg-background p-5 transition-shadow duration-200 hover:shadow-md"
          >
            {/* Accent strip along the left edge */}
            <span
              className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl opacity-70 transition-opacity duration-200 group-hover:opacity-100"
              style={{ background: item.accent }}
            />

            {/* Icon */}
            <div
              className="mb-4 inline-flex items-center justify-center rounded-lg p-2"
              style={{ background: item.accentMuted }}
            >
              <Icon
                className="h-[18px] w-[18px]"
                style={{ color: item.accent }}
                strokeWidth={2}
              />
            </div>

            {/* Value */}
            <p
              className="font-mono text-[2rem] font-semibold leading-none tracking-tight text-foreground"
            >
              {value}
              {item.suffix && (
                <span className="ml-0.5 text-xl font-normal text-muted-foreground">
                  {item.suffix}
                </span>
              )}
            </p>

            {/* Label */}
            <p className="mt-2 text-[0.78rem] font-medium uppercase tracking-widest text-muted-foreground">
              {item.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}