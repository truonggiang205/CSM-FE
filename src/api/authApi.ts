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
  updated_at?: string;
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
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

  updateProfile: async (
    payload: UpdateProfilePayload
  ): Promise<{ message: string; user: UserProfile }> => {
    const res = await apiClient.patch<{ message: string; user: UserProfile }>(
      "/auth/profile",
      payload
    );
    return res.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const res = await apiClient.patch<{ message: string }>("/auth/change-password", payload);
    return res.data;
  },

  uploadAvatar: async (file: File): Promise<{ message: string; user: UserProfile }> => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await apiClient.post<{ message: string; user: UserProfile }>("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  removeAvatar: async (): Promise<{ message: string; user: UserProfile }> => {
    const res = await apiClient.delete<{ message: string; user: UserProfile }>("/auth/avatar");
    return res.data;
  },

  getUsers: async (role?: string): Promise<UserProfile[]> => {
    const res = await apiClient.get<UserProfile[]>("/auth/users", {
      params: role ? { role } : undefined,
    });
    return res.data;
  },
};

export default authApi;
