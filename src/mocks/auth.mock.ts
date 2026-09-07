export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const mockUser: User = {
  id: 'u1',
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@gmail.com',
  phone: '0901234567',
};

export const mockAuthResponse: AuthResponse = {
  token: 'mock-jwt-token-12345',
  user: mockUser,
};
