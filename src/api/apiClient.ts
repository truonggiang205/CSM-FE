import axios, { AxiosError } from 'axios';

export class ApiUnavailableError extends Error {
  constructor(message: string = 'API is unavailable') {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 3000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Network errors, timeouts, or 5xx/404 server errors often mean the backend is not fully up
    if (
      !error.response ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500) ||
      (error.response && error.response.status === 404)
    ) {
      throw new ApiUnavailableError();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
