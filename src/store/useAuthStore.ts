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
  toggleTestRole: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {
    id: "mgr-01",
    email: "manager.bennghe@csm.vn",
    name: "Trần Văn Quản Lý",
    role: "BRANCH_MANAGER",
    branch_id: "br-01",
  },
  token: "jwt_mock_token_for_manager.bennghe@csm.vn",
  isAuthenticated: true,
  setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  toggleTestRole: () => {
    const currentRole = get().user?.role;
    if (currentRole === "BRANCH_MANAGER") {
      set({
        user: {
          id: "adm-01",
          email: "admin@csm.vn",
          name: "Nguyễn Văn Admin",
          role: "ADMIN",
        },
        isAuthenticated: true,
      });
    } else {
      set({
        user: {
          id: "mgr-01",
          email: "manager.bennghe@csm.vn",
          name: "Trần Văn Quản Lý (Quận 1)",
          role: "BRANCH_MANAGER",
          branch_id: "br-01",
        },
        isAuthenticated: true,
      });
    }
  },
}));
