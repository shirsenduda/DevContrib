import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserProfileInput } from '@/types/schemas';
import type { UserStats, DCSResult } from '@/types';

async function fetchProfile() {
  const res = await fetch('/api/user/profile');
  if (!res.ok) throw new Error('Failed to fetch profile');
  const json = await res.json();
  return json.data;
}

async function fetchStats(): Promise<UserStats> {
  const res = await fetch('/api/user/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  const json = await res.json();
  return json.data;
}

async function updateProfile(data: UserProfileInput) {
  const res = await fetch('/api/user/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });
}

async function fetchDCS(): Promise<DCSResult> {
  const res = await fetch('/api/user/dcs');
  if (!res.ok) throw new Error('Failed to fetch DCS');
  const json = await res.json();
  return json.data;
}

export function useDCS() {
  return useQuery({
    queryKey: ['dcs'],
    queryFn: fetchDCS,
    staleTime: 10 * 60 * 1000, // 10 min — score changes infrequently
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['recommendation'] });
    },
  });
}
