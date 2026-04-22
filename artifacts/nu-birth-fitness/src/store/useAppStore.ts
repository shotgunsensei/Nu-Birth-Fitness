import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
  favorites: string[];
  watchLater: string[];
  recentSearches: string[];
  pwaBannerDismissed: boolean;
  
  toggleFavorite: (videoId: string) => void;
  toggleWatchLater: (videoId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  dismissPwaBanner: () => void;
  
  isFavorite: (videoId: string) => boolean;
  isWatchLater: (videoId: string) => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      favorites: [],
      watchLater: [],
      recentSearches: [],
      pwaBannerDismissed: false,

      toggleFavorite: (videoId: string) => set((state) => {
        const isFav = state.favorites.includes(videoId);
        return {
          favorites: isFav 
            ? state.favorites.filter(id => id !== videoId)
            : [...state.favorites, videoId]
        };
      }),

      toggleWatchLater: (videoId: string) => set((state) => {
        const isWL = state.watchLater.includes(videoId);
        return {
          watchLater: isWL
            ? state.watchLater.filter(id => id !== videoId)
            : [...state.watchLater, videoId]
        };
      }),

      addRecentSearch: (query: string) => set((state) => {
        const filtered = state.recentSearches.filter(q => q.toLowerCase() !== query.toLowerCase());
        return {
          recentSearches: [query, ...filtered].slice(0, 10)
        };
      }),

      clearRecentSearches: () => set({ recentSearches: [] }),

      dismissPwaBanner: () => set({ pwaBannerDismissed: true }),

      isFavorite: (videoId: string) => get().favorites.includes(videoId),
      isWatchLater: (videoId: string) => get().watchLater.includes(videoId),
    }),
    {
      name: 'nu-birth-fitness-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
