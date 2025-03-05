import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProcessState {
  processNames: Record<number, string>;
  setProcessName: (handle: number, name: string) => void;
  getProcessName: (handle: number) => string;
  clearProcessNames: () => void;
}

export const processStore = create<ProcessState>()(
  persist(
    (set, get) => ({
      processNames: {},
      setProcessName: (handle, name) => set((state) => ({
        processNames: { ...state.processNames, [handle]: name }
      })),
      getProcessName: (handle) => get().processNames[handle] || `Process ${handle}`,
      clearProcessNames: () => set({ processNames: {} })
    }),
    {
      name: 'process-storage',
    }
  )
);

// Keep the hook for use in components
export const useProcessStore = processStore;