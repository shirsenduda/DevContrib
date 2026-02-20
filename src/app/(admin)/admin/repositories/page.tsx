'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, Trash2, Search, Star, Loader2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/admin/data-table';
import { AddRepoDialog } from '@/components/admin/add-repo-dialog';
import { useAdminRepos, useToggleRepo, useDeleteRepo, useSyncRepoIssues } from '@/hooks/use-admin';
import { formatRelativeTime } from '@/lib/utils';

interface RepoRow {
  id: string;
  fullName: string;
  language: string | null;
  stars: number;
  healthScore: number;
  isActive: boolean;
  lastScrapedAt: string | null;
  _count: { issues: number };
}

export default function AdminRepositoriesPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addRepoOpen, setAddRepoOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useAdminRepos({
    search: search || undefined,
    isActive: activeFilter || undefined,
    page,
    pageSize: 20,
    sortBy: 'stars',
    sortOrder: 'desc',
  });

  const toggleRepo = useToggleRepo();
  const deleteRepo = useDeleteRepo();
  const syncIssues = useSyncRepoIssues();

  const repos = data?.data || [];
  const total = data?.meta?.total || 0;

  const handleSync = (id: string) => {
    setSyncingId(id);
    syncIssues.mutate(id, {
      onSettled: () => setSyncingId(null),
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This will also delete all its issues.`)) return;
    setDeletingId(id);
    deleteRepo.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  const columns: Column<RepoRow>[] = [
    {
      key: 'name',
      header: 'Repository',
      render: (row) => (
        <a
          href={`https://github.com/${row.fullName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline"
        >
          {row.fullName}
        </a>
      ),
    },
    {
      key: 'language',
      header: 'Language',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.language || '—'}</span>
      ),
    },
    {
      key: 'stars',
      header: 'Stars',
      render: (row) => (
        <span className="flex items-center gap-1 text-xs">
          <Star className="h-3 w-3 text-yellow-500" />
          {row.stars.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'issues',
      header: 'Issues',
      render: (row) => <span className="text-xs">{row._count.issues}</span>,
    },
    {
      key: 'health',
      header: 'Health',
      render: (row) => (
        <span className="text-xs">{row.healthScore.toFixed(0)}</span>
      ),
    },
    {
      key: 'active',
      header: 'Active',
      render: (row) => (
        <button
          onClick={() => toggleRepo.mutate({ id: row.id, isActive: !row.isActive })}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            row.isActive ? 'bg-success' : 'bg-secondary'
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              row.isActive ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      ),
    },
    {
      key: 'scraped',
      header: 'Last Scraped',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.lastScrapedAt ? formatRelativeTime(row.lastScrapedAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSync(row.id)}
            disabled={syncingId === row.id}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            title="Sync issues"
          >
            {syncingId === row.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => handleDelete(row.id, row.fullName)}
            disabled={deletingId === row.id}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            title="Delete"
          >
            {deletingId === row.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ),
      className: 'w-20',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Repositories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tracked repositories
          </p>
        </div>
        <button
          onClick={() => setAddRepoOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition-all hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Repository
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search repositories..."
            className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground focus:border-foreground/30 focus:outline-none"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <DataTable
          columns={columns}
          data={repos}
          total={total}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          isLoading={isLoading}
          emptyMessage="No repositories found"
        />
      </motion.div>

      {/* Add Repo Dialog */}
      <AddRepoDialog open={addRepoOpen} onClose={() => setAddRepoOpen(false)} />
    </div>
  );
}
