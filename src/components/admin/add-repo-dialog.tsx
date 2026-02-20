'use client';

import { useState } from 'react';
import { X, Loader2, Star, GitFork, CircleDot } from 'lucide-react';
import { useAddRepo } from '@/hooks/use-admin';

interface AddRepoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddRepoDialog({ open, onClose }: AddRepoDialogProps) {
  const [url, setUrl] = useState('');
  const addRepo = useAddRepo();

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    addRepo.mutate(url.trim(), {
      onSuccess: () => {
        setUrl('');
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (addRepo.isPending) return;
    setUrl('');
    addRepo.reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Add Repository</h2>
          <button
            onClick={handleClose}
            disabled={addRepo.isPending}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="repo-url" className="mb-1.5 block text-xs text-muted-foreground">
              GitHub Repository URL
            </label>
            <input
              id="repo-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              disabled={addRepo.isPending}
              className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* Error */}
          {addRepo.isError && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {addRepo.error.message}
            </div>
          )}

          {/* Success preview */}
          {addRepo.isSuccess && addRepo.data?.data && (
            <div className="mb-4 rounded-lg border border-success/20 bg-success/5 p-3">
              <p className="mb-2 text-xs font-medium text-success">Repository added successfully!</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {addRepo.data.data.stars}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="h-3 w-3" />
                  {addRepo.data.data.forks}
                </span>
                <span className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3" />
                  {addRepo.data.data.openIssuesCount} issues
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={addRepo.isPending}
              className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim() || addRepo.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
            >
              {addRepo.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              {addRepo.isPending ? 'Adding...' : 'Add Repository'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
