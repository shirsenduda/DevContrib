'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { DataTable, type Column } from '@/components/admin/data-table';
import { useAdminUsers } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';

interface UserRow {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  avatarUrl: string | null;
  skillLevel: string;
  preferredLanguages: string[];
  createdAt: string;
  _count: { contributions: number };
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    page,
    pageSize: 20,
  });

  const users = data?.data || [];
  const total = data?.meta?.total || 0;

  const columns: Column<UserRow>[] = [
    {
      key: 'avatar',
      header: '',
      render: (row) => (
        <div className="flex items-center justify-center">
          {row.image || row.avatarUrl ? (
            <img
              src={row.image || row.avatarUrl || ''}
              alt={row.username || ''}
              className="h-7 w-7 rounded-full ring-1 ring-border"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground ring-1 ring-border">
              {(row.username || row.name || '?')[0]?.toUpperCase()}
            </div>
          )}
        </div>
      ),
      className: 'w-12',
    },
    {
      key: 'username',
      header: 'Username',
      render: (row) => (
        <span className="text-sm font-medium">{row.username || '—'}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.name || '—'}</span>
      ),
    },
    {
      key: 'skill',
      header: 'Skill',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
            row.skillLevel === 'ADVANCED'
              ? 'bg-purple-500/10 text-purple-400'
              : row.skillLevel === 'INTERMEDIATE'
                ? 'bg-blue/10 text-blue'
                : 'bg-success/10 text-success'
          }`}
        >
          {row.skillLevel}
        </span>
      ),
    },
    {
      key: 'languages',
      header: 'Languages',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.preferredLanguages.length > 0 ? (
            row.preferredLanguages.slice(0, 3).map((lang) => (
              <span
                key={lang}
                className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {lang}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          {row.preferredLanguages.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{row.preferredLanguages.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'contributions',
      header: 'Contributions',
      render: (row) => (
        <span className="text-xs">{row._count.contributions}</span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
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
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All registered users and their contribution stats
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-4"
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by username, name, or email..."
            className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <DataTable
          columns={columns}
          data={users}
          total={total}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          isLoading={isLoading}
          emptyMessage="No users found"
        />
      </motion.div>
    </div>
  );
}
