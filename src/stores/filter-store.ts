import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  difficulty: string | null;
  language: string | null;
  owner: string | null;
  minStars: number;
  sortBy: 'mergeProbability' | 'stars' | 'newest';
  setDifficulty: (d: string | null) => void;
  setLanguage: (l: string | null) => void;
  setOwner: (o: string | null) => void;
  setMinStars: (s: number) => void;
  setSortBy: (s: 'mergeProbability' | 'stars' | 'newest') => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      difficulty: null,
      language: null,
      owner: null,
      minStars: 0,
      sortBy: 'mergeProbability',
      setDifficulty: (difficulty) => set({ difficulty }),
      setLanguage: (language) => set({ language }),
      setOwner: (owner) => set({ owner }),
      setMinStars: (minStars) => set({ minStars }),
      setSortBy: (sortBy) => set({ sortBy }),
      reset: () =>
        set({ difficulty: null, language: null, owner: null, minStars: 0, sortBy: 'mergeProbability' }),
    }),
    { name: 'issue-filters' },
  ),
);
