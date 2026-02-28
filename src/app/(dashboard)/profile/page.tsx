'use client';

import { User, GitPullRequest, CheckCircle2, TrendingUp, Flame, Calendar } from 'lucide-react';
import { ProfileForm } from '@/components/features/profile-form';
import { DCSCard } from '@/components/features/dcs-card';
import { useProfile, useUserStats, useDCS } from '@/hooks/use-profile';

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: dcs, isLoading: dcsLoading } = useDCS();

  const statCards = [
    {
      label: 'Contributions',
      value: stats?.totalContributions ?? 0,
      icon: GitPullRequest,
    },
    {
      label: 'Merged PRs',
      value: stats?.mergedPRs ?? 0,
      icon: CheckCircle2,
    },
    {
      label: 'Success Rate',
      value: `${stats?.successRate ?? 0}%`,
      icon: TrendingUp,
    },
    {
      label: 'Week Streak',
      value: stats?.currentStreak ?? 0,
      icon: Flame,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-60 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Profile header */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {/* Avatar */}
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name || profile.username}
                  className="h-16 w-16 rounded-full ring-1 ring-border"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary ring-1 ring-border">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="text-center sm:text-left">
                <h1 className="text-xl font-semibold tracking-tight">{profile.name || profile.username}</h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>
                )}
              </div>

              {profile.createdAt && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground sm:ml-auto">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            {/* Languages */}
            {profile.preferredLanguages && profile.preferredLanguages.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
                {profile.preferredLanguages.map((lang: string) => (
                  <span
                    key={lang}
                    className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statsLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
              ))
            ) : (
              statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center rounded-xl border border-border bg-card px-3 py-4 text-center"
                  >
                    <Icon className="mb-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-semibold tracking-tight">{stat.value}</span>
                    <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* DCS Score */}
          {dcsLoading ? (
            <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
          ) : dcs ? (
            <DCSCard dcs={dcs} />
          ) : null}

          {/* Preferences form */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-5 text-sm font-semibold">Preferences</h3>
            <ProfileForm
              defaultValues={{
                skillLevel: profile.skillLevel,
                preferredLanguages: profile.preferredLanguages,
                bio: profile.bio,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Failed to load profile. Please try again.</p>
        </div>
      )}
    </div>
  );
}
