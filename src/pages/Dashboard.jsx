import React, { useEffect, useState } from "react";
import {
  getInventorySummary,
  getOrderStats,
  getTrends,
  getRecentOrders,
  getRecentActivity,
} from "../api";
import {
  HiCube,
  HiClipboardList,
  HiUserGroup,
  HiChartBar,
  HiOutlineExclamation,
  HiOutlineClock,
  HiOutlineRefresh,
} from "react-icons/hi";
import DatePicker from "../components/DatePicker";
import { useAuth } from "../contexts/auth/useAuth";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import DataTable from "../components/ui/DataTable";

const COLORS = ["#FFBB28", "#00a63e", "#fb2c36", "#FF8042"];

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Permissions
  const isAllowed = !!(
    getPermission(user, "view_user") ||
    getPermission(user, "view_permission") ||
    getPermission(user, "view_stock") ||
    getPermission(user, "view_sale") ||
    getPermission(user, "view_report") ||
    getPermission(user, "view_approve_request") ||
    getPermission(user, "view_confirm_delivery") ||
    getPermission(user, "view_activity_log") ||
    getPermission(user, "view_expense")
  );

  // Date Range
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateRange]);

  async function fetchData() {
    setLoading(true);
    try {
      const [
        summaryRes,
        orderStatsRes,
        trendsRes,
        recentOrdersRes,
        recentActivityRes,
      ] = await Promise.all([
        getInventorySummary(),
        getOrderStats({ from: dateRange.start_date, to: dateRange.end_date }),
        getTrends({ from: dateRange.start_date, to: dateRange.end_date }),
        getRecentOrders(),
        getRecentActivity(),
      ]);
      setSummary(summaryRes.data);
      setOrderStats(orderStatsRes.data);
      setTrends(trendsRes.data.data);
      setRecentOrders(recentOrdersRes.data.data);
      setRecentActivity(recentActivityRes.data.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
    );
  }

  const pieData = [
    { name: "Pending", value: orderStats?.pending || 0 },
    { name: "Approved", value: orderStats?.approved || 0 },
    { name: "Rejected", value: orderStats?.rejected || 0 },
  ];

  const orderColumns = [
    { header: "No.", render: (_, index) => index + 1 },
    { header: "ID", render: (order) => `#${order._id ? order._id.slice(-6).toUpperCase() : "-"}` },
    { header: "Date", render: (order) => order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-" },
    {
      header: "Status", render: (order) => {
        const statusColor = order.status === "approved" ? "bg-green-400"
          : order.status === "rejected" ? "bg-red-400"
            : order.status === "completed" ? "bg-blue-400"
              : "bg-yellow-400";
        return (
          <span className={`px-3 py-1.5 rounded-full text-sm capitalize text-white ${statusColor}`}>
            {order.status}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">
            Welcome, {user?.first_name || "User"}!
          </h1>
          {(() => {
            let roleMessage =
              "You have limited access. Contact admin for more features.";
            const userRole = user?.role?.toLowerCase();
            if (userRole === "admin") {
              roleMessage = "You have full access to all inventory features.";
            } else if (userRole === "staff") {
              roleMessage = "You have staff access to manage inventory.";
            } else if (userRole === "stockkeeper") {
              roleMessage = "You have stockkeeper access to manage inventory.";
            }
            return <span className="text-gray-500 text-sm">{roleMessage}</span>;
          })()}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <div className="flex items-center gap-3">
            <label htmlFor="startDate" className="text-sm text-gray-700">
              Start Date
            </label>
            <div className=" w-[281.6px]">
              <DatePicker
                id="startDate"
                selected={dateRange.start_date}
                onChange={(date) =>
                  setDateRange({
                    ...dateRange,
                    start_date: date ? date.toISOString().split("T")[0] : "",
                  })
                }
                placeholder="Start Date"
                className="bg-white rounded-xl border border-gray-100"
              />
            </div>
            <label htmlFor="endDate" className="text-sm text-gray-700">
              End Date
            </label>
            <div className=" w-[281.6px]">
              <DatePicker
                id="endDate"
                selected={dateRange.end_date}
                onChange={(date) =>
                  setDateRange({
                    ...dateRange,
                    end_date: date ? date.toISOString().split("T")[0] : "",
                  })
                }
                placeholder="End Date"
                className="bg-white rounded-xl border border-gray-100"
              />
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <HiOutlineRefresh className="text-xl" />
          </button>
        </div>
      </div>
      <div className="h-[80vh] overflow-y-auto">
        {/* Stats Cards */}
        {isAllowed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Link
              to="/products"
              className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <HiCube className="text-2xl text-purple-600" />
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-sm font-medium">
                  Total Products
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {summary?.totalProducts ?? 0}
                </div>
              </div>
            </Link>
            <Link
              to="/products"
              className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <HiOutlineExclamation className="text-2xl text-yellow-600" />
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-sm font-medium">
                  Low Stock
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {summary?.lowStock ?? 0}
                </div>
              </div>
            </Link>
            <Link
              to="/suppliers"
              className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-pink-50 rounded-lg">
                  <HiUserGroup className="text-2xl text-pink-600" />
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-sm font-medium">
                  Suppliers
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {summary?.totalSuppliers ?? 0}
                </div>
              </div>
            </Link>
            <Link
              to="/order-requests"
              className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <HiClipboardList className="text-2xl text-orange-600" />
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-sm font-medium">
                  Pending Orders
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {orderStats?.pending ?? 0}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Charts Section */}
        <div
          className={`grid grid-cols-1 ${isAllowed ? "lg:grid-cols-3" : "lg:grid-cols-1"} gap-3 mb-3`}
        >
          {/* Inventory Trends Chart */}
          {isAllowed && (
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
                <HiChartBar className="text-xl text-blue-600" /> Inventory Trend
                (
                {Math.ceil(
                  Math.abs(
                    new Date(dateRange.end_date) -
                    new Date(dateRange.start_date),
                  ) /
                  (1000 * 60 * 60 * 24),
                ) + 1}
                Days)
              </h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trends}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#00a63e"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#00a63e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#fb2c36"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#fb2c36"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <Area
                      type="monotone"
                      dataKey="in"
                      name="Stock In"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorIn)"
                    />
                    <Area
                      type="monotone"
                      dataKey="out"
                      name="Stock Out"
                      stroke="#EF4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOut)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Order Status Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
              <HiClipboardList className="text-xl text-orange-600" /> Order
              Status
            </h2>
            <div className="h-64 w-full flex justify-center items-center">
              {pieData.every((d) => d.value === 0) ? (
                <div className="text-gray-400 text-sm">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[pieData.indexOf(entry) % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="p-2 bg-amber-50 rounded-lg">
                <span className="block text-xs text-amber-500 font-medium">
                  Pending
                </span>
                <span className="text-sm font-bold text-amber-500">
                  {orderStats?.pending || 0}
                </span>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <span className="block text-xs text-green-600 font-medium">
                  Approved
                </span>
                <span className="text-sm font-bold text-green-700">
                  {orderStats?.approved || 0}
                </span>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <span className="block text-xs text-red-600 font-medium">
                  Rejected
                </span>
                <span className="text-sm font-bold text-red-700">
                  {orderStats?.rejected || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders & Activity */}
        <div
          className={`grid grid-cols-1 ${isAllowed ? "lg:grid-cols-3" : "lg:grid-cols-1"} gap-3 mb-3`}
        >
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <HiClipboardList className="text-xl text-gray-600" /> Recent
                Orders
              </h2>
              <Link
                to="/order-requests"
                className="text-sm text-blue-600 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="px-1">
              <DataTable columns={orderColumns} data={recentOrders} keyExtractor={(o) => o._id} />
            </div>
          </div>

          {/* Recent Activity */}
          {isAllowed && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <HiOutlineClock className="text-xl text-gray-600" /> Recent
                  Activity
                </h2>
                <Link
                  to="/activity-logs"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <span className="font-bold text-blue-600 text-sm">
                          {log.user?.first_name?.[0] || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {log.action
                            ? log.action
                              .replaceAll("_", " ")
                              .charAt(0)
                              .toUpperCase() +
                            log.action.replaceAll("_", " ").slice(1)
                            : "-"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="mr-1">by</span>
                          <span className="font-medium text-gray-700">
                            {log.user?.first_name || "Unknown"}
                          </span>
                          {" • "}
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                        {log.details && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
