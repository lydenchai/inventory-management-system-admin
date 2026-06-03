import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/auth/useAuth.js";
import { useBadge } from "../contexts/badge/useBadge";
import {
  HiClipboardList,
  HiCollection,
  HiCheckCircle,
  HiTruck,
  HiCube,
  HiUserGroup,
  HiArchive,
  HiChartBar,
  HiViewGrid,
  HiCog,
  HiChevronRight,
  HiKey,
  HiShoppingCart,
  HiOutlineDocumentText,
  HiOutlineAnnotation,
  HiOutlineCurrencyDollar,
} from "react-icons/hi";
import logo from "../assets/images/logo.png";

const navLinks = (permissions = [], activePath = "") =>
  [
    permissions.includes("view_dashboard") && {
      to: "/",
      label: "Dashboard",
      icon: (
        <HiViewGrid
          className={activePath === "/" ? "text-white" : "text-blue-700"}
        />
      ),
    },
    permissions.includes("view_category") && {
      to: "/categories",
      label: "Categories",
      icon: (
        <HiCollection
          className={
            activePath === "/categories" ? "text-white" : "text-emerald-600"
          }
        />
      ),
    },
    permissions.includes("view_supplier") && {
      to: "/suppliers",
      label: "Suppliers",
      icon: (
        <HiUserGroup
          className={
            activePath === "/suppliers" ? "text-white" : "text-pink-600"
          }
        />
      ),
    },
    permissions.includes("view_product") && {
      to: "/products",
      label: "Products",
      icon: (
        <HiCube
          className={
            activePath === "/products" ? "text-white" : "text-purple-600"
          }
        />
      ),
    },
    permissions.includes("view_stock") && {
      to: "/stock",
      label: "Stock",
      icon: (
        <HiArchive
          className={activePath === "/stock" ? "text-white" : "text-cyan-600"}
        />
      ),
    },
    permissions.includes("view_order_request") && {
      to: "/order-requests",
      label: "Order Requests",
      icon: (
        <HiClipboardList
          className={
            activePath === "/order-requests" ? "text-white" : "text-orange-600"
          }
        />
      ),
    },
    permissions.includes("view_approve_request") && {
      to: "/approve-requests",
      label: "Approve Requests",
      icon: (
        <HiCheckCircle
          className={
            activePath === "/approve-requests" ? "text-white" : "text-green-600"
          }
        />
      ),
    },
    permissions.includes("view_confirm_delivery") && {
      to: "/confirm-delivery",
      label: "Confirm Delivery",
      icon: (
        <HiTruck
          className={
            activePath === "/confirm-delivery"
              ? "text-white"
              : "text-yellow-600"
          }
        />
      ),
    },
    permissions.includes("view_sale") && {
      to: "/sales",
      label: "Sales",
      icon: (
        <HiShoppingCart
          className={
            activePath === "/sales" ? "text-white" : "text-fuchsia-600"
          }
        />
      ),
    },
    permissions.includes("view_expense") && {
      to: "/expenses",
      label: "Expenses",
      icon: (
        <HiOutlineCurrencyDollar
          className={
            activePath === "/expenses" ? "text-white" : "text-rose-600"
          }
        />
      ),
    },
    permissions.includes("view_order_history") && {
      to: "/order-history",
      label: "Order History",
      icon: (
        <HiOutlineDocumentText
          className={
            activePath === "/order-history" ? "text-white" : "text-blue-500"
          }
        />
      ),
    },
    permissions.includes("view_activity_log") && {
      to: "/activity-logs",
      label: "Activity Logs",
      icon: (
        <HiOutlineAnnotation
          className={
            activePath === "/activity-logs" ? "text-white" : "text-amber-500"
          }
        />
      ),
    },
    permissions.includes("view_report") && {
      to: "/reports",
      label: "Reports",
      icon: (
        <HiChartBar
          className={
            activePath === "/reports" ? "text-white" : "text-indigo-600"
          }
        />
      ),
    },

    permissions.includes("view_permission") && {
      label: "Settings",
      icon: <HiCog className="text-slate-700" />,
      submenus: [
        permissions.includes("view_permission") && {
          to: "/roles",
          label: "Roles",
          icon: (
            <HiKey
              className={
                activePath === "/roles" ? "text-white" : "text-yellow-700"
              }
            />
          ),
        },
        permissions.includes("view_user") && {
          to: "/users",
          label: "Users",
          icon: (
            <HiUserGroup
              className={
                activePath === "/users" ? "text-white" : "text-blue-700"
              }
            />
          ),
        },
      ].filter(Boolean),
    },
  ].filter(Boolean);

const Sidebar = ({ mini }) => {
  const { user } = useAuth();
  const location = useLocation();
  const links = navLinks(user?.permission?.permissions, location.pathname);
  const [expanded, setExpanded] = useState(null);
  const { approveBadge } = useBadge();

  return (
    <aside
      className={`glassmorphism h-screen flex flex-col transition-all duration-300 z-30 ${mini ? "w-18" : "w-64"}`}
    >
      <div
        className={`text-lg font-bold m-3 tracking-tight flex items-center justify-center gap-3 ${mini ? "flex-col" : ""}`}
      >
        <img
          src={logo}
          alt="Logo"
          className={`object-contain mb-2 ${mini ? "h-8 w-8" : " h-10 w-10"}`}
        />
        {!mini && <span>IMS</span>}
      </div>
      <nav className="flex-1 min-h-0">
        <ul className="space-y-2 overflow-y-auto h-[calc(100vh-85px)] px-3">
          {links.map((link, i) => {
            const parentKey = link.label || link.to || i;
            if (link.submenus) {
              const isExpanded = expanded === parentKey;
              return (
                <li key={parentKey}>
                  <div
                    className={`group flex items-center justify-between cursor-pointer px-3 py-2 rounded-xl transition text-sm space-x-3 mb-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-black`}
                    onClick={() => setExpanded(isExpanded ? null : parentKey)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{link.icon}</span>
                      {!mini && (
                        <span className="text-sm mt-0.5">{link.label}</span>
                      )}
                    </div>
                    <HiChevronRight
                      className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </div>
                  <ul
                    className="space-y-2"
                    style={{
                      maxHeight: isExpanded ? "500px" : "0px",
                      overflow: "hidden",
                      transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    {isExpanded &&
                      link.submenus.map((submenu, j) => {
                        const submenuKey = submenu.label || submenu.to || j;
                        return (
                          <li key={submenuKey}>
                            <Link
                              to={submenu.to}
                              className={`group flex items-center px-3 py-2 rounded-xl transition text-sm space-x-3
                            ${location.pathname === submenu.to
                                  ? "bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]"
                                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-black"
                                }`}
                            >
                              <span className="text-xl">{submenu.icon}</span>
                              {!mini && (
                                <span className="text-sm mt-0.5">
                                  {submenu.label}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </li>
              );
            } else {
              const isApproveRequests = link.label === "Approve Requests";
              return (
                <li key={parentKey}>
                  <Link
                    to={link.to}
                    className={`group flex items-center px-3 py-2 rounded-xl transition text-sm space-x-3 relative
                    ${location.pathname === link.to ||
                        location.pathname.includes(link.to + "/")
                        ? "bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]"
                        : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-black"
                      }
                  `}
                  >
                    <span className="text-xl">{link.icon}</span>
                    {!mini && (
                      <span className="text-sm mt-0.5 flex items-center gap-2">
                        {link.label}
                      </span>
                    )}
                    {isApproveRequests && approveBadge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm rounded-full w-6 h-6 pt-0.5 flex items-center justify-center font-bold border-2 border-white">
                        {approveBadge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            }
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
