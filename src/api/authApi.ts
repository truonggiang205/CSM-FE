import apiClient from "./apiClient";
import { User, Role } from "../store/useAuthStore";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  branch_id?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  message?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  branch_id?: string | null;
  created_at?: string;
  fullName?: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>("/auth/login", payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>("/auth/register", payload);
    return res.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>("/auth/profile");
    return res.data;
  },
};

export default authApi;
