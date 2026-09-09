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
import { InventoryPage } from "../modules/inventory/pages/InventoryPage";

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
        path: "products/:slug",
        element: <ProductDetailPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
    ],
  },
  {
    path: "/admin",
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
        path: "products",
        element: <InventoryPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
