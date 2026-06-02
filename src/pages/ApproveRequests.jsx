import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/auth/useAuth";
import { useDialog } from "../contexts/dialog/useDialog";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineFilter,
  HiOutlineEye,
  HiOutlineRefresh,
  HiDotsVertical,
  HiOutlineArchive,
} from "react-icons/hi";
import { MdOutlineSmsFailed } from "react-icons/md";
import { getApproveRequests, updateApproveRequests } from "../api";
import Pagination from "../components/Pagination";
import NoDataFound from "../components/NoDataFound";
import Loading from "../components/Loading";
import Dialog from "../components/Dialog";
import OrderRequestModal from "../components/OrderRequestModal";
import DatePicker from "../components/DatePicker";
import { Menu } from "@headlessui/react";

import { useBadge } from "../contexts/badge/useBadge";

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const OrderRequestApproval = () => {
  const [orders, setOrders] = useState([]);

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

  // Modal
  const [remarks, setRemarks] = useState({});
  const [actionId, setActionId] = useState(null);

  // Dialog
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null });
  const [approveDialog, setApproveDialog] = useState({ open: false, id: null });
  const [viewDialog, setViewDialog] = useState({ open: false, order: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveRemarks, setApproveRemarks] = useState("");

  // Auth
  const { user } = useAuth();
  const dialog = useDialog();
  const { fetchBadge } = useBadge();

  // Filters
  const [search, setSearch] = useState("");
  const [start_date, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
  );
  const [end_date, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Permissions
  const canView = getPermission(user, "view_approve_request");
  const canUpdate = getPermission(user, "update_approve_request");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchApproveRequests(1, pagination.limit, search, start_date, end_date);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search, start_date, end_date]);

  async function fetchApproveRequests(
    page = 1,
    limit = 10,
    search,
    start_date,
    end_date,
    statusFilter = status, // Use current status state if not passed
  ) {
    setLoading(true);
    setError("");
    try {
      const res = await getApproveRequests({
        page,
        limit,
        search,
        start_date,
        end_date,
        status: statusFilter, // Pass status to API
      });

      setOrders(res.data.data);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load approve requests");
    } finally {
      setLoading(false);
    }
  }

  function handleApprove(id) {
    setApproveDialog({ open: true, id });
    setApproveRemarks("");
  }

  async function handleConfirmApprove() {
    const id = approveDialog.id;
    setActionId(id);
    try {
      await updateApproveRequests(id, {
        status: "approved",
        admin_remarks: approveRemarks || "",
      });
      await dialog.success("Order request approved.");
      setApproveDialog({ open: false, id: null });
      setApproveRemarks("");
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchApproveRequests(1, pagination.limit, search, start_date, end_date);
      fetchBadge(); // Update badge
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to approve order");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id, reason) {
    setActionId(id);
    try {
      await updateApproveRequests(id, {
        status: "rejected",
        admin_remarks: remarks[id] || "",
        rejection_reason: reason || "",
      });
      await dialog.success("Order request rejected.");
      setRemarks({});
      setRejectionReason("");
      setRejectDialog({ open: false, id: null });
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchApproveRequests(1, pagination.limit, search, start_date, end_date);
      fetchBadge();
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to approve order");
    } finally {
      setActionId(null);
    }
  }

  function handleView(order) {
    setViewDialog({ open: true, order });
  }

  const [status, setStatus] = useState("pending");

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  async function handleSelectAll(e) {
    if (e.target.checked) {
      setLoading(true);
      try {
        const res = await getApproveRequests({
          limit: -1,
          search,
          start_date,
          end_date,
          status: status, // status state from line 179
        });
        const allIds = res.data.data.map((o) => o._id);
        setSelectedIds(allIds);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedIds([]);
    }
  }

  function handleSelectOne(e, id) {
    if (e.target.checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  }

  async function handleBulkActive(isActive) {
    if (selectedIds.length === 0) return;
    setActionId("bulk");
    try {
      const { updateApproveRequests } = await import("../api");
      await Promise.all(
        selectedIds.map((id) =>
          updateApproveRequests(id, { is_active: isActive }),
        ),
      );
      dialog.success(
        `Requests marked as ${isActive ? "Active" : "Archived"} successfully.`,
      );
      fetchApproveRequests(
        pagination.page,
        pagination.limit,
        search,
        start_date,
        end_date,
        status,
      );
      setSelectedIds([]);
      fetchBadge();
    } catch (err) {
      console.error(err);
      dialog.error("Failed to update requests.");
    } finally {
      setActionId(null);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Requests",
      message: `Are you sure you want to delete ${selectedIds.length} requests?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setActionId("bulk");
    try {
      const { deleteApproveRequest } = await import("../api");
      await Promise.all(selectedIds.map((id) => deleteApproveRequest(id)));
      dialog.success("Requests deleted successfully.");
      fetchApproveRequests(
        pagination.page,
        pagination.limit,
        search,
        start_date,
        end_date,
        status,
      );
      setSelectedIds([]);
      fetchBadge();
    } catch {
      dialog.error("Failed to delete requests.");
    } finally {
      setActionId(null);
    }
  }

  const handleReset = () => {
    setSearch("");
    const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0];
    const defaultEndDate = new Date().toISOString().split("T")[0];
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setStatus("pending");
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchApproveRequests(
      1,
      pagination.limit,
      "",
      defaultStartDate,
      defaultEndDate,
      "pending",
    );
  };

  return (
    <div className="h-content-available">
      <OrderRequestModal
        open={viewDialog.open}
        data={viewDialog.order}
        viewOnly={true}
        onClose={() => setViewDialog({ open: false, order: null })}
        onApprove={() => {
          setViewDialog({ open: false, order: null });
          handleApprove(viewDialog.order._id);
        }}
        onReject={() => {
          setViewDialog({ open: false, order: null });
          setRejectDialog({
            open: true,
            id: viewDialog.order._id,
          });
          setRejectionReason("");
        }}
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
        confirmDisabled={
          actionId === rejectDialog.id || !rejectionReason.trim()
        }
      >
        <div className="mb-3 w-full">
          <label className="block text-gray-500 text-sm mb-2">
            Please provide a reason for rejection:
          </label>
          <textarea
            type="text"
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
            placeholder="Rejection reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={actionId === rejectDialog.id}
            autoFocus
          />
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
          <label className="block text-gray-700 text-sm mb-2 font-medium">
            Admin Remarks (Optional):
          </label>
          <textarea
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
            placeholder="Enter optional remarks..."
            value={approveRemarks}
            onChange={(e) => setApproveRemarks(e.target.value)}
            disabled={actionId === approveDialog.id}
            rows={3}
          />
        </div>
      </Dialog>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Order Request Approvals</h1>
          <span className="text-gray-500 text-sm">
            Review and manage order request approvals
          </span>
        </div>

        {canUpdate && (
          <Menu as="div" className="relative inline-block text-left ml-2">
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
                    onClick={() => handleBulkActive(true)}
                    className={`w-full flex items-center px-2 py-3 text-[#64748b] transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:text-black hover:bg-[#f1f5f9]"}`}
                  >
                    <HiOutlineCheckCircle
                      className="mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    Active Requests
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {() => (
                  <button
                    onClick={() => handleBulkActive(false)}
                    className={`w-full flex items-center px-2 py-3 text-[#64748b] transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:text-black hover:bg-[#f1f5f9]"}`}
                  >
                    <HiOutlineArchive
                      className="mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    Archive Requests
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {() => (
                  <button
                    onClick={handleBulkDelete}
                    className={`w-full flex items-center px-2 py-3 text-red-500 transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:bg-red-50"}`}
                  >
                    <HiOutlineXCircle
                      className="text-red-500 mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    Delete Requests
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        )}
      </div>
      <div className="bg-white rounded-xl p-6 mb-3 border border-gray-100">
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
              onChange={(e) => setSearch(e.target.value)}
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
                  {canUpdate && (
                    <th className="w-15">
                      <input
                        type="checkbox"
                        name="selectAll"
                        id="selectAll"
                        className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                        checked={
                          orders.length > 0 &&
                          selectedIds.length === pagination.totalItems
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="number">No.</th>
                  <th>Requested By</th>
                  <th>Product(s)</th>
                  <th>Requested Date</th>
                  <th>Delivery Date</th>
                  <th>Notes</th>
                  {canUpdate ? (
                    <th className="text-center action">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr
                    key={order._id}
                    className={`hover:bg-[#f1f5f9] ${order.is_active === false ? "opacity-50 grayscale" : ""}`}
                  >
                    {canUpdate && (
                      <td className="w-15">
                        <input
                          type="checkbox"
                          name="select"
                          id="select"
                          className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                          checked={selectedIds.includes(order._id)}
                          onChange={(e) => handleSelectOne(e, order._id)}
                        />
                      </td>
                    )}
                    <td className="number">
                      {index + 1 + (pagination.page - 1) * pagination.limit}
                    </td>
                    <td>
                      {order.requester?.first_name +
                        " " +
                        order.requester?.last_name || "-"}
                    </td>
                    <td>
                      {Array.isArray(order.items) && order.items.length > 0
                        ? order.items
                            .map(
                              (item) => `${item.product?.name || item.product_id} (${item.quantity})`,
                            )
                            .join(", ")
                        : "-"}
                    </td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {order.delivery_date
                        ? new Date(order.delivery_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{order.notes || "-"}</td>
                    <td className="flex items-center gap-1 justify-center action">
                      {canView && (
                        <button
                          className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                          title="View"
                          onClick={() => handleView(order)}
                        >
                          <HiOutlineEye className="text-2xl" />
                        </button>
                      )}
                      {canUpdate && (
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
                            <Menu.Item>
                              {() => (
                                <button
                                  className="w-full flex items-center px-2 py-3 text-green-600 hover:bg-green-50 transition text-sm space-x-2 rounded-xl cursor-pointer"
                                  disabled={actionId === order._id}
                                  onClick={() => handleApprove(order._id)}
                                >
                                  <HiOutlineCheckCircle
                                    className="text-green-600 mr-2 h-5 w-5"
                                    aria-hidden="true"
                                  />
                                  Approve
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {() => (
                                <button
                                  className="w-full flex items-center px-2 py-3 text-red-600 hover:bg-red-50 transition text-sm space-x-2 rounded-xl cursor-pointer"
                                  disabled={actionId === order._id}
                                  onClick={() => {
                                    setRejectDialog({
                                      open: true,
                                      id: order._id,
                                    });
                                    setRejectionReason("");
                                  }}
                                >
                                  <HiOutlineXCircle
                                    className="text-red-600 mr-2 h-5 w-5"
                                    aria-hidden="true"
                                  />
                                  Reject
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={canUpdate ? 8 : 7}>
                      <NoDataFound message="No approve requests found." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {orders.length > 0 && (
        <div className="flex justify-end mt-3">
          <Pagination
            total={pagination.totalItems}
            page={pagination.page}
            limit={pagination.limit}
            onChange={({ page, limit }) => {
              setPagination((prev) => ({ ...prev, page, limit }));
              fetchApproveRequests(page, limit);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OrderRequestApproval;
