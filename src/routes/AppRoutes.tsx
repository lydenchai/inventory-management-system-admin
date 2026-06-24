// @ts-nocheck
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/useAuth.ts";
import DashboardLayout from "../components/layout/DashboardLayout.tsx";

import Login from "../pages/auth/Login.tsx";
import ForgotPassword from "../pages/auth/ForgotPassword.tsx";
import ResetPassword from "../pages/auth/ResetPassword.tsx";
import Register from "../pages/auth/Register.tsx";
import Reports from "../pages/reports/Reports.tsx";
import Products from "../pages/products/Products.tsx";
import Suppliers from "../pages/purchasing/Suppliers.tsx";
import Dashboard from "../pages/dashboard/Dashboard.tsx";
import Categories from "../pages/products/Categories.tsx";
import Locations from "../pages/inventory/Locations.tsx";
import Stock from "../pages/inventory/Stock.tsx";
import OrderRequests from "../pages/purchasing/OrderRequests.tsx";
import PurchaseOrders from "../pages/purchasing/PurchaseOrders.tsx";
import OrderHistory from "../pages/purchasing/OrderHistory.tsx";
import ApproveRequests from "../pages/purchasing/ApproveRequests.tsx";
import ConfirmDelivery from "../pages/purchasing/ConfirmDelivery.tsx";
import Sales from "../pages/sales/Sales.tsx";
import Expenses from "../pages/sales/Expenses.tsx";
import ActivityLog from "../pages/system/ActivityLog.tsx";
import Permissions from "../pages/system/Permissions.tsx";
import Users from "../pages/system/Users.tsx";
import Settings from "../pages/system/Settings.tsx";
import NotFound from "../pages/NotFound.tsx";

// A wrapper for private routes that checks authentication
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const hasToken = !!localStorage.getItem("_t");
  return user && hasToken ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="*"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Routes>
                  {[
                    // Dashboard
                    { path: "/", element: <Dashboard /> },

                    // Master Data
                    {
                      path: "/categories",
                      element: <Categories />,
                    },
                    { path: "/products", element: <Products /> },
                    {
                      path: "/suppliers",
                      element: <Suppliers />,
                    },

                    // Purchasing / Procurement
                    {
                      path: "/order-requests",
                      element: <OrderRequests />,
                    },
                    {
                      path: "/purchase-orders",
                      element: <PurchaseOrders />,
                    },
                    {
                      path: "/approve-requests",
                      element: <ApproveRequests />,
                    },
                    {
                      path: "/confirm-delivery",
                      element: <ConfirmDelivery />,
                    },
                    {
                      path: "/order-history",
                      element: <OrderHistory />,
                    },

                    // Inventory / Stock
                    { path: "/locations", element: <Locations /> },
                    { path: "/stock", element: <Stock /> },

                    // Sales
                    { path: "/sales", element: <Sales /> },
                    { path: "/expenses", element: <Expenses /> },

                    // Reports & Logs
                    { path: "/reports", element: <Reports /> },
                    {
                      path: "/activity-logs",
                      element: <ActivityLog />,
                    },

                    // System / Security
                    { path: "/settings", element: <Settings /> },
                    {
                      path: "/roles",
                      element: <Permissions />,
                    },
                    { path: "/users", element: <Users /> },

                    // Catch-all route for dashboard
                    { path: "*", element: <NotFound /> },
                  ].map((route) => (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={route.element}
                    />
                  ))}
                </Routes>
              </DashboardLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}
