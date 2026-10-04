import { create } from "zustand";

export type Role = "CUSTOMER" | "STAFF" | "BRANCH_MANAGER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  branch_id?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
