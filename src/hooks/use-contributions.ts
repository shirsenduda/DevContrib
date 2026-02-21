import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ContributionStatus } from '@/types';

async function fetchContributions(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);

  const res = await fetch(`/api/contributions?${params}`);
  if (!res.ok) throw new Error('Failed to fetch contributions');
  return res.json();
}

async function createContribution(issueId: string) {
  const res = await fetch('/api/contributions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issueId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to start contribution');
  }
  return res.json();
}

async function updateContribution(id: string, data: { status: ContributionStatus; prUrl?: string; prNumber?: number }) {
  const res = await fetch(`/api/contributions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update contribution');
  return res.json();
}

export function useContributions(status?: string) {
  return useQuery({
    queryKey: ['contributions', status],
    queryFn: () => fetchContributions(status),
  });
}

export function useStartContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContribution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['recommendation'] });
    },
  });
}

export function useUpdateContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: ContributionStatus; prUrl?: string; prNumber?: number }) =>
      updateContribution(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
    },
  });
}

async function syncContribution(id: string) {
  const res = await fetch(`/api/contributions/${id}/sync`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to sync with GitHub');
  }
  return res.json();
}

export function useSyncContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncContribution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
    },
  });
}
