import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Fetch helpers ---

interface AdminRepoFilters {
  search?: string;
  isActive?: string;
  language?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

interface AdminUserFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

interface AdminScrapeLogFilters {
  page?: number;
  pageSize?: number;
}

async function fetchAdminStats() {
  const res = await fetch('/api/admin/stats');
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  const json = await res.json();
  return json.data;
}

async function fetchAdminRepos(filters: AdminRepoFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.isActive) params.set('isActive', filters.isActive);
  if (filters.language) params.set('language', filters.language);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const res = await fetch(`/api/admin/repositories?${params}`);
  if (!res.ok) throw new Error('Failed to fetch repositories');
  return res.json();
}

async function fetchAdminUsers(filters: AdminUserFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const res = await fetch(`/api/admin/users?${params}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

async function fetchAdminScrapeLogs(filters: AdminScrapeLogFilters) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const res = await fetch(`/api/admin/scrape-logs?${params}`);
  if (!res.ok) throw new Error('Failed to fetch scrape logs');
  return res.json();
}

async function addRepo(url: string) {
  const res = await fetch('/api/admin/repositories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to add repository');
  }
  return res.json();
}

async function toggleRepo(id: string, isActive: boolean) {
  const res = await fetch(`/api/admin/repositories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error('Failed to update repository');
  return res.json();
}

async function deleteRepo(id: string) {
  const res = await fetch(`/api/admin/repositories/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete repository');
  return res.json();
}

async function syncRepoIssues(id: string) {
  const res = await fetch(`/api/admin/repositories/${id}/sync`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to sync issues');
  }
  return res.json();
}

async function triggerScrape() {
  const res = await fetch('/api/admin/scrape', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger scrape');
  return res.json();
}

// --- Queries ---

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    staleTime: 30 * 1000,
  });
}

export function useAdminRepos(filters: AdminRepoFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'repos', filters],
    queryFn: () => fetchAdminRepos(filters),
  });
}

export function useAdminUsers(filters: AdminUserFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => fetchAdminUsers(filters),
  });
}

export function useAdminScrapeLogs(filters: AdminScrapeLogFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'scrape-logs', filters],
    queryFn: () => fetchAdminScrapeLogs(filters),
  });
}

// --- Mutations ---

export function useAddRepo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addRepo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'repos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useToggleRepo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleRepo(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'repos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useDeleteRepo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRepo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'repos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useSyncRepoIssues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncRepoIssues,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'repos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useTriggerScrape() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerScrape,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'scrape-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}
