'use client';

import { X, Search } from 'lucide-react';
import { useFilterStore } from '@/stores/filter-store';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C#',
  'Ruby',
  'PHP',
  'Swift',
];

const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy', active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { value: 'MEDIUM', label: 'Medium', active: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { value: 'HARD', label: 'Hard', active: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

const SORT_OPTIONS = [
  { value: 'mergeProbability', label: 'Best Match' },
  { value: 'stars', label: 'Most Stars' },
  { value: 'newest', label: 'Newest' },
] as const;

export function IssueFilters() {
  const { difficulty, language, owner, sortBy, setDifficulty, setLanguage, setOwner, setSortBy, reset } =
    useFilterStore();

  const hasFilters = difficulty || language || owner;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Difficulty */}
      <div className="mb-5">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Difficulty</label>
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(difficulty === d.value ? null : d.value)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all',
                difficulty === d.value
                  ? d.active
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="mb-5">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Language</label>
        <select
          value={language || ''}
          onChange={(e) => setLanguage(e.target.value || null)}
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-foreground focus:outline-none"
        >
          <option value="">All Languages</option>
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Owner */}
      <div className="mb-5">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Repository Owner</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={owner || ''}
            onChange={(e) => setOwner(e.target.value || null)}
            placeholder="e.g. n8n"
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-7 pr-3 text-xs placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Sort By</label>
        <div className="flex flex-col gap-0.5">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                sortBy === option.value
                  ? 'bg-secondary font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
