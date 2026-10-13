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
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  logout: () => void;
  toggleTestRole: () => void;
}

const LOCAL_USER_KEY = "csm_auth_user";
const LOCAL_TOKEN_KEY = "csm_access_token";
const LOCAL_REFRESH_KEY = "csm_refresh_token";

const getSavedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialUser: User = getSavedUser() || {
  id: "mgr-01",
  email: "manager.q1@csm.vn",
  name: "Trần Văn Quản Lý",
  role: "BRANCH_MANAGER",
  branch_id: "br-01",
};

const initialToken = localStorage.getItem(LOCAL_TOKEN_KEY) || "jwt_mock_token_for_manager.q1@csm.vn";
const initialRefreshToken = localStorage.getItem(LOCAL_REFRESH_KEY) || null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!initialToken,

  setAuth: (user, token, refreshToken) => {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    localStorage.setItem(LOCAL_TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(LOCAL_REFRESH_KEY, refreshToken);
    }
    set({
      user,
      token,
      refreshToken: refreshToken || get().refreshToken,
      isAuthenticated: true,
    });
  },

  setTokens: (token, refreshToken) => {
    localStorage.setItem(LOCAL_TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(LOCAL_REFRESH_KEY, refreshToken);
    }
    set({
      token,
      refreshToken: refreshToken || get().refreshToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_TOKEN_KEY);
    localStorage.removeItem(LOCAL_REFRESH_KEY);
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  toggleTestRole: () => {
    if (!import.meta.env.DEV) {
      console.warn("toggleTestRole chỉ được phép sử dụng trong môi trường DEV");
      return;
    }
    const currentRole = get().user?.role;
    if (currentRole === "BRANCH_MANAGER") {
      const adminUser: User = {
        id: "adm-01",
        email: "admin@csm.vn",
        name: "Nguyễn Văn Admin",
        role: "ADMIN",
      };
      get().setAuth(adminUser, "jwt_mock_token_for_admin@csm.vn");
    } else {
      const mgrUser: User = {
        id: "mgr-01",
        email: "manager.q1@csm.vn",
        name: "Trần Văn Quản Lý (Quận 1)",
        role: "BRANCH_MANAGER",
        branch_id: "br-01",
      };
      get().setAuth(mgrUser, "jwt_mock_token_for_manager.q1@csm.vn");
    }
  },
}));
