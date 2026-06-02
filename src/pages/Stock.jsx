import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Listbox } from "@headlessui/react";
import {
  getStocks,
  updateStock,
  getProducts,
  getStockSummary,
  getUsers,
} from "../api";
import {
  HiSelector,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiDownload,
  HiLogout,
  HiCube,
  HiTrendingUp,
  HiTrendingDown,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineArchive,
} from "react-icons/hi";
import { MdOutlineSmsFailed } from "react-icons/md";
import Pagination from "../components/Pagination";
import { useAuth } from "../contexts/auth/useAuth";
import NoDataFound from "../components/NoDataFound";
import Loading from "../components/Loading";
import { formatDate } from "../utils/dateFormat";
import StockOutModal from "../components/StockOutModal";
import StockInModal from "../components/StockInModal";
import StockViewModal from "../components/StockViewModal";
import { deleteStock } from "../api";
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiDotsVertical,
} from "react-icons/hi";
import { useDialog } from "../contexts/dialog/useDialog";
import { Menu } from "@headlessui/react";
import DatePicker from "../components/DatePicker";

const transactionOptions = [
  { value: "in", label: "Stock In" },
  { value: "out", label: "Stock Out" },
];
const locationOptions = ["Main Warehouse", "Showroom"];

function UserDropdown({ value, onChange, userOptions = [] }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>
            {userOptions.find((u) => u._id === value)
              ? `${userOptions.find((u) => u._id === value).first_name} ${userOptions.find((u) => u._id === value).last_name}`
              : "All Users"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {userOptions.map((user) => (
            <Listbox.Option
              key={user._id}
              value={user._id}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {user.first_name} {user.last_name}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

UserDropdown.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  userOptions: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      first_name: PropTypes.string.isRequired,
      last_name: PropTypes.string.isRequired,
    }),
  ),
};

function TransactionDropdown({ value, onChange }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>
            {transactionOptions.find((t) => t.value === value)?.label ||
              "All Transactions"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {transactionOptions.map((option) => (
            <Listbox.Option
              key={option.value}
              value={option.value}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {option.label}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

TransactionDropdown.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

function LocationDropdown({ value, onChange }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>{value || "All Locations"}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {locationOptions.map((option) => (
            <Listbox.Option
              key={option}
              value={option}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {option}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

LocationDropdown.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const Stocks = () => {
  const [stocks, setStocks] = useState([]);

  // Products
  const [products, setProducts] = useState([]);

  // Modals
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const dialog = useDialog();

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Loading and Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dialog
  const { user } = useAuth();

  // Filters
  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [type, setFilterType] = useState("");
  const [location, setFilterLocation] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [start_date, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
  );
  const [end_date, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Summary
  const [summary, setSummary] = useState({
    currentBalance: 0,
    lowStockItems: 0,
    trends: {
      stockIn: 0,
      stockOut: 0,
      currentBalance: 0,
    },
  });

  // Permissions
  const canView = getPermission(user, "view_stock");
  const canCreate = getPermission(user, "create_stock");
  const canUpdate = getPermission(user, "update_stock");
  const canDelete = getPermission(user, "delete_stock");
  const canViewUsers = getPermission(user, "view_user");

  useEffect(() => {
    if (user) {
      fetchStocks(pagination.page, pagination.limit);
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    pagination.page,
    pagination.limit,
    search,
    type,
    location,
    filterUser,
    start_date,
    end_date,
  ]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      if (canViewUsers) {
        fetchUsersList();
      }
    }
  }, [user, canViewUsers]);

  async function fetchSummary() {
    try {
      const params = {};
      if (search) params.search = search;
      if (type) params.type = type;
      if (location) params.location = location;
      if (filterUser) params.user = filterUser;
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;

      const res = await getStockSummary(params);
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  }

  async function fetchProducts() {
    try {
      const res = await getProducts({ limit: -1 });
      setProducts(res.data.data || []);
    } catch {
      setProducts([]);
    }
  }

  async function fetchUsersList() {
    try {
      const res = await getUsers({ limit: -1 });
      setUserOptions(
        res.data.data.filter((u) => u.user_type === "internal") || [],
      );
    } catch {
      setUserOptions([]);
    }
  }

  async function fetchStocks(page = pagination.page, limit = pagination.limit) {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (type) params.type = type;
      if (location) params.location = location;
      if (filterUser) params.user = filterUser;
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      const res = await getStocks(params);
      setStocks(res.data.data);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load stocks");
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = (stock) => {
    setSelectedStock(stock);
    setIsUpdating(true);
    if (stock.type === "in") {
      setStockInOpen(true);
    } else {
      setStockOutOpen(true);
    }
  };

  const handleView = (stock) => {
    setSelectedStock(stock);
    setViewModalOpen(true);
  };

  // Delete user
  async function handleDelete(id) {
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Stock",
      message: "Are you sure you want to delete this stock?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      setLoading(true);
      try {
        await deleteStock(id);
        dialog.success("Stock deleted successfully");
        fetchStocks(pagination.page, pagination.limit);
      } catch (err) {
        dialog.error(err.response?.data?.error || "Failed to delete stock");
      } finally {
        setLoading(false);
      }
    }
  }

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  function handleSelectOne(e, id) {
    if (e.target.checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  }

  async function handleBulkStatus(status) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) => {
          return updateStock(id, { status });
        }),
      );

      dialog.success(`Stocks marked as ${status} successfully.`);
      fetchStocks(pagination.page, pagination.limit);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      dialog.error("Failed to update stocks.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Stocks",
      message: `Are you sure you want to delete ${selectedIds.length} stock records?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteStock(id)));
      dialog.success("Stocks deleted successfully.");
      fetchStocks(pagination.page, pagination.limit);
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to delete stocks.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectAll(e) {
    if (e.target.checked) {
      setLoading(true);
      try {
        const params = {
          limit: -1,
          search,
          type: type,
          location: location,
          user: filterUser,
          start_date,
          end_date,
        };
        const res = await getStocks(params);
        const allIds = res.data.data.map((s) => s._id);
        setSelectedIds(allIds);
      } catch (err) {
        console.error(err);
        setSelectedIds([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedIds([]);
    }
  }

  function handleReset() {
    setSearch("");
    setFilterType("");
    setFilterLocation("");
    setFilterUser("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  return (
    <div className="h-content-available">
      <StockOutModal
        open={stockOutOpen}
        onClose={() => {
          setStockOutOpen(false);
          setIsUpdating(false);
          setSelectedStock(null);
          fetchStocks();
          fetchSummary();
          fetchProducts();
        }}
        products={products}
        locations={locationOptions.filter((loc) => loc !== "All Locations")}
        data={isUpdating ? selectedStock : null}
      />
      <StockInModal
        open={stockInOpen}
        onClose={() => {
          setStockInOpen(false);
          setIsUpdating(false);
          setSelectedStock(null);
          fetchStocks();
          fetchSummary();
          fetchProducts();
        }}
        products={products}
        locations={locationOptions.filter((loc) => loc !== "All Locations")}
        data={isUpdating ? selectedStock : null}
      />
      <StockViewModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        stock={selectedStock}
      />
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Stock Management</h1>
          <span className="text-gray-500 text-sm">
            Track and manage inventory movements with real-time updates
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <div className="flex items-center gap-3">
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
                onClick={() => setStockOutOpen(true)}
              >
                <HiLogout className="text-md rotate-270" /> Stock Out
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
                onClick={() => setStockInOpen(true)}
              >
                <HiDownload className="text-md" /> Stock In
              </button>
            </div>
          )}
          {(canUpdate || canDelete) && (
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                <HiDotsVertical className="text-xl" />
              </Menu.Button>
              <Menu.Items
                anchor="bottom end"
                className="bg-white rounded-2xl shadow-lg p-2 w-50 z-50 animate-fade-in-up border border-gray-100"
              >
                <Menu.Item>
                  {() => (
                    <button
                      onClick={() => handleBulkStatus("active")}
                      className={`w-full flex items-center px-2 py-3 text-[#64748b] transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:text-black hover:bg-[#f1f5f9]"}`}
                    >
                      <HiOutlineCheckCircle
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Active Stocks
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {() => (
                    <button
                      onClick={() => handleBulkStatus("inactive")}
                      className={`w-full flex items-center px-2 py-3 text-[#64748b] transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:text-black hover:bg-[#f1f5f9]"}`}
                    >
                      <HiOutlineArchive
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Archive Stocks
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {() => (
                    <button
                      onClick={handleBulkDelete}
                      className={`w-full flex items-center px-2 py-3 text-red-500 transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:bg-red-50"}`}
                    >
                      <HiOutlineTrash
                        className="text-red-500 mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Delete Stocks
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
          <div className="flex items-center justify-between">
            <HiDownload className="text-2xl text-green-600" />
            <div
              className={`flex items-center gap-2 text-sm ${
                summary.trends?.stockIn >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summary.trends?.stockIn >= 0 ? (
                <HiTrendingUp />
              ) : (
                <HiTrendingDown />
              )}
              <span>{Math.abs(summary.trends?.stockIn || 0)}%</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Total Stock In</div>
            <div className="text-xl font-bold">{summary.totalStockIn}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
          <div className="flex items-center justify-between">
            <HiLogout className="text-2xl text-red-500 rotate-270" />
            <div
              className={`flex items-center gap-2 text-sm ${
                summary.trends?.stockOut >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {summary.trends?.stockOut >= 0 ? (
                <HiTrendingUp />
              ) : (
                <HiTrendingDown />
              )}
              <span>{Math.abs(summary.trends?.stockOut || 0)}%</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Total Stock Out</div>
            <div className="text-xl font-bold">{summary.totalStockOut}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
          <div className="flex items-center justify-between">
            <HiCube className="text-2xl text-black" />
            <div
              className={`flex items-center gap-2 text-sm ${
                summary.trends?.currentBalance >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {summary.trends?.currentBalance >= 0 ? (
                <HiTrendingUp />
              ) : (
                <HiTrendingDown />
              )}
              <span>{Math.abs(summary.trends?.currentBalance || 0)}%</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Current Balance</div>
            <div className="text-xl font-bold">{summary.currentBalance}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
          <div className="flex items-center justify-between">
            <HiOutlineExclamation className="text-2xl text-yellow-600" />
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>-</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Low Stock items</div>
            <div className="text-xl font-bold">{summary.lowStockItems}</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 mb-3 border border-gray-100">
        <div className="w-full flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold">
            <HiOutlineFilter className="inline-block text-sm text-black" />
            <span>Filters</span>
          </h3>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm mb-2 text-black cursor-pointer"
          >
            <HiOutlineRefresh className="inline-block text-sm text-black" />
            <span>Reset</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Search</label>
            <input
              className="bg-gray-50 border border-gray-100 rounded-lg py-2 px-4 text-gray-700 min-w-0 w-full text-sm"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Start Date
            </label>
            <DatePicker
              selected={start_date}
              onChange={(date) =>
                setStartDate(date ? date.toISOString().split("T")[0] : "")
              }
              placeholder="Start Date"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">End Date</label>
            <DatePicker
              selected={end_date}
              onChange={(date) =>
                setEndDate(date ? date.toISOString().split("T")[0] : "")
              }
              placeholder="End Date"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Transaction Type
            </label>
            <TransactionDropdown
              value={type}
              onChange={(val) => {
                setFilterType(val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Location</label>
            <LocationDropdown
              value={location}
              onChange={(val) => {
                setFilterLocation(val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          {canViewUsers && (
            <div>
              <label className="block text-gray-700 text-sm mb-1">User</label>
              <UserDropdown
                value={filterUser}
                onChange={(val) => {
                  setFilterUser(val);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                userOptions={userOptions}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col min-h-0">
        <div className="table-scroll-container">
          {loading ? (
            <Loading />
          ) : error ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <MdOutlineSmsFailed className="text-6xl text-red-500" />
              <div className="p-8 text-center text-red-500">{error}</div>
            </div>
          ) : (
            <table className="min-w-full text-left text-sm align-middle">
              <thead className="table-sticky-header">
                <tr>
                  {(canUpdate || canDelete) && (
                    <th className="w-15">
                      <input
                        type="checkbox"
                        name="selectAll"
                        id="selectAll"
                        className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                        checked={
                          stocks.length > 0 &&
                          selectedIds.length === pagination.totalItems
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="number">No.</th>
                  <th>Date & Times</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Balance</th>
                  <th>User</th>
                  <th>Location</th>
                  <th>Status</th>
                  {canView || canUpdate || canDelete ? (
                    <th className="text-center action">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock, index) => (
                  <tr key={stock._id} className="hover:bg-[#f1f5f9]">
                    {(canUpdate || canDelete) && (
                      <td className="w-15">
                        <input
                          type="checkbox"
                          name="select"
                          id="select"
                          className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                          checked={selectedIds.includes(stock._id)}
                          onChange={(e) => handleSelectOne(e, stock._id)}
                        />
                      </td>
                    )}
                    <td className="number">
                      {index + 1 + (pagination.page - 1) * pagination.limit}
                    </td>
                    <td>{formatDate(stock.createdAt, true) || "-"}</td>
                    <td>{stock.product?.name || stock.product_id || "-"}</td>
                    <td className="-z-2">
                      {stock.type === "in" ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <HiDownload className="text-md" />
                          Stock In
                        </span>
                      ) : stock.type === "out" ? (
                        <span className="text-red-500 flex items-center gap-1">
                          <HiLogout className="text-md -rotate-90" />
                          Stock Out
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{stock.quantity || "-"}</td>
                    <td>{stock.balance || "-"}</td>
                    <td>
                      {stock.user?.first_name
                        ? `${stock.user.first_name} ${stock.user.last_name}`
                        : stock.user_id || "-"}
                    </td>
                    <td>{stock.location || "-"}</td>
                    <td>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm capitalize text-white ${stock.status === "active" ? "bg-green-400" : "bg-gray-100"}`}
                      >
                        {stock.status}
                      </span>
                    </td>
                    <td className="action flex items-center justify-center gap-2">
                      {canView && (
                        <button
                          onClick={() => handleView(stock)}
                          className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                          title="View"
                        >
                          <HiOutlineEye className="text-xl" />
                        </button>
                      )}
                      {(canUpdate || canDelete) && (
                        <Menu
                          as="div"
                          className="relative inline-block text-left"
                        >
                          <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                            <HiDotsVertical className="text-xl" />
                          </Menu.Button>
                          <Menu.Items
                            anchor="bottom end"
                            className="bg-white rounded-2xl shadow-lg p-2 w-40 z-50 animate-fade-in-up border border-gray-100"
                          >
                            {canUpdate && (
                              <Menu.Item>
                                {() => (
                                  <button
                                    onClick={() => handleUpdate(stock)}
                                    className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl cursor-pointer"
                                  >
                                    <HiOutlinePencil
                                      className="mr-2 h-5 w-5"
                                      aria-hidden="true"
                                    />
                                    Update
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {canDelete && (
                              <Menu.Item>
                                {() => (
                                  <button
                                    onClick={() => handleDelete(stock._id)}
                                    className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl cursor-pointer"
                                  >
                                    <HiOutlineTrash
                                      className="text-red-500 mr-2 h-5 w-5"
                                      aria-hidden="true"
                                    />
                                    Delete
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                          </Menu.Items>
                        </Menu>
                      )}
                    </td>
                  </tr>
                ))}
                {stocks.length === 0 && (
                  <tr>
                    <td colSpan={canCreate || canUpdate || canDelete ? 11 : 10}>
                      <NoDataFound message="No stocks found." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {stocks.length > 0 && (
        <div className="flex justify-end mt-3">
          <Pagination
            total={pagination.totalItems}
            page={pagination.page}
            limit={pagination.limit}
            onChange={({ page, limit }) => {
              setPagination((prev) => ({ ...prev, page, limit }));
              fetchStocks(page, limit);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Stocks;
