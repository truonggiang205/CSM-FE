import apiClient from "./apiClient";
import { User } from "../store/useAuthStore";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>("/auth/login", payload);
    return res.data;
  },
};

export default authApi;
