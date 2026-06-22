// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Listbox, Menu } from "@headlessui/react";
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
  HiOutlineTrash,
  HiOutlineEye,
  HiDotsVertical,
  HiOutlinePencil,
} from "react-icons/hi";
import { getStocks, updateStock, getProducts, getStockSummary, getUsers, deleteStock, getLocations } from "../api";
import Pagination from "../components/Pagination";
import { useAuth } from "../contexts/auth/useAuth";
import { formatDate } from "../utils/dateFormat";
import StockOutModal from "../components/StockOutModal";
import StockInModal from "../components/StockInModal";
import StockViewModal from "../components/StockViewModal";
import StockTransferModal from "../components/StockTransferModal";
import { useDialog } from "../contexts/dialog/useDialog";
import DatePicker from "../components/DatePicker";

import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import useDataFetch from "../hooks/useDataFetch";
import useDebounce from "../hooks/useDebounce";

const transactionOptions = [
  { value: "in", label: "Stock In" },
  { value: "out", label: "Stock Out" },
];
// We will use state for locationOptions

function FilterDropdown({ value, onChange, options, placeholder, isObject = false }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between">
          <span className="truncate">
            {isObject ? options.find(o => o.value === value)?.label || placeholder : value || placeholder}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          <Listbox.Option value="" className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
            {placeholder}
          </Listbox.Option>
          {options.map((option) => {
            const val = isObject ? option.value : option;
            const label = isObject ? option.label : option;
            return (
              <Listbox.Option key={val} value={val} className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
                {label}
              </Listbox.Option>
            );
          })}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

function UserDropdown({ value, onChange, userOptions }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between">
          <span className="truncate">
            {userOptions.find((u) => u._id === value) ? `${userOptions.find((u) => u._id === value).first_name} ${userOptions.find((u) => u._id === value).last_name}` : "All Users"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          <Listbox.Option value="" className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
            All Users
          </Listbox.Option>
          {userOptions.map((user) => (
            <Listbox.Option key={user._id} value={user._id} className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
              {user.first_name} {user.last_name}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

const getPermission = (user, permission) => user?.permission?.permissions?.includes(permission);

const Stocks = () => {
  const [products, setProducts] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);

  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockTransferOpen, setStockTransferOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const dialog = useDialog();
  const { user } = useAuth();

  const canView = getPermission(user, "view_stock");
  const canCreate = getPermission(user, "create_stock");
  const canUpdate = getPermission(user, "update_stock");
  const canDelete = getPermission(user, "delete_stock");
  const canViewUsers = getPermission(user, "view_user");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedIds, setSelectedIds] = useState([]);

  const [summary, setSummary] = useState({
    currentBalance: 0,
    lowStockItems: 0,
    trends: { stockIn: 0, stockOut: 0, currentBalance: 0 },
  });

  const {
    data: stocks,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
    setLoading
  } = useDataFetch(getStocks, {
    search: "",
    type: "",
    location: "",
    user: "",
    start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchSummary();
    }
  }, [user, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchLocations();
      if (canViewUsers) fetchUsersList();
    }
  }, [user, canViewUsers]);

  async function fetchSummary() {
    try {
      const res = await getStockSummary(filters);
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
      setUserOptions(res.data.data.filter((u) => u.user_type === "internal") || []);
    } catch {
      setUserOptions([]);
    }
  }

  async function fetchLocations() {
    try {
      const res = await getLocations({ limit: -1 });
      const options = res.data.data || res.data || [];
      setLocationOptions(options.map(l => ({ label: l.name, value: l._id })));
    } catch {
      setLocationOptions([]);
    }
  }

  const handleReset = () => {
    setSearchTerm("");
    resetFilters({
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0]
    });
  };

  const handleUpdate = (stock) => {
    setSelectedStock(stock);
    setIsUpdating(true);
    if (stock.type === "in") setStockInOpen(true);
    else setStockOutOpen(true);
  };

  const handleView = (stock) => {
    setSelectedStock(stock);
    setViewModalOpen(true);
  };

  async function handleDelete(id) {
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Stock", message: "Are you sure?" });
    if (confirmed) {
      setLoading(true);
      try {
        await deleteStock(id);
        dialog.success("Stock deleted successfully");
        fetchData();
        fetchSummary();
      } catch (err) {
        dialog.error(err.response?.data?.error || "Failed to delete stock");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleBulkStatus(status) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updateStock(id, { status })));
      dialog.success(`Stocks marked as ${status} successfully.`);
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to update stocks.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Stocks", message: "Are you sure?" });
    if (!confirmed) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteStock(id)));
      dialog.success("Stocks deleted successfully.");
      fetchData();
      fetchSummary();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to delete stocks.");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    ...(canUpdate || canDelete ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
        checked={stocks.length > 0 && selectedIds.length === stocks.length}
        onChange={(e) => setSelectedIds(e.target.checked ? stocks.map(s => s._id) : [])} />,
      className: "w-15",
      render: (s) => (
        <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          checked={selectedIds.includes(s._id)}
          onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, s._id] : prev.filter(id => id !== s._id))}
        />
      )
    }] : []),
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Date", render: (s) => formatDate(s.createdAt, true) || "-" },
    { header: "Product", render: (s) => s.product?.name || s.product_id || "-" },
    {
      header: "Type", render: (s) => s.type === "in" ? (
        <span className="text-green-600 flex items-center gap-1 font-medium"><HiDownload /> Stock In</span>
      ) : s.type === "out" ? (
        <span className="text-red-500 flex items-center gap-1 font-medium"><HiLogout className="-rotate-90" /> Stock Out</span>
      ) : "-"
    },
    { header: "Qty", className: "font-semibold", accessor: "quantity" },
    { header: "Balance", accessor: "balance" },
    { header: "User", render: (s) => s.user?.first_name ? `${s.user.first_name} ${s.user.last_name}` : "-" },
    { header: "Location", render: (s) => s.location?.name || s.location || "-" },
    {
      header: "Status", render: (s) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${s.status === "active" ? "bg-green-500" : "bg-gray-400"}`}>
          {s.status}
        </span>
      )
    },
    ...(canView || canUpdate || canDelete ? [
      {
        header: "Actions", className: "text-center", render: (s) => (
          <div className="flex items-center gap-1 justify-center">
            {canView && (
              <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                onClick={() => handleView(s)}>
                <HiOutlineEye className="text-xl" />
              </button>
            )}
            {(canUpdate || canDelete) && (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                  <HiDotsVertical className="text-xl" />
                </Menu.Button>
                <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-40 z-50 border border-gray-100 focus:outline-none">
                  {canUpdate && (
                    <Menu.Item>
                      <button className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl"
                        onClick={() => handleUpdate(s)}>
                        <HiOutlinePencil className="mr-2 h-5 w-5" /> Update
                      </button>
                    </Menu.Item>
                  )}
                  {canDelete && (
                    <Menu.Item>
                      <button className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl"
                        onClick={() => handleDelete(s._id)}>
                        <HiOutlineTrash className="mr-2 h-5 w-5" /> Delete
                      </button>
                    </Menu.Item>
                  )}
                </Menu.Items>
              </Menu>
            )}
          </div>
        )
      }
    ] : [])
  ];

  return (
    <div className="h-content-available flex flex-col">
      <StockOutModal open={stockOutOpen} onClose={() => { setStockOutOpen(false); setIsUpdating(false); setSelectedStock(null); fetchData(); fetchSummary(); fetchProducts(); }} products={products} locations={locationOptions.map(l => ({_id: l.value, name: l.label}))} data={isUpdating ? selectedStock : null} />
      <StockInModal open={stockInOpen} onClose={() => { setStockInOpen(false); setIsUpdating(false); setSelectedStock(null); fetchData(); fetchSummary(); fetchProducts(); }} products={products} locations={locationOptions.map(l => ({_id: l.value, name: l.label}))} data={isUpdating ? selectedStock : null} />
      <StockTransferModal open={stockTransferOpen} onClose={() => setStockTransferOpen(false)} products={products} locations={locationOptions.map(l => ({_id: l.value, name: l.label}))} onTransferSuccess={() => { fetchData(); fetchSummary(); fetchProducts(); }} />
      <StockViewModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} stock={selectedStock} />

      <PageHeader
        title="Stock Management"
        description="Track and manage inventory movements with real-time updates"
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <>
                <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm font-medium transition" onClick={() => setStockOutOpen(true)}>
                  <HiLogout className="text-md rotate-270" /> Stock Out
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm font-medium transition" onClick={() => setStockInOpen(true)}>
                  <HiDownload className="text-md" /> Stock In
                </button>
                <button className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm font-medium transition" onClick={() => setStockTransferOpen(true)}>
                  <HiTrendingUp className="text-md" /> Transfer
                </button>
              </>
            )}
            {(canUpdate || canDelete) && (
              <Menu as="div" className="relative inline-block text-left ml-2">
                <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                  <HiDotsVertical className="text-xl" />
                </Menu.Button>
                <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-50 z-50 border border-gray-100 focus:outline-none">
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("active")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineCheckCircle className="mr-2 h-5 w-5" /> Active Stocks
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("inactive")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineArchive className="mr-2 h-5 w-5" /> Archive Stocks
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={handleBulkDelete} className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl">
                      <HiOutlineTrash className="text-red-500 mr-2 h-5 w-5" /> Delete Stocks
                    </button>
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3 flex-shrink-0">
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <HiDownload className="text-xl text-green-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${summary.trends?.stockIn >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.trends?.stockIn >= 0 ? <HiTrendingUp /> : <HiTrendingDown />}
              <span>{Math.abs(summary.trends?.stockIn || 0)}%</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">Total Stock In</div>
            <div className="text-2xl font-bold">{summary.totalStockIn || 0}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <HiLogout className="text-xl text-red-500 rotate-270" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${summary.trends?.stockOut >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.trends?.stockOut >= 0 ? <HiTrendingUp /> : <HiTrendingDown />}
              <span>{Math.abs(summary.trends?.stockOut || 0)}%</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">Total Stock Out</div>
            <div className="text-2xl font-bold">{summary.totalStockOut || 0}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <HiCube className="text-xl text-[#1e3a5f]" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${summary.trends?.currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.trends?.currentBalance >= 0 ? <HiTrendingUp /> : <HiTrendingDown />}
              <span>{Math.abs(summary.trends?.currentBalance || 0)}%</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">Current Balance</div>
            <div className="text-2xl font-bold">{summary.currentBalance || 0}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-3 border border-gray-100 transition-all duration-300 hover:scale-101">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
              <HiOutlineExclamation className="text-xl text-yellow-600" />
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm font-medium">
              <span>-</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">Low Stock items</div>
            <div className="text-2xl font-bold">{summary.lowStockItems || 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 mb-3 border border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]">
            <HiOutlineFilter /> Filters
          </h3>
          <button onClick={handleReset} className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer hover:text-gray-500 transition">
            <HiOutlineRefresh /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Search</label>
            <input className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
              type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Start Date</label>
            <DatePicker selected={filters.start_date} onChange={date => updateFilters({ start_date: date ? date.toISOString().split("T")[0] : "" })} placeholder="Start Date" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">End Date</label>
            <DatePicker selected={filters.end_date} onChange={date => updateFilters({ end_date: date ? date.toISOString().split("T")[0] : "" })} placeholder="End Date" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Type</label>
            <FilterDropdown value={filters.type} onChange={val => updateFilters({ type: val })} options={transactionOptions} placeholder="All Types" isObject={true} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Location</label>
            <FilterDropdown value={filters.location} onChange={val => updateFilters({ location: val })} options={locationOptions} placeholder="All Locations" isObject={true} />
          </div>
          {canViewUsers && (
            <div>
              <label className="block text-gray-700 text-sm mb-1">User</label>
              <UserDropdown value={filters.user} onChange={val => updateFilters({ user: val })} userOptions={userOptions} />
            </div>
          )}
        </div>
      </div>

      <div className="overflow-auto min-h-0 flex flex-col">
        <DataTable columns={columns} data={stocks} loading={loading} error={error} />
      </div>

      {stocks.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default Stocks;

