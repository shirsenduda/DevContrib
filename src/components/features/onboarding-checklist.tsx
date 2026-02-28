'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, X, Github, Sparkles, Compass, GitFork, GitPullRequest } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    id: 'signin',
    label: 'Sign in with GitHub',
    description: 'Your GitHub account is connected',
    icon: Github,
    href: undefined,
  },
  {
    id: 'profile',
    label: 'Profile analyzed',
    description: 'We mapped your skills & languages',
    icon: Sparkles,
    href: undefined,
  },
  {
    id: 'explore',
    label: 'Explore matched issues',
    description: 'Browse AI-matched issues for your stack',
    icon: Compass,
    href: '/explore',
  },
  {
    id: 'claim',
    label: 'Claim your first issue',
    description: 'Pick an issue and start contributing',
    icon: GitFork,
    href: '/explore',
  },
  {
    id: 'pr',
    label: 'Open a pull request',
    description: 'Submit your first PR to an open-source repo',
    icon: GitPullRequest,
    href: '/contributions',
  },
] as const;

type StepId = (typeof STEPS)[number]['id'];

interface OnboardingChecklistProps {
  hasContributions: boolean;
  hasOpenPR: boolean;
}

function readLocalStorage() {
  if (typeof window === 'undefined') return { explored: false, dismissed: false };
  return {
    explored: localStorage.getItem('devcontrib:explored') === '1',
    dismissed: localStorage.getItem('devcontrib:onboarding-dismissed') === '1',
  };
}

export function OnboardingChecklist({ hasContributions, hasOpenPR }: OnboardingChecklistProps) {
  // Lazy initializer reads localStorage only on the client; server returns safe defaults
  const [explored, setExplored] = useState(() => readLocalStorage().explored);
  const [dismissed, setDismissed] = useState(() => readLocalStorage().dismissed);

  // Keep dismissed in sync if another tab/component changes it
  useEffect(() => {
    const handler = () => {
      const next = readLocalStorage();
      if (next.explored) setExplored(true);
      if (next.dismissed) setDismissed(true);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const completedMap: Record<StepId, boolean> = {
    signin: true,
    profile: true,
    explore: explored || hasContributions,
    claim: hasContributions,
    pr: hasOpenPR,
  };

  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const allComplete = completedCount === STEPS.length;

  // Auto-dismiss 2.5 s after all steps done
  useEffect(() => {
    if (!allComplete) return;
    const t = setTimeout(() => {
      localStorage.setItem('devcontrib:onboarding-dismissed', '1');
      setDismissed(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [allComplete]);

  const handleDismiss = () => {
    localStorage.setItem('devcontrib:onboarding-dismissed', '1');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mb-8 overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">
            {allComplete ? "You're all set!" : 'Get started'}
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {completedCount} of {STEPS.length} steps complete
          </p>
        </div>
        <button
          onClick={handleDismiss}
          title="Dismiss"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-secondary">
        <motion.div
          className="h-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / STEPS.length) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Steps */}
      <div className="divide-y divide-border">
        {STEPS.map((step) => {
          const done = completedMap[step.id];
          const Icon = step.icon;

          const inner = (
            <div
              className={cn(
                'flex items-center gap-3 px-5 py-3 transition-colors',
                !done && step.href && 'hover:bg-secondary/60',
              )}
            >
              {/* Check / icon */}
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                  done ? 'border-foreground bg-foreground' : 'border-border bg-transparent',
                )}
              >
                {done ? (
                  <Check className="h-3 w-3 text-background" />
                ) : (
                  <Icon className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-xs font-medium',
                    done && 'text-muted-foreground line-through',
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-muted-foreground">{step.description}</p>
              </div>

              {/* Arrow for actionable incomplete steps */}
              {!done && step.href && (
                <span className="text-[11px] font-medium text-blue">Go →</span>
              )}
            </div>
          );

          return done || !step.href ? (
            <div key={step.id}>{inner}</div>
          ) : (
            <Link key={step.id} href={step.href}>
              {inner}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
