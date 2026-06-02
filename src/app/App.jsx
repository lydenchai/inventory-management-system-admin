import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import Loading from "../components/Loading.jsx";
import { useAuth } from "../contexts/auth/useAuth.js";
import { DialogProvider } from "../contexts/dialog/DialogContext.jsx";
import { BadgeProvider } from "../contexts/badge/BadgeContext.jsx";
import { CartProvider } from "../contexts/cart/CartContext.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";

import Login from "../pages/Login.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import Register from "../pages/Register.jsx";
import Reports from "../pages/Reports.jsx";
import Products from "../pages/Products.jsx";
import Suppliers from "../pages/Suppliers.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Categories from "../pages/Categories.jsx";
import Stock from "../pages/Stock.jsx";
import OrderRequests from "../pages/OrderRequests.jsx";
import OrderHistory from "../pages/OrderHistory.jsx";
import ApproveRequests from "../pages/ApproveRequests.jsx";
import ConfirmDelivery from "../pages/ConfirmDelivery.jsx";
import Sales from "../pages/Sales.jsx";
import Expenses from "../pages/Expenses.jsx";
import ActivityLog from "../pages/ActivityLog.jsx";
import Permissions from "../pages/Permissions.jsx";
import Users from "../pages/Users.jsx";
import Settings from "../pages/Settings.jsx";

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
          <Suspense
            fallback={
              <div className="h-screen w-screen flex items-center justify-center">
                <Loading />
              </div>
            }
          >
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
                            <Suspense
                              fallback={
                                <div className="h-full w-full flex items-center justify-center">
                                  <Loading />
                                </div>
                              }
                            >
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
                                ].map((route) => (
                                  <Route
                                    key={route.path}
                                    path={route.path}
                                    element={route.element}
                                  />
                                ))}
                              </Routes>
                            </Suspense>
                          </div>
                        </main>
                      </div>
                    </div>
                  </PrivateRoute>
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </BadgeProvider>
      </CartProvider>
    </DialogProvider>
  );
}

export default App;
