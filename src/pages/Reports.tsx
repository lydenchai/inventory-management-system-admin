// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Menu } from "@headlessui/react";
import {
  getInventorySummary,
  getOrderStats,
  getTrends,
  getProducts,
  getFinancialSummary,
} from "../api";
import {
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiClipboardList,
  HiOutlineExclamationCircle,
  HiCube,
  HiUserGroup,
  HiOutlineExclamation,
  HiChevronDown,
} from "react-icons/hi";
import { MdInventory } from "react-icons/md";
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
import DatePicker from "../components/DatePicker";
import { MdOutlineSmsFailed } from "react-icons/md";
import DataTable from "../components/ui/DataTable";

const COLORS = ["#FFBB28", "#00a63e", "#fb2c36", "#FF8042"];

function exportCSV(data, filename) {
  if (!data || data.length === 0) return;
  const csvRows = [
    Object.keys(data[0]).join(","),
    ...data.map((row) => Object.values(row).join(",")),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = globalThis.window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  globalThis.window.URL.revokeObjectURL(url);
}

const Reports = () => {
  const [summary, setSummary] = useState(null);

  // Order Stats
  const [orderStats, setOrderStats] = useState(null);

  // Trends
  const [trends, setTrends] = useState([]);

  // Financial Summary
  const [financial, setFinancial] = useState(null);

  // Low Stock Products
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // Loading and Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Date Range
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, statsRes, trendsRes, lowStockRes, financialRes] =
        await Promise.all([
          getInventorySummary(),
          getOrderStats({ from: dateRange.start_date, to: dateRange.end_date }),
          getTrends({ from: dateRange.start_date, to: dateRange.end_date }),
          getProducts({ status: "low_stock", limit: 5 }),
          getFinancialSummary({
            start_date: dateRange.start_date,
            end_date: dateRange.end_date,
          }),
        ]);
      setSummary(summaryRes.data);
      setOrderStats(statsRes.data);
      setTrends(trendsRes.data?.data || []);
      setLowStockProducts(lowStockRes.data?.data || []);
      setFinancial(financialRes.data?.data || null);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  const orderPieData = orderStats
    ? [
        { name: "Pending", value: orderStats.pending },
        { name: "Approved", value: orderStats.approved },
        { name: "Rejected", value: orderStats.rejected },
      ]
    : [];

  const lowStockColumns = [
    { header: "Product", accessor: "name" },
    { header: "Category", render: (p) => p.category?.name || "N/A" },
    { header: "Stock", accessor: "stock" },
    { header: "Price", render: (p) => `$${p.price || "-"}` },
  ];

  return (
    <div className="h-content-available overflow-y-auto p-1">
      <div className="space-y-6">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Reports & Analytics
            </h1>
            <p className="text-gray-500">
              Insights into inventory, orders, and stock movements
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700">Start Date</label>
              <div className=" w-[281.6px]">
                <DatePicker
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
              <label className="text-sm text-gray-700">End Date</label>
              <div className=" w-[281.6px]">
                <DatePicker
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
              className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <HiOutlineRefresh className="text-xl" />
            </button>
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-sm">
                <HiOutlineDownload className="text-lg" />
                <span>Export CSV</span>
                <HiChevronDown className="text-sm" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg p-2 z-50 border border-gray-100 focus:outline-none">
                <Menu.Item>
                  {() => (
                    <button
                      onClick={() =>
                        exportCSV(
                          financial
                            ? [{
                                "Date Range": `${dateRange.start_date} to ${dateRange.end_date}`,
                                "Revenue": Number(financial.revenue).toFixed(2),
                                "COGS": Number(financial.cogs).toFixed(2),
                                "Gross Profit": Number(financial.grossProfit).toFixed(2),
                                "Expenses": Number(financial.expenses).toFixed(2),
                                "Net Profit": Number(financial.netProfit).toFixed(2),
                              }]
                            : [],
                          "Financial Summary.csv",
                        )
                      }
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] rounded-xl cursor-pointer"
                    >
                      <HiOutlineDownload className="text-base" />
                      Financial Summary
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {() => (
                    <button
                      onClick={() =>
                        exportCSV(
                          orderStats
                            ? [{
                                "Date Range": `${dateRange.start_date} to ${dateRange.end_date}`,
                                "Total Orders": orderStats.totalOrders,
                                "Pending": orderStats.pending,
                                "Approved": orderStats.approved,
                                "Rejected": orderStats.rejected,
                              }]
                            : [],
                          "Order Statistics.csv",
                        )
                      }
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] rounded-xl cursor-pointer"
                    >
                      <HiOutlineDownload className="text-base" />
                      Order Statistics
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {() => (
                    <button
                      onClick={() =>
                        exportCSV(
                          trends.map((t) => ({
                            "Date": t.name,
                            "Stock In": t.in,
                            "Stock Out": t.out,
                          })),
                          "Inventory Trends.csv",
                        )
                      }
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] rounded-xl cursor-pointer"
                    >
                      <HiOutlineDownload className="text-base" />
                      Inventory Trends
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {() => (
                    <button
                      onClick={() =>
                        exportCSV(
                          lowStockProducts.map((p) => ({
                            "Product Name": p.name,
                            "Category": p.category?.name || "",
                            "Stock": p.stock,
                            "Price": p.price,
                          })),
                          "Low Stock Products.csv",
                        )
                      }
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] rounded-xl cursor-pointer"
                    >
                      <HiOutlineDownload className="text-base" />
                      Low Stock Products
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {() => (
                    <button
                      onClick={() => {
                        const rows = [
                          ...(financial
                            ? [{
                                section: "Financial Summary",
                                key: "Revenue",
                                value: Number(financial.revenue).toFixed(2),
                              },
                              { section: "Financial Summary", key: "COGS", value: Number(financial.cogs).toFixed(2) },
                              { section: "Financial Summary", key: "Gross Profit", value: Number(financial.grossProfit).toFixed(2) },
                              { section: "Financial Summary", key: "Expenses", value: Number(financial.expenses).toFixed(2) },
                              { section: "Financial Summary", key: "Net Profit", value: Number(financial.netProfit).toFixed(2) }]
                            : []),
                          ...(orderStats
                            ? [{
                                section: "Order Stats",
                                key: "Total Orders",
                                value: orderStats.totalOrders,
                              },
                              { section: "Order Stats", key: "Pending", value: orderStats.pending },
                              { section: "Order Stats", key: "Approved", value: orderStats.approved },
                              { section: "Order Stats", key: "Rejected", value: orderStats.rejected }]
                            : []),
                          ...trends.map((t) => ({
                            section: "Inventory Trends",
                            key: t.name,
                            value: `In: ${t.in}, Out: ${t.out}`,
                          })),
                          ...lowStockProducts.map((p) => ({
                            section: "Low Stock",
                            key: p.name,
                            value: `Stock: ${p.stock}, Price: ${p.price}`,
                          })),
                        ];
                        exportCSV(rows, `Full Report ${dateRange.start_date} to ${dateRange.end_date}.csv`);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#1e3a5f] font-semibold hover:bg-[#f1f5f9] rounded-xl cursor-pointer border-t border-gray-100 mt-1 pt-3"
                    >
                      <HiOutlineDownload className="text-base" />
                      Export All
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </div>
        <div className="h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500 flex flex-col items-center">
                <HiOutlineRefresh className="animate-spin text-3xl mb-2" />
                Loading reports...
              </div>
            </div>
          ) : error ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <MdOutlineSmsFailed className="text-6xl text-red-500" />
              <div className="p-8 text-center text-red-500">{error}</div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
                  <HiCube className="text-2xl text-purple-600" />
                  <div>
                    <div className="text-gray-500 text-sm font-medium">
                      Total Products
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                      {summary?.totalProducts ?? 0}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
                  <MdInventory className="text-2xl text-[#1e3a5f]" />
                  <div>
                    <div className="text-gray-500 text-sm font-medium">
                      Total Inventory Value
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                      {summary?.totalQuantity ?? 0}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
                  <HiOutlineExclamation className="text-2xl text-yellow-600" />
                  <div>
                    <div className="text-gray-500 text-sm font-medium">
                      Low Stock Items
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                      {summary?.lowStock ?? 0}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
                  <HiUserGroup className="text-2xl text-pink-600" />
                  <div>
                    <div className="text-gray-500 text-sm font-medium">
                      Total Suppliers
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                      {summary?.totalSuppliers ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="mb-3">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>💰</span> Financial Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:scale-101">
                    <span className="text-gray-500 text-sm font-medium">
                      Revenue
                    </span>
                    <span className="block text-xl font-bold text-green-600 mt-1">
                      ${Number(financial?.revenue || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:scale-101">
                    <span className="text-gray-500 text-sm font-medium">
                      COGS
                    </span>
                    <span className="block text-xl font-bold text-gray-700 mt-1">
                      ${Number(financial?.cogs || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:scale-101">
                    <span className="text-gray-500 text-sm font-medium">
                      Gross Profit
                    </span>
                    <span className="block text-xl font-bold text-gray-800 mt-1">
                      ${Number(financial?.grossProfit || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:scale-101">
                    <span className="text-gray-500 text-sm font-medium">
                      Expenses
                    </span>
                    <span className="block text-xl font-bold text-red-500 mt-1">
                      ${Number(financial?.expenses || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-[#1e3a5f] p-4 rounded-xl border border--[#1e3a5f] transition-all duration-300 hover:scale-101">
                    <span className="text-gray-200 text-sm font-medium">
                      Net Profit
                    </span>
                    <span
                      className={`block text-xl font-bold mt-1 ${
                        (financial?.netProfit || 0) >= 0
                          ? "text-white"
                          : "text-red-300"
                      }`}
                    >
                      ${Number(financial?.netProfit || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
                {/* Inventory Trends */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <HiOutlineChartBar className="text-[#1e3a5f]" /> Inventory
                      Trends (
                      {Math.ceil(
                        Math.abs(
                          new Date(dateRange.end_date) -
                            new Date(dateRange.start_date),
                        ) /
                          (1000 * 60 * 60 * 24),
                      ) + 1}
                      Days)
                    </h2>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trends}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorIn"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10B981"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10B981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorOut"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#EF4444"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#EF4444"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f3f4f6"
                        />
                        <XAxis
                          dataKey="name"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          stroke="#9ca3af"
                        />
                        <YAxis
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          stroke="#9ca3af"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="in"
                          name="Stock In"
                          stroke="#10B981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorIn)"
                        />
                        <Area
                          type="monotone"
                          dataKey="out"
                          name="Stock Out"
                          stroke="#EF4444"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorOut)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Order Stats Pie */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <HiClipboardList className="text-purple-600" /> Order Status
                  </h2>
                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {orderPieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <span className="block text-xl font-bold text-gray-800">
                          {orderStats?.totalOrders || 0}
                        </span>
                        <span className="text-xs text-gray-400">Total</span>
                      </div>
                    </div>
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

              {/* Low Stock Alert Table */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <HiOutlineExclamationCircle className="text-red-500" /> Low
                    Stock Alerts
                  </h2>
                </div>
                <DataTable
                  columns={lowStockColumns}
                  data={lowStockProducts}
                  keyExtractor={(p) => p._id}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

