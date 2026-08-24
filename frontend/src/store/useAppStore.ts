import { create } from 'zustand';

interface AppState {
  railCollapsed: boolean;
  toggleRail: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  railCollapsed: false,
  toggleRail: () => set((state) => ({ railCollapsed: !state.railCollapsed })),
}));
