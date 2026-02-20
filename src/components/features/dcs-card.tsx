'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DCSResult } from '@/types';

interface DCSCardProps {
  dcs: DCSResult;
  variant?: 'default' | 'compact';
}

const DIMENSIONS = [
  { key: 'mergeRate' as const, label: 'Merge Rate', color: 'bg-emerald-500' },
  { key: 'difficultyGrowth' as const, label: 'Difficulty Growth', color: 'bg-amber-500' },
  { key: 'repoCaliber' as const, label: 'Repo Caliber', color: 'bg-blue-500' },
  { key: 'consistency' as const, label: 'Consistency', color: 'bg-violet-500' },
];

const LEVEL_COLORS: Record<string, string> = {
  'Newcomer': 'text-muted-foreground',
  'Explorer': 'text-blue-500',
  'Contributor': 'text-emerald-500',
  'Advanced Contributor': 'text-amber-500',
  'Elite Contributor': 'text-rose-500',
};

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 1000) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-border"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#dcs-gradient)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="dcs-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Score number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
      </div>
    </div>
  );
}

function DimensionBar({
  label,
  value,
  color,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  const percentage = Math.round((value / 1000) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-medium tabular-nums">{percentage}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function DCSCard({ dcs, variant = 'default' }: DCSCardProps) {
  const levelColor = LEVEL_COLORS[dcs.level] || 'text-muted-foreground';

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <ScoreRing score={dcs.score} size={48} />
        <div>
          <p className="text-sm font-semibold tabular-nums">{dcs.score}</p>
          <p className={cn('text-[11px] font-medium', levelColor)}>{dcs.level}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Contribution Score</h3>
      </div>

      {/* Score ring + level */}
      <div className="mb-6 flex flex-col items-center">
        <ScoreRing score={dcs.score} />
        <motion.p
          className={cn('mt-3 text-sm font-semibold', levelColor)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {dcs.level}
        </motion.p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {dcs.totalMerged} merged of {dcs.totalFinished} finished
        </p>
      </div>

      {/* Dimension bars */}
      <div className="space-y-3">
        {DIMENSIONS.map((dim, i) => (
          <DimensionBar
            key={dim.key}
            label={dim.label}
            value={dcs.breakdown[dim.key]}
            color={dim.color}
            delay={0.3 + i * 0.1}
          />
        ))}
      </div>
    </motion.div>
  );
}
