import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSystemStore } from './store/systemStore';
import apiClient from './api/apiClient';

import { HomePage } from './pages/HomePage';
import { ProductListPage } from './pages/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';

// All pages imported

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry, let our mock fallback handle it immediately
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const setBackendConnected = useSystemStore((state) => state.setBackendConnected);

  // Health check on startup
  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.get('/health', { timeout: 2000 });
        setBackendConnected(true);
      } catch (e) {
        setBackendConnected(false);
      }
    };
    checkHealth();
  }, [setBackendConnected]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
