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

const Login = React.lazy(() => import("../pages/Login.jsx"));
const ForgotPassword = React.lazy(() => import("../pages/ForgotPassword.jsx"));
const ResetPassword = React.lazy(() => import("../pages/ResetPassword.jsx"));
const Register = React.lazy(() => import("../pages/Register.jsx"));
const Reports = React.lazy(() => import("../pages/Reports.jsx"));
const Products = React.lazy(() => import("../pages/Products.jsx"));
const Suppliers = React.lazy(() => import("../pages/Suppliers.jsx"));
const Dashboard = React.lazy(() => import("../pages/Dashboard.jsx"));
const Categories = React.lazy(() => import("../pages/Categories.jsx"));
const Stock = React.lazy(() => import("../pages/Stock.jsx"));
const OrderRequests = React.lazy(() => import("../pages/OrderRequests.jsx"));
const OrderHistory = React.lazy(() => import("../pages/OrderHistory.jsx"));
const ApproveRequests = React.lazy(() => import("../pages/ApproveRequests.jsx"));
const ConfirmDelivery = React.lazy(() => import("../pages/ConfirmDelivery.jsx"));
const Sales = React.lazy(() => import("../pages/Sales.jsx"));
const Expenses = React.lazy(() => import("../pages/Expenses.jsx"));
const ActivityLog = React.lazy(() => import("../pages/ActivityLog.jsx"));
const Permissions = React.lazy(() => import("../pages/Permissions.jsx"));
const Users = React.lazy(() => import("../pages/Users.jsx"));
const Settings = React.lazy(() => import("../pages/Settings.jsx"));

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
