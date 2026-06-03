import React, { useState, useEffect } from "react";
import { Listbox, Menu } from "@headlessui/react";
import {
  HiSelector,
  HiOutlineCheckCircle,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineEye,
  HiDotsVertical,
  HiOutlineArchive,
  HiOutlineXCircle,
} from "react-icons/hi";
import { useAuth } from "../contexts/auth/useAuth";
import { getOrderRequests, confirmDeliveryAction } from "../api";
import { formatDate } from "../utils/dateFormat";
import { useDialog } from "../contexts/dialog/useDialog";
import Pagination from "../components/Pagination";
import DatePicker from "../components/DatePicker";
import OrderRequestModal from "../components/OrderRequestModal";

import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import useDataFetch from "../hooks/useDataFetch";
import useDebounce from "../hooks/useDebounce";

const deliveryStatusOptions = [
  { value: "Delivered", label: "Delivered" },
  { value: "Pending", label: "Pending" },
];
const approvalStatusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
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

const getPermission = (user, permission) => user?.permission?.permissions?.includes(permission);

const ConfirmDelivery = () => {
  const [viewDialog, setViewDialog] = useState({ open: false, order: null });
  const [selectedIds, setSelectedIds] = useState([]);
  const [approveStatus, setApproveStatus] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");

  const { user } = useAuth();
  const dialog = useDialog();

  const canViewOrder = getPermission(user, "view_confirm_delivery") || getPermission(user, "view_approve_request");
  const canUpdate = getPermission(user, "update_confirm_delivery");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: confirmDeliveries,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
    setLoading
  } = useDataFetch(getOrderRequests, {
    search: "",
    status: ["approved", "completed"],
    start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch]);

  useEffect(() => {
    let newStatus = ["approved", "completed"];
    if (approveStatus) {
      newStatus = approveStatus.toLowerCase();
    } else if (deliveryStatus === "Delivered") {
      newStatus = "completed";
    } else if (deliveryStatus === "Pending") {
      newStatus = "approved";
    }
    updateFilters({ status: newStatus });
  }, [approveStatus, deliveryStatus]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, filters, pagination.page, pagination.limit]);

  const handleReset = () => {
    setSearchTerm("");
    setApproveStatus("");
    setDeliveryStatus("");
    resetFilters({
      status: ["approved", "completed"],
      start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0]
    });
  };

  async function handleConfirmDelivery(id) {
    const confirmed = await dialog.ask({ type: "confirm", title: "Confirm Delivery", message: "Are you sure?" });
    if (!confirmed) return;
    try {
      await confirmDeliveryAction(id);
      dialog.success("Delivery confirmed.");
      fetchData();
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to confirm delivery");
    }
  }

  async function handleBulkActive(isActive) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      dialog.success(`Deliveries marked as ${isActive ? "Active" : "Archived"} successfully.`);
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to update deliveries.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Deliveries", message: "Are you sure?" });
    if (!confirmed) return;
    try {
      dialog.success("Deliveries deleted successfully.");
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to delete deliveries.");
    }
  }

  const columns = [
    ...(canUpdate ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
        checked={confirmDeliveries.length > 0 && selectedIds.length === confirmDeliveries.length}
        onChange={(e) => setSelectedIds(e.target.checked ? confirmDeliveries.map(o => o._id) : [])} />,
      className: "w-12 text-center",
      render: (o) => (
        <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          checked={selectedIds.includes(o._id)}
          onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, o._id] : prev.filter(id => id !== o._id))}
        />
      )
    }] : []),
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Requested By", render: (o) => o.requester ? `${o.requester.first_name} ${o.requester.last_name}` : "-" },
    { header: "Product(s)", render: (o) => Array.isArray(o.items) && o.items.length > 0 ? o.items.map(item => `${item.product?.name} (${item.quantity})`).join(", ") : "-" },
    { header: "Requested Date", render: (o) => formatDate(o.createdAt) || "-" },
    { header: "Delivery Date", render: (o) => formatDate(o.delivery_date) || "-" },
    {
      header: "Approval Status", render: (o) => (
        <span className={`inline-block w-22 text-center py-1 rounded-full text-xs font-semibold capitalize text-white ${o.status === "approved" || o.status === "completed" ? "bg-green-400" : "bg-yellow-400"}`}>
          Approved
        </span>
      )
    },
    {
      header: "Delivery Status", render: (o) => (
        <span className={`inline-block w-22 text-center py-1 rounded-full text-xs font-semibold capitalize text-white ${o.status === "completed" ? "bg-green-400" : "bg-yellow-400"}`}>
          {o.status === "completed" ? "Delivered" : "Pending"}
        </span>
      )
    },
    {
      header: "Actions", className: "text-center", render: (o) => (
        <div className="flex items-center gap-1 justify-center">
          {canViewOrder && (
            <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
              onClick={() => setViewDialog({ open: true, order: o })}>
              <HiOutlineEye className="text-xl" />
            </button>
          )}
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button
              className="text-[#1e3a5f] font-semibold cursor-pointer disabled:cursor-default p-2 rounded-full hover:bg-gray-200 disabled:hover:bg-transparent disabled:opacity-50"
              disabled={o.status === "completed" || !canUpdate}>
              <HiDotsVertical className="text-xl" />
            </Menu.Button>
            <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-40 z-50 border border-gray-100 focus:outline-none">
              <Menu.Item>
                <button className="w-full flex items-center px-2 py-3 text-green-600 hover:bg-green-50 transition text-sm space-x-2 rounded-xl"
                  onClick={() => handleConfirmDelivery(o._id)}>
                  <HiOutlineCheckCircle className="mr-2 h-5 w-5" /> Confirm
                </button>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      )
    }
  ];

  return (
    <div className="h-content-available flex flex-col">
      <OrderRequestModal
        open={viewDialog.open}
        data={viewDialog.order}
        viewOnly={true}
        onClose={() => setViewDialog({ open: false, order: null })}
        onConfirm={() => {
          setViewDialog({ open: false, order: null });
          handleConfirmDelivery(viewDialog.order._id);
        }}
        onEdit={() => { }}
      />

      <PageHeader
        title="Delivery Confirmation"
        description="Manage and confirm deliveries"
        actions={
          <div className="flex items-center gap-2">
            {canUpdate && (
              <Menu as="div" className="relative inline-block text-left ml-2">
                <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                  <HiDotsVertical className="text-xl" />
                </Menu.Button>
                <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-50 z-50 border border-gray-100 focus:outline-none">
                  <Menu.Item>
                    <button onClick={() => handleBulkActive(true)} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineCheckCircle className="mr-2 h-5 w-5" /> Active Requests
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={() => handleBulkActive(false)} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineArchive className="mr-2 h-5 w-5" /> Archive Requests
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={handleBulkDelete} className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl">
                      <HiOutlineXCircle className="text-red-500 mr-2 h-5 w-5" /> Delete Requests
                    </button>
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            )}
          </div>
        }
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
            <label className="block text-gray-700 text-sm mb-1">Approval Status</label>
            <FilterDropdown value={approveStatus} onChange={setApproveStatus} options={approvalStatusOptions} placeholder="All Statuses" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Delivery Status</label>
            <FilterDropdown value={deliveryStatus} onChange={setDeliveryStatus} options={deliveryStatusOptions} placeholder="All Statuses" />
          </div>
        </div>
      </div>

      <div className="overflow-auto min-h-0 flex flex-col">
        <DataTable columns={columns} data={confirmDeliveries} loading={loading} error={error} rowClassName={(row) => row.is_active === false ? "opacity-50 grayscale bg-gray-50" : ""} />
      </div>

      {confirmDeliveries.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default ConfirmDelivery;
