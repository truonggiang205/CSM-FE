import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";
import { ProtectedRoute } from "../modules/auth/components/ProtectedRoute";
import { HomePage } from "../modules/home/pages/HomePage";
import { ProductListPage } from "../modules/products/pages/ProductListPage";
import { ProductDetailPage } from "../modules/products/pages/ProductDetailPage";
import { CheckoutPage } from "../modules/checkout/pages/CheckoutPage";
import { DashboardPage } from "../modules/dashboard/pages/DashboardPage";
import { OrderListPage } from "../modules/orders/pages/OrderListPage";
import { MyOrdersPage } from "../modules/orders/pages/MyOrdersPage";
import { OrderDetailPage } from "../modules/orders/pages/OrderDetailPage";
import { InventoryPage } from "../modules/inventory/pages/InventoryPage";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { UnauthorizedPage } from "../modules/auth/pages/UnauthorizedPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "products",
        element: <ProductListPage />,
      },
      {
        path: "products/:id",
        element: <ProductDetailPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
      // Các route khách hàng cần đăng nhập
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "orders",
            element: <MyOrdersPage />,
          },
          {
            path: "orders/:id",
            element: <OrderDetailPage />,
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
            element: <DashboardPage />,
          },
          {
            path: "orders",
            element: <OrderListPage />,
          },
          {
            element: <ProtectedRoute allowedRoles={["BRANCH_MANAGER", "ADMIN"]} />,
            children: [
              {
                path: "inventory",
                element: <InventoryPage />,
              },
              {
                path: "products",
                element: <InventoryPage />,
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
