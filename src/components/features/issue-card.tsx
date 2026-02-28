'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import {
  Star,
  MessageCircle,
  GitPullRequest,
  ArrowRight,
  CheckCircle,
  Loader2,
  ExternalLink,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { RecommendedIssue } from '@/types';
import { cn, formatRelativeTime } from '@/lib/utils';

const difficultyConfig = {
  EASY: {
    label: 'Easy',
    dot: 'bg-emerald-500',
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/5',
  },
  MEDIUM: {
    label: 'Medium',
    dot: 'bg-amber-500',
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/5',
  },
  HARD: {
    label: 'Hard',
    dot: 'bg-rose-500',
    text: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    glow: 'shadow-rose-500/5',
  },
};

const mergeBarColor = (prob: number) => {
  if (prob >= 0.7) return 'bg-emerald-500';
  if (prob >= 0.4) return 'bg-amber-500';
  return 'bg-rose-500';
};

const mergeTextColor = (prob: number) => {
  if (prob >= 0.7) return 'text-emerald-500';
  if (prob >= 0.4) return 'text-amber-500';
  return 'text-rose-500';
};

const mergeLabel = (prob: number) => {
  if (prob >= 0.7) return 'High';
  if (prob >= 0.4) return 'Medium';
  return 'Low';
};

interface IssueCardProps {
  issue: RecommendedIssue;
  onStartContributing?: (issueId: string) => void;
  variant?: 'default' | 'featured';
  alreadyContributing?: boolean;
  isContributing?: boolean;
}

export function IssueCard({
  issue,
  onStartContributing,
  variant = 'default',
  alreadyContributing,
  isContributing,
}: IssueCardProps) {
  const isFeatured = variant === 'featured';
  const difficulty = difficultyConfig[issue.difficulty];
  const issueUrl = `https://github.com/${issue.repoFullName}/issues/${issue.number}`;
  const mergePercent = Math.round(issue.mergeProbability * 100);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse-tracking spotlight effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const spotlightY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const spotlightBackground = useTransform(
    [spotlightX, spotlightY],
    ([x, y]) =>
      `radial-gradient(400px circle at ${x}px ${y}px, ${isFeatured ? 'rgba(0, 112, 243, 0.06)' : 'rgba(255, 255, 255, 0.03)'}, transparent 60%)`,
  );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground',
        'transition-all duration-300',
        'hover:border-foreground/15',
        isFeatured && 'border-blue/20 hover:border-blue/30',
      )}
    >
      {/* Mouse-tracking spotlight overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: spotlightBackground }}
      />

      {/* Gradient accent for featured */}
      {isFeatured && (
        <div className="relative h-px w-full overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-blue via-violet to-pink"
            animate={{ x: isHovered ? ['-100%', '0%'] : '0%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex-1 p-5">
        {/* Repo row */}
        <div className="mb-3 flex items-center justify-between">
          <a
            href={`https://github.com/${issue.repoFullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 3 }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary text-[9px] font-bold uppercase"
            >
              {issue.repoFullName.split('/')[0]?.[0]}
            </motion.div>
            <span className="truncate font-medium">{issue.repoFullName}</span>
          </a>
          <motion.div
            className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
            whileHover={{ scale: 1.05 }}
          >
            <Star className={cn('h-3 w-3 transition-colors', isHovered && 'text-amber-400')} />
            <span>{issue.stars.toLocaleString()}</span>
          </motion.div>
        </div>

        {/* Issue title */}
        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 block"
        >
          <h3
            className={cn(
              'line-clamp-2 font-semibold leading-snug tracking-tight transition-colors duration-200 group-hover:text-blue',
              isFeatured ? 'text-base' : 'text-sm',
            )}
          >
            <span className="font-normal text-muted-foreground">#{issue.number}</span>{' '}
            {issue.title}
          </h3>
        </a>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all',
              difficulty.bg,
              difficulty.text,
              difficulty.border,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', difficulty.dot)} />
            {difficulty.label}
          </motion.span>

          {issue.language && (
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {issue.language}
            </motion.span>
          )}

          {issue.labels.slice(0, 2).map((label) => (
            <motion.span
              key={label}
              whileHover={{ scale: 1.05 }}
              className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </motion.span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1" title="Comments">
            <MessageCircle className="h-3 w-3" />
            <span>{issue.commentCount}</span>
          </div>
          <div className={cn('flex items-center gap-1 font-medium', mergeTextColor(issue.mergeProbability))} title="Merge probability">
            <GitPullRequest className="h-3 w-3" />
            <span>{mergePercent}%</span>
          </div>
          {issue.createdAtGithub && (
            <div className="ml-auto flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(issue.createdAtGithub)}</span>
            </div>
          )}
        </div>

        {/* Merge probability bar */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TrendingUp className="h-2.5 w-2.5" />
              Merge chance
            </span>
            <span className={cn('text-[10px] font-semibold', mergeTextColor(issue.mergeProbability))}>
              {mergeLabel(issue.mergeProbability)}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mergePercent}%` }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={cn(
                'relative h-full rounded-full',
                mergeBarColor(issue.mergeProbability),
              )}
            >
              {/* Animated shimmer on the bar */}
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </div>

        {/* Match score */}
        {issue.matchScore > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 rounded-md border border-blue/20 bg-blue/10 px-2.5 py-1 text-[11px]',
              !isFeatured && 'border-blue/10',
            )}
          >
            <Zap className="h-3 w-3 text-blue" />
            <span className="font-semibold text-blue">
              {Math.round(issue.matchScore * 100)}% match
            </span>
            {isFeatured && <span className="text-muted-foreground">for your profile</span>}
          </motion.div>
        )}
      </div>

      {/* Action bar */}
      <div className="relative z-10 border-t border-border px-5 py-3">
        {alreadyContributing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-success/10 py-2 text-xs font-medium text-success"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Already Contributing
          </motion.div>
        ) : onStartContributing ? (
          <motion.button
            onClick={() => onStartContributing(issue.id)}
            disabled={isContributing}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all disabled:opacity-50',
              isFeatured
                ? 'bg-foreground text-background hover:opacity-90 pulse-glow'
                : 'bg-secondary text-foreground hover:bg-foreground hover:text-background',
            )}
          >
            {isContributing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Start Contributing
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </motion.button>
        ) : (
          <motion.a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on GitHub
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}
