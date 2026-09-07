import { create } from 'zustand';

interface SystemState {
  isBackendConnected: boolean;
  setBackendConnected: (status: boolean) => void;
  branchId: string;
  setBranchId: (id: string) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  isBackendConnected: false,
  setBackendConnected: (status) => set({ isBackendConnected: status }),
  branchId: 'b1', // Default branch
  setBranchId: (id) => set({ branchId: id }),
}));
