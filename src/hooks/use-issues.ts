import { useQuery } from '@tanstack/react-query';
import type { RecommendedIssue } from '@/types';

interface IssueFilters {
  difficulty?: string | null;
  language?: string | null;
  owner?: string | null;
  minStars?: number;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

async function fetchIssues(filters: IssueFilters) {
  const params = new URLSearchParams();
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.language) params.set('language', filters.language);
  if (filters.owner) params.set('owner', filters.owner);
  if (filters.minStars) params.set('minStars', String(filters.minStars));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const res = await fetch(`/api/issues?${params}`);
  if (!res.ok) throw new Error('Failed to fetch issues');
  return res.json();
}

async function fetchRecommendations(count = 5) {
  const res = await fetch(`/api/issues/recommend?count=${count}`);
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  const json = await res.json();
  return json.data as RecommendedIssue[];
}

export function useIssues(filters: IssueFilters) {
  return useQuery({
    queryKey: ['issues', filters],
    queryFn: () => fetchIssues(filters),
  });
}

export function useRecommendation(count = 5) {
  return useQuery({
    queryKey: ['recommendation', count],
    queryFn: () => fetchRecommendations(count),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
