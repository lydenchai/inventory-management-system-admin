// @ts-nocheck
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Sidebar from "./Sidebar.tsx";
import Navbar from "./Navbar.tsx";
import Loading from "../components/Loading.tsx";
import { useAuth } from "../contexts/auth/useAuth";
import { DialogProvider } from "../contexts/dialog/DialogContext.tsx";
import { BadgeProvider } from "../contexts/badge/BadgeContext.tsx";
import { CartProvider } from "../contexts/cart/CartContext.tsx";
import Breadcrumb from "../components/Breadcrumb.tsx";

import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Register from "../pages/auth/Register";
import Reports from "../pages/reports/Reports";
import Products from "../pages/products/Products";
import Suppliers from "../pages/purchasing/Suppliers";
import Dashboard from "../pages/dashboard/Dashboard";
import Categories from "../pages/products/Categories";
import Locations from "../pages/inventory/Locations";
import Stock from "../pages/inventory/Stock";
import OrderRequests from "../pages/purchasing/OrderRequests";
import PurchaseOrders from "../pages/purchasing/PurchaseOrders";
import OrderHistory from "../pages/purchasing/OrderHistory";
import ApproveRequests from "../pages/purchasing/ApproveRequests";
import ConfirmDelivery from "../pages/purchasing/ConfirmDelivery";
import Sales from "../pages/sales/Sales";
import Expenses from "../pages/sales/Expenses";
import ActivityLog from "../pages/system/ActivityLog";
import Permissions from "../pages/system/Permissions";
import Users from "../pages/system/Users";
import Settings from "../pages/system/Settings";
import NotFound from "../pages/NotFound.tsx";

// A wrapper for private routes that checks authentication
function PrivateRoute({ children }) {
  const { user } = useAuth();
  const hasToken = !!localStorage.getItem("_t");
  return user && hasToken ? children : <Navigate to="/login" replace />;
}

function App() {
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Auto-hide sidebar if screen size <= 1440px
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 1440) {
        setSidebarHidden(true);
      } else {
        setSidebarHidden(false);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <DialogProvider>
      <CartProvider>
        <BadgeProvider>
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
                      <div className="h-screen flex overflow-hidden bg-[#f5f5f7]">
                        <Sidebar mini={sidebarHidden} />
                        <div className="flex-1 flex flex-col min-w-0 overflow-y-hidden overflow-x-hidden">
                          <Navbar
                            onBellClick={() => setSidebarHidden((v) => !v)}
                          />
                          <main className="flex-1 p-3 h-[calc(100vh-64px)] relative overflow-hidden flex flex-col">
                            <div className="flex-none">
                              <Breadcrumb />
                            </div>
                            <div className="flex-1 min-h-0 relative">
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
                            </div>
                          </main>
                        </div>
                      </div>
                    </PrivateRoute>
                  }
                />
              </Routes>
          </Router>
        </BadgeProvider>
      </CartProvider>
    </DialogProvider>
  );
}

export default App;
