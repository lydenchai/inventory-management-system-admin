// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Listbox, Menu } from "@headlessui/react";
import {
  HiSelector,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineXCircle,
  HiOutlineFilter,
  HiOutlineEye,
  HiOutlineRefresh,
  HiDotsVertical,
  HiOutlineCheckCircle,
  HiOutlineArchive,
  HiOutlineDocumentText,
} from "react-icons/hi";
import { useAuth } from "../../contexts/auth/useAuth.js";
import { useDialog } from "../../contexts/dialog/useDialog.js";
import OrderRequestModal from "../../components/modals/OrderRequestModal.jsx";
import { getOrderRequests, cancelOrderRequest, updateOrderRequest, deleteOrderRequest, createPurchaseOrder } from "../../api";
import { useCartStore } from "../../stores/useCartStore";
import Pagination from "../../components/ui/Pagination";
import { formatDate } from "../../utils/dateFormat";
import DatePicker from "../../components/ui/DatePicker";
import { useBadge } from "../../contexts/badge/useBadge";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
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

const getPermission = (user, permission) => user?.permission?.permissions?.includes(permission);

const OrderRequests = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [updateRequest, setUpdateRequest] = useState(null);
  const [viewRequest, setViewRequest] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const dialog = useDialog();
  const { user } = useAuth();
  const { fetchBadge } = useBadge();
  const { cartItems, clearCart } = useCartStore();

  const canView = getPermission(user, "view_order_request");
  const canCreate = getPermission(user, "create_order_request");
  const canUpdate = getPermission(user, "update_order_request");
  const canDelete = getPermission(user, "delete_order_request");
  const isInternalUser = user.user_type === "internal";

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: requests,
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

  async function handleCancelRequest(id) {
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Cancel Order Request",
      message: "Are you sure you want to cancel this order request?",
      confirmText: "Yes",
      cancelText: "No",
    });
    if (!confirmed) return;
    setLoading(true);
    try {
      await cancelOrderRequest(id);
      dialog.success("Order request cancelled successfully.");
      fetchData();
      fetchBadge();
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to cancel order request");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePO(id) {
    setLoading(true);
    try {
      await createPurchaseOrder({ order_request_id: id });
      dialog.success("Purchase Order generated successfully.");
      fetchData();
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to generate Purchase Order");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkActive(isActive) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updateOrderRequest(id, { is_active: isActive })));
      dialog.success(`Order requests marked as ${isActive ? "Active" : "Archived"} successfully.`);
      fetchData();
      setSelectedIds([]);
      fetchBadge();
    } catch {
      dialog.error("Failed to update order requests.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Order Requests", message: "Are you sure?" });
    if (!confirmed) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteOrderRequest(id)));
      dialog.success("Order requests deleted successfully.");
      fetchData();
      setSelectedIds([]);
      fetchBadge();
    } catch {
      dialog.error("Failed to delete order requests.");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    ...(canUpdate || canDelete ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
        checked={requests.length > 0 && selectedIds.length === requests.length}
        onChange={(e) => setSelectedIds(e.target.checked ? requests.map(r => r._id) : [])} />,
      className: "w-15",
      render: (r) => (
        <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          checked={selectedIds.includes(r._id)}
          onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, r._id] : prev.filter(id => id !== r._id))}
        />
      )
    }] : []),
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Requested By", render: (r) => r.requester ? `${r.requester.first_name} ${r.requester.last_name}` : "-" },
    { header: "Product(s)", render: (r) => Array.isArray(r.items) && r.items.length > 0 ? r.items.map(item => `${item.product?.name} (${item.quantity})`).join(", ") : "-" },
    { header: "Notes", render: (r) => r.notes || "-" },
    { header: "Requested Date", render: (r) => formatDate(r.createdAt) || "-" },
    { header: "Delivery Date", render: (r) => formatDate(r.delivery_date) || "-" },
    {
      header: "Status", render: (r) => {
        const bgColors = {
          pending: "bg-yellow-400",
          approved: "bg-green-400",
          rejected: "bg-red-400",
          completed: "bg-gray-400",
          cancelled: "bg-red-400",
          on_hold: "bg-orange-400"
        };
        const bg = bgColors[r.status] || "bg-gray-400";
        return (
          <span className={`inline-block w-22 text-center py-1 rounded-full text-xs font-semibold capitalize text-white ${bg}`}>
            {r.status}
          </span>
        );
      }
    },
    {
      header: "Actions", className: "text-center", render: (r) => (
        <div className="flex items-center gap-1 justify-center">
          {(isInternalUser || canView || String(r.requester_id) === String(user?._id)) && (
            <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
              onClick={() => { setUpdateRequest(null); setViewRequest(r); setModalOpen(true); }}>
              <HiOutlineEye className="text-xl" />
            </button>
          )}
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button
              className="text-[#1e3a5f] font-semibold cursor-pointer disabled:cursor-default p-2 rounded-full hover:bg-gray-200 disabled:hover:bg-transparent disabled:opacity-50"
              disabled={String(r.requester_id) !== String(user?._id) && !canUpdate && !canDelete && r.status !== "approved"}>
              <HiDotsVertical className="text-xl" />
            </Menu.Button>
            <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-40 z-50 border border-gray-100 focus:outline-none">
              {r.status === "approved" && (
                <Menu.Item>
                  <button className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-[#1e3a5f] hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl"
                    onClick={() => handleGeneratePO(r._id)}>
                    <HiOutlineDocumentText className="mr-2 h-5 w-5" /> Generate PO
                  </button>
                </Menu.Item>
              )}
              <Menu.Item>
                <button className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl"
                  onClick={() => { setViewRequest(null); setUpdateRequest(r); setModalOpen(true); }}>
                  <HiOutlinePencil className="mr-2 h-5 w-5" /> Update
                </button>
              </Menu.Item>
              <Menu.Item>
                <button className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl"
                  onClick={() => handleCancelRequest(r._id)}>
                  <HiOutlineXCircle className="mr-2 h-5 w-5" /> Cancel
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
        open={modalOpen}
        data={
          updateRequest ||
          viewRequest ||
          (cartItems.length > 0
            ? {
              supplier_id: cartItems[0].product.supplier?._id || (typeof cartItems[0].product.supplier === "string" ? cartItems[0].product.supplier : ""),
              delivery_date: new Date().toISOString().slice(0, 10),
              notes: "",
              orderItems: cartItems.map((item) => ({
                product_id: item.product._id,
                quantity: item.quantity,
                unit_price: item.product.price,
                subtotal: item.product.price * item.quantity,
              })),
            }
            : null)
        }
        viewOnly={!!viewRequest}
        onClose={() => { setModalOpen(false); setUpdateRequest(null); setViewRequest(null); }}
        onSave={() => {
          setModalOpen(false);
          setUpdateRequest(null);
          setViewRequest(null);
          clearCart();
          fetchData();
          fetchBadge();
        }}
        onEdit={() => { setUpdateRequest(viewRequest); setViewRequest(null); }}
        onCancelRequest={async () => {
          const confirmed = await dialog.ask({ type: "confirm", title: "Cancel Order Request", message: "Are you sure?" });
          if (!confirmed) return;
          setLoading(true);
          try {
            await cancelOrderRequest(viewRequest._id);
            dialog.success("Order request cancelled successfully.");
            setModalOpen(false);
            setViewRequest(null);
            fetchData();
            fetchBadge();
          } catch (err) {
            dialog.error(err?.response?.data?.error || "Failed to cancel order request");
          } finally {
            setLoading(false);
          }
        }}
      />

      <PageHeader
        title="Order Management"
        description="Manage and track order requests"
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={() => { setUpdateRequest(null); setViewRequest(null); setModalOpen(true); }}>
                <HiOutlinePlus className="text-md" /> Add Request
                {cartItems.length > 0 && (
                  <span className="bg-white text-[#1e3a5f] text-xs font-bold rounded-full px-1.5 py-0.5 ml-2">
                    {cartItems.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </Button>
            )}
            {(canUpdate || canDelete) && (
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
                      <HiOutlineXCircle className="mr-2 h-5 w-5" /> Delete Requests
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
              placeholder="Search by Requester, Product..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
        <DataTable columns={columns} data={requests} loading={loading} error={error} />
      </div>

      {requests.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default OrderRequests;

