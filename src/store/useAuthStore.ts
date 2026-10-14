import { create } from "zustand";
import axios from "axios";

export type Role = "CUSTOMER" | "STAFF" | "BRANCH_MANAGER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name?: string;
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
  loginAsRole?: (role: Role) => Promise<void>;
  toggleTestRole?: () => Promise<void>;
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

const initialUser: User | null = getSavedUser();
const initialToken: string | null = localStorage.getItem(LOCAL_TOKEN_KEY) || null;
const initialRefreshToken: string | null = localStorage.getItem(LOCAL_REFRESH_KEY) || null;

export const useAuthStore = create<AuthState>((set, get) => {
  const store: AuthState = {
    user: initialUser,
    token: initialToken,
    refreshToken: initialRefreshToken,
    isAuthenticated: !!initialToken && !!initialUser,

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
  };

  if (import.meta.env.DEV) {
    store.loginAsRole = async (role: Role) => {
      let email = "customer@csm.vn";
      let password = "Customer@123456";
      if (role === "BRANCH_MANAGER") {
        email = "manager.q1@csm.vn";
        password = "Manager@123456";
      } else if (role === "ADMIN") {
        email = "admin@csm.vn";
        password = "Admin@123456";
      } else if (role === "STAFF") {
        email = "staff.q1@csm.vn";
        password = "Staff@123456";
      }

      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
      const res = await axios.post(`${baseURL}/auth/login`, { email, password });
      const { user, accessToken, refreshToken } = res.data;
      get().setAuth(user, accessToken, refreshToken);
    };

    store.toggleTestRole = async () => {
      const currentRole = get().user?.role;
      const targetRole: Role = currentRole === "BRANCH_MANAGER" ? "ADMIN" : "BRANCH_MANAGER";
      try {
        if (store.loginAsRole) {
          await store.loginAsRole(targetRole);
        }
      } catch (err) {
        console.error("Lỗi khi chuyển đổi vai trò kiểm thử:", err);
      }
    };
  }

  return store;
});


