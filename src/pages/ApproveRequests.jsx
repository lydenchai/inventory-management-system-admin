import React, { useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineFilter,
  HiOutlineEye,
  HiOutlineRefresh,
  HiDotsVertical,
  HiOutlineArchive,
} from "react-icons/hi";
import { useAuth } from "../contexts/auth/useAuth";
import { useDialog } from "../contexts/dialog/useDialog";
import { getApproveRequests, updateApproveRequests, deleteApproveRequest } from "../api";
import Pagination from "../components/Pagination";
import Dialog from "../components/Dialog";
import OrderRequestModal from "../components/OrderRequestModal";
import DatePicker from "../components/DatePicker";
import { useBadge } from "../contexts/badge/useBadge";

import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import useDataFetch from "../hooks/useDataFetch";
import useDebounce from "../hooks/useDebounce";

const getPermission = (user, permission) => user?.permission?.permissions?.includes(permission);

const OrderRequestApproval = () => {
  const [viewDialog, setViewDialog] = useState({ open: false, order: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null });
  const [approveDialog, setApproveDialog] = useState({ open: false, id: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveRemarks, setApproveRemarks] = useState("");
  const [actionId, setActionId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const { user } = useAuth();
  const dialog = useDialog();
  const { fetchBadge } = useBadge();

  const canView = getPermission(user, "view_approve_request");
  const canUpdate = getPermission(user, "update_approve_request");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

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
    setLoading
  } = useDataFetch(getApproveRequests, {
    search: "",
    status: "pending",
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
      status: "pending",
      start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0]
    });
  };

  function handleApprove(id) {
    setApproveDialog({ open: true, id });
    setApproveRemarks("");
  }

  async function handleConfirmApprove() {
    const id = approveDialog.id;
    setActionId(id);
    try {
      await updateApproveRequests(id, { status: "approved", admin_remarks: approveRemarks || "" });
      dialog.success("Order request approved.");
      setApproveDialog({ open: false, id: null });
      setApproveRemarks("");
      fetchData();
      fetchBadge();
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to approve order");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id, reason) {
    setActionId(id);
    try {
      await updateApproveRequests(id, { status: "rejected", rejection_reason: reason || "" });
      dialog.success("Order request rejected.");
      setRejectionReason("");
      setRejectDialog({ open: false, id: null });
      fetchData();
      fetchBadge();
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to reject order");
    } finally {
      setActionId(null);
    }
  }

  async function handleBulkActive(isActive) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updateApproveRequests(id, { is_active: isActive })));
      dialog.success(`Requests marked as ${isActive ? "Active" : "Archived"} successfully.`);
      fetchData();
      setSelectedIds([]);
      fetchBadge();
    } catch {
      dialog.error("Failed to update requests.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Requests", message: "Are you sure?" });
    if (!confirmed) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteApproveRequest(id)));
      dialog.success("Requests deleted successfully.");
      fetchData();
      setSelectedIds([]);
      fetchBadge();
    } catch {
      dialog.error("Failed to delete requests.");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    ...(canUpdate ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                checked={orders.length > 0 && selectedIds.length === orders.length}
                onChange={(e) => setSelectedIds(e.target.checked ? orders.map(o => o._id) : [])} />,
      className: "w-15",
      render: (o) => (
        <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          checked={selectedIds.includes(o._id)}
          onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, o._id] : prev.filter(id => id !== o._id))}
        />
      )
    }] : []),
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Requested By", render: (o) => o.requester ? `${o.requester.first_name} ${o.requester.last_name}` : "-" },
    { header: "Product(s)", render: (o) => Array.isArray(o.items) && o.items.length > 0
        ? o.items.map(item => `${item.product?.name || item.product_id} (${item.quantity})`).join(", ")
        : "-"
    },
    { header: "Requested Date", render: (o) => o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-" },
    { header: "Delivery Date", render: (o) => o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : "-" },
    { header: "Notes", render: (o) => o.notes || "-" },
    ...(canView || canUpdate ? [
      { header: "Actions", className: "text-center", render: (o) => (
          <div className="flex items-center gap-1 justify-center">
            {canView && (
              <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                onClick={() => setViewDialog({ open: true, order: o })}>
                <HiOutlineEye className="text-xl" />
              </button>
            )}
            {canUpdate && (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                  <HiDotsVertical className="text-xl" />
                </Menu.Button>
                <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-40 z-50 border border-gray-100 focus:outline-none">
                  <Menu.Item>
                    <button className="w-full flex items-center px-2 py-3 text-green-600 hover:bg-green-50 transition text-sm space-x-2 rounded-xl"
                      disabled={actionId === o._id}
                      onClick={() => handleApprove(o._id)}>
                      <HiOutlineCheckCircle className="mr-2 h-5 w-5" /> Approve
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button className="w-full flex items-center px-2 py-3 text-red-600 hover:bg-red-50 transition text-sm space-x-2 rounded-xl"
                      disabled={actionId === o._id}
                      onClick={() => { setRejectDialog({ open: true, id: o._id }); setRejectionReason(""); }}>
                      <HiOutlineXCircle className="mr-2 h-5 w-5" /> Reject
                    </button>
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            )}
          </div>
      )}
    ] : [])
  ];

  return (
    <div className="h-content-available flex flex-col">
      <OrderRequestModal
        open={viewDialog.open}
        data={viewDialog.order}
        viewOnly={true}
        onClose={() => setViewDialog({ open: false, order: null })}
        onApprove={() => { setViewDialog({ open: false, order: null }); handleApprove(viewDialog.order._id); }}
        onReject={() => { setViewDialog({ open: false, order: null }); setRejectDialog({ open: true, id: viewDialog.order._id }); setRejectionReason(""); }}
      />
      <Dialog
        open={rejectDialog.open}
        type="confirm"
        title="Reject Order Request"
        cancelText="Cancel"
        confirmText="Reject"
        showActions
        onClose={() => setRejectDialog({ open: false, id: null })}
        onConfirm={() => handleReject(rejectDialog.id, rejectionReason)}
        confirmDisabled={actionId === rejectDialog.id || !rejectionReason.trim()}
      >
        <div className="mb-3 w-full">
          <label className="block text-gray-500 text-sm mb-2">Please provide a reason for rejection:</label>
          <textarea className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
            placeholder="Rejection reason" value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={actionId === rejectDialog.id} autoFocus />
        </div>
      </Dialog>
      <Dialog
        open={approveDialog.open}
        type="confirm"
        title="Approve Order Request"
        cancelText="Cancel"
        confirmText="Approve"
        showActions
        onClose={() => setApproveDialog({ open: false, id: null })}
        onConfirm={handleConfirmApprove}
        confirmDisabled={actionId === approveDialog.id}
      >
        <div className="mb-3 w-full">
          <label className="block text-gray-700 text-sm mb-2 font-medium">Admin Remarks (Optional):</label>
          <textarea className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
            placeholder="Enter optional remarks..." value={approveRemarks}
            onChange={(e) => setApproveRemarks(e.target.value)}
            disabled={actionId === approveDialog.id} rows={3} />
        </div>
      </Dialog>

      <PageHeader
        title="Order Request Approvals"
        description="Review and manage order request approvals"
        actions={
          canUpdate && (
            <Menu as="div" className="relative inline-block text-left ml-2">
              <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                <HiDotsVertical className="text-xl" />
              </Menu.Button>
              <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-50 z-50 border border-gray-100 focus:outline-none">
                <Menu.Item>
                  <button onClick={() => handleBulkActive(true)} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                    <HiOutlineCheckCircle className="mr-2 h-5 w-5" /> Active Requests
                  </button>
                </Menu.Item>
                <Menu.Item>
                  <button onClick={() => handleBulkActive(false)} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
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
          )
        }
      />

      <div className="bg-white rounded-xl p-6 mb-3 border border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]">
            <HiOutlineFilter /> Filters
          </h3>
          <button onClick={handleReset} className="flex items-center gap-2 text-sm text-black cursor-pointer hover:text-gray-600 transition">
            <HiOutlineRefresh /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Search</label>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        </div>
      </div>

      <div className="overflow-auto min-h-0 flex flex-col">
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          error={error}
          rowClassName={(row) => row.is_active === false ? "opacity-50 grayscale" : ""}
        />
      </div>

      {orders.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default OrderRequestApproval;
