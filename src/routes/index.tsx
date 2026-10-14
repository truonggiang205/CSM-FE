import React, { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";
import { ProtectedRoute } from "../modules/auth/components/ProtectedRoute";

// Lazy-loaded route components for optimized bundle splitting
const HomePage = lazy(() =>
  import("../modules/home/pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const ProductListPage = lazy(() =>
  import("../modules/products/pages/ProductListPage").then((m) => ({ default: m.ProductListPage }))
);
const ProductDetailPage = lazy(() =>
  import("../modules/products/pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage }))
);
const CheckoutPage = lazy(() =>
  import("../modules/checkout/pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage }))
);
const DashboardPage = lazy(() =>
  import("../modules/dashboard/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const OrderListPage = lazy(() =>
  import("../modules/orders/pages/OrderListPage").then((m) => ({ default: m.OrderListPage }))
);
const MyOrdersPage = lazy(() =>
  import("../modules/orders/pages/MyOrdersPage").then((m) => ({ default: m.MyOrdersPage }))
);
const OrderDetailPage = lazy(() =>
  import("../modules/orders/pages/OrderDetailPage").then((m) => ({ default: m.OrderDetailPage }))
);
const InventoryPage = lazy(() =>
  import("../modules/inventory/pages/InventoryPage").then((m) => ({ default: m.InventoryPage }))
);
const LoginPage = lazy(() =>
  import("../modules/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const UnauthorizedPage = lazy(() =>
  import("../modules/auth/pages/UnauthorizedPage").then((m) => ({ default: m.UnauthorizedPage }))
);

/**
 * Skeleton fallback cho toàn bộ routes khi đang tải chunk qua mạng
 */
function PageSkeletonFallback() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl space-y-6 animate-pulse" role="status" aria-label="Đang tải trang">
      <div className="flex items-center justify-between">
        <div className="h-8 w-44 bg-surface-soft border border-border/60 rounded-2xl" />
        <div className="h-8 w-28 bg-surface-soft border border-border/60 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-44 bg-surface-soft border border-border/60 rounded-3xl" />
        <div className="h-44 bg-surface-soft border border-border/60 rounded-3xl" />
        <div className="h-44 bg-surface-soft border border-border/60 rounded-3xl" />
      </div>
      <div className="h-72 bg-surface-soft border border-border/60 rounded-3xl" />
    </div>
  );
}

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageSkeletonFallback />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: withSuspense(HomePage),
      },
      {
        path: "products",
        element: withSuspense(ProductListPage),
      },
      {
        path: "products/:id",
        element: withSuspense(ProductDetailPage),
      },
      {
        path: "checkout",
        element: withSuspense(CheckoutPage),
      },
      {
        path: "login",
        element: withSuspense(LoginPage),
      },
      {
        path: "unauthorized",
        element: withSuspense(UnauthorizedPage),
      },
      // Các route khách hàng cần đăng nhập
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "orders",
            element: withSuspense(MyOrdersPage),
          },
          {
            path: "orders/:id",
            element: withSuspense(OrderDetailPage),
          },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={["STAFF", "BRANCH_MANAGER", "ADMIN"]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: withSuspense(DashboardPage),
          },
          {
            path: "orders",
            element: withSuspense(OrderListPage),
          },
          {
            element: <ProtectedRoute allowedRoles={["BRANCH_MANAGER", "ADMIN"]} />,
            children: [
              {
                path: "inventory",
                element: withSuspense(InventoryPage),
              },
              {
                path: "products",
                element: withSuspense(InventoryPage),
              },
            ],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
