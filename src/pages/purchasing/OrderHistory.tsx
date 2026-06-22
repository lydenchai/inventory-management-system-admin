// @ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { Listbox } from "@headlessui/react";
import { HiSelector, HiOutlineFilter, HiOutlineRefresh } from "react-icons/hi";
import { useAuth } from "../../contexts/auth/useAuth";
import { getOrderRequests } from "../../api";
import Pagination from "../../components/Pagination";
import ProcessReturnModal from "../../components/ProcessReturnModal";
import { formatDate } from "../../utils/dateFormat";
import DatePicker from "../../components/DatePicker";

import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import useDataFetch from "../../hooks/useDataFetch";
import useDebounce from "../../hooks/useDebounce";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "on_hold", label: "On Hold" },
];

function FilterDropdown({ value, onChange, options, placeholder }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between">
          <span className="truncate">{options.find(o => o.value === value)?.label || placeholder}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          <Listbox.Option value="" className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
            {placeholder}
          </Listbox.Option>
          {options.map((option) => (
            <Listbox.Option key={option.value} value={option.value} className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
              {option.label}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

const OrderHistory = () => {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  const {
    data: orders,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
  } = useDataFetch(getOrderRequests, {
    search: "",
    status: "",
    start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, filters, pagination.page, pagination.limit]);

  const handleReset = () => {
    setSearchTerm("");
    resetFilters({
      start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0]
    });
  };

  const filteredOrders = useMemo(() => {
    const userRole = user?.role?.toLowerCase();
    if (userRole === "admin" || userRole === "staff") return orders;
    return orders.filter(order => String(order.requester_id) === String(user?._id));
  }, [orders, user]);

  const columns = [
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Product(s)", render: (o) => Array.isArray(o.items) && o.items.length > 0 ? o.items.map(item => item.product?.name || item.product_id).join(", ") : "-" },
    { header: "Quantity(ies)", render: (o) => Array.isArray(o.items) && o.items.length > 0 ? o.items.map(item => item.quantity).join(", ") : "-" },
    { header: "Notes", render: (o) => o.notes || "-" },
    { header: "Requested Date", render: (o) => formatDate(o.createdAt) || "-" },
    { header: "Delivery Date", render: (o) => formatDate(o.delivery_date) || "-" },
    {
      header: "Status", render: (o) => {
        const bgColors = {
          pending: "bg-yellow-400",
          approved: "bg-green-400",
          rejected: "bg-red-400",
          completed: "bg-gray-400",
          cancelled: "bg-red-400",
          on_hold: "bg-orange-400"
        };
        const bg = bgColors[o.status] || "bg-yellow-400";
        return (
          <span className={`inline-block w-22 text-center py-1 rounded-full text-xs font-semibold capitalize text-white ${bg}`}>
            {o.status || "Pending"}
          </span>
        );
      }
    },
    { header: "Rejection Reason", render: (o) => o.status === "rejected" ? o.rejection_reason || "-" : "-" },
    {
      header: "Actions", className: "text-center", render: (o) => (
        <div className="flex items-center justify-center">
          {o.status === "completed" && (
            <button className="text-[#1e3a5f] text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-semibold transition"
              onClick={() => { setReturnOrder(o); setReturnModalOpen(true); }}>
              Return to Supplier
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="h-content-available flex flex-col">
      <ProcessReturnModal
        open={returnModalOpen}
        onClose={() => { setReturnModalOpen(false); setReturnOrder(null); }}
        data={returnOrder}
        type="supplier_return"
        onSuccess={fetchData}
      />
      <PageHeader
        title="Order History"
        description="Review your past order requests and their statuses"
      />

      <div className="bg-white rounded-xl p-6 mb-3 border border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]">
            <HiOutlineFilter /> Filters
          </h3>
          <button onClick={handleReset} className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer hover:text-gray-500 transition">
            <HiOutlineRefresh /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Search</label>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
              placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
            <label className="block text-gray-700 text-sm mb-1">Status</label>
            <FilterDropdown value={filters.status} onChange={val => updateFilters({ status: val })} options={statusOptions} placeholder="All Statuses" />
          </div>
        </div>
      </div>

      <div className="overflow-auto min-h-0 flex flex-col">
        <DataTable columns={columns} data={filteredOrders} loading={loading} error={error} />
      </div>

      {filteredOrders.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default OrderHistory;

