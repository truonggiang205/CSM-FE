import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Branch } from "../types/branch";

interface BranchState {
  selectedBranch: Branch | null;
  isModalOpen: boolean;
  setBranch: (branch: Branch) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      selectedBranch: null,
      isModalOpen: false,
      setBranch: (branch) => set({ selectedBranch: branch, isModalOpen: false }),
      setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
    }),
    {
      name: "csm-branch-storage",
      partialize: (state) => ({ selectedBranch: state.selectedBranch }),
    }
  )
);
