'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/admin/data-table';
import { useAdminScrapeLogs, useTriggerScrape } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';

interface ScrapeLogRow {
  id: string;
  startedAt: string;
  completedAt: string | null;
  reposScraped: number;
  issuesFound: number;
  issuesUpdated: number;
  errors: string[];
  status: string;
}

export default function AdminScrapeLogsPage() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useAdminScrapeLogs({ page, pageSize: 20 });
  const triggerScrape = useTriggerScrape();

  const logs = data?.data || [];
  const total = data?.meta?.total || 0;

  const getDuration = (row: ScrapeLogRow) => {
    if (!row.completedAt) return '—';
    const start = new Date(row.startedAt).getTime();
    const end = new Date(row.completedAt).getTime();
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const columns: Column<ScrapeLogRow>[] = [
    {
      key: 'startedAt',
      header: 'Started',
      render: (row) => (
        <span className="text-xs">{formatDate(row.startedAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
            row.status === 'COMPLETED'
              ? 'bg-success/10 text-success'
              : row.status === 'RUNNING'
                ? 'bg-blue/10 text-blue'
                : 'bg-destructive/10 text-destructive'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'repos',
      header: 'Repos',
      render: (row) => <span className="text-xs">{row.reposScraped}</span>,
    },
    {
      key: 'issuesFound',
      header: 'Found',
      render: (row) => <span className="text-xs">{row.issuesFound}</span>,
    },
    {
      key: 'issuesUpdated',
      header: 'Updated',
      render: (row) => <span className="text-xs">{row.issuesUpdated}</span>,
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{getDuration(row)}</span>
      ),
    },
    {
      key: 'errors',
      header: 'Errors',
      render: (row) => (
        <div>
          {row.errors.length === 0 ? (
            <span className="text-xs text-muted-foreground">None</span>
          ) : (
            <button
              onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
              className="text-xs text-destructive hover:underline"
            >
              {row.errors.length} error{row.errors.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      ),
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
          <h1 className="text-2xl font-semibold tracking-tight">Scrape Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            History of GitHub scraping jobs
          </p>
        </div>
        <button
          onClick={() => triggerScrape.mutate()}
          disabled={triggerScrape.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
        >
          {triggerScrape.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Trigger Scrape
        </button>
      </motion.div>

      {triggerScrape.isSuccess && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 text-xs text-success"
        >
          Scrape job queued successfully
        </motion.p>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <DataTable
          columns={columns}
          data={logs}
          total={total}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          isLoading={isLoading}
          emptyMessage="No scrape logs yet"
        />
      </motion.div>

      {/* Expanded error details */}
      {expandedId && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
        >
          <h3 className="mb-2 text-xs font-medium text-destructive">Error Details</h3>
          <div className="space-y-1">
            {logs
              .find((l: ScrapeLogRow) => l.id === expandedId)
              ?.errors.map((err: string, i: number) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {err}
                </p>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
