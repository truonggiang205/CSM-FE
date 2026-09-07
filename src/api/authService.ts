import apiClient, { ApiUnavailableError } from './apiClient';
import { AuthResponse, mockAuthResponse } from '../mocks/auth.mock';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  login: async (email: string, password: string):Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      if (error instanceof ApiUnavailableError) {
        await delay(500);
        // Basic mock validation
        if (email === 'test@csm.com' && password === '123456') {
          return mockAuthResponse;
        }
        throw new Error('Sai email hoặc mật khẩu (Mock validation)');
      }
      throw error;
    }
  },
};
