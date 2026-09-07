import axios from 'axios';

// Kết nối đến API Gateway (Port 8000)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Tự động gắn Token JWT vào Request Header nếu đã đăng nhập
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('csm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý lỗi phản hồi tập trung (VD: 401 Unauthorized thì xóa token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('csm_token');
      localStorage.removeItem('csm_user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
