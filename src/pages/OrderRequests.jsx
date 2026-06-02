import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
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
} from "react-icons/hi";
import { MdOutlineSmsFailed } from "react-icons/md";
import { useAuth } from "../contexts/auth/useAuth.js";
import { useDialog } from "../contexts/dialog/useDialog.js";
import OrderRequestModal from "../components/OrderRequestModal.jsx";
import { getOrderRequests, cancelOrderRequest } from "../api";
import { useCart } from "../contexts/cart/useCart";
import Pagination from "../components/Pagination";
import NoDataFound from "../components/NoDataFound";
import Loading from "../components/Loading";
import { formatDate } from "../utils/dateFormat";
import { Listbox, Menu } from "@headlessui/react";
import DatePicker from "../components/DatePicker";
import { useBadge } from "../contexts/badge/useBadge";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "on_hold", label: "On Hold" },
];

function StatusDropdown({ value, onChange }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>{value || "All Statuses"}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {statusOptions.map((option) => (
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

StatusDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const OrderRequests = () => {
  const [requests, setRequests] = useState([]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [updateOrderRequest, setUpdateOrderRequest] = useState(null);
  // View Order Request
  const [viewOrderRequest, setViewOrderRequest] = useState(null);
  // Loading and Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const dialog = useDialog();
  const { fetchBadge } = useBadge();
  const { cartItems, clearCart } = useCart();

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
  const [status, setStatus] = useState("");

  // Permissions
  const canView = getPermission(user, "view_order_request");
  const canCreate = getPermission(user, "create_order_request");
  const canUpdate = getPermission(user, "update_order_request");
  const canDelete = getPermission(user, "delete_order_request");
  const isInternalUser = user.user_type === "internal";

  useEffect(() => {
    if (user) {
      fetchOrderRequests(
        pagination.page,
        pagination.limit,
        search,
        start_date,
        end_date,
        status,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search, status, start_date, end_date]);

  // Fetch order requests from API
  async function fetchOrderRequests(
    page = pagination.page,
    limit = pagination.limit,
    search,
    start_date,
    end_date,
    status,
  ) {
    setLoading(true);
    setError("");
    try {
      const res = await getOrderRequests({
        page,
        limit,
        search,
        start_date,
        end_date,
        status,
      });
      setRequests(res.data.data);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load order requests");
    } finally {
      setLoading(false);
    }
  }

  function handleView(orderRequest) {
    setUpdateOrderRequest(null);
    setViewOrderRequest(orderRequest);
    setModalOpen(true);
  }

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
      await dialog.success("Order request cancelled successfully.");
      fetchOrderRequests(pagination.page, pagination.limit, search, start_date, end_date, status);
      fetchBadge(); // Update badge
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to cancel order request");
    } finally {
      setLoading(false);
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
    setStatus("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOrderRequests(
      1,
      pagination.limit,
      "",
      defaultStartDate,
      defaultEndDate,
      "",
    );
  };

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  async function handleSelectAll(e) {
    if (e.target.checked) {
      setLoading(true);
      try {
        const res = await getOrderRequests({
          limit: -1,
          search,
          start_date,
          end_date,
          status,
        });
        const allIds = res.data.data.map((r) => r._id);
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
    setLoading(true);
    try {
      // Need to import updateOrderRequest
      // Assuming updateOrderRequest(id, data) matches backend
      const { updateOrderRequest } = await import("../api");
      await Promise.all(
        selectedIds.map((id) =>
          updateOrderRequest(id, { is_active: isActive }),
        ),
      );
      dialog.success(
        `Order requests marked as ${isActive ? "Active" : "Archived"} successfully.`,
      );
      fetchOrderRequests(
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
      dialog.error("Failed to update order requests.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    // Order Requests might not have a delete API exposed or it might be restricted.
    // The permissions check `canDelete` exists.
    const { deleteOrderRequest } = await import("../api"); // Dynamic import to be safe if not at top
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Order Requests",
      message: `Are you sure you want to delete ${selectedIds.length} requests?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteOrderRequest(id)));
      dialog.success("Order requests deleted successfully.");
      fetchOrderRequests(
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
      dialog.error("Failed to delete order requests.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-content-available">
      <OrderRequestModal
        open={modalOpen}
        data={
          updateOrderRequest ||
          viewOrderRequest ||
          (cartItems.length > 0
            ? {
                supplier_id: cartItems[0].product.supplier?._id ||
                  (typeof cartItems[0].product.supplier === "string"
                    ? cartItems[0].product.supplier
                    : ""),
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
        viewOnly={!!viewOrderRequest}
        onClose={() => {
          setModalOpen(false);
          setUpdateOrderRequest(null);
          setViewOrderRequest(null);
        }}
        onSave={() => {
          setModalOpen(false);
          setUpdateOrderRequest(null);
          setViewOrderRequest(null);
          clearCart();
          fetchOrderRequests(pagination.page, pagination.limit, search, start_date, end_date, status);
          fetchBadge();
        }}
        onEdit={() => {
          setUpdateOrderRequest(viewOrderRequest);
          setViewOrderRequest(null);
        }}
        onCancelRequest={async () => {
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
            await cancelOrderRequest(viewOrderRequest._id);
            await dialog.success("Order request cancelled successfully.");
            setModalOpen(false);
            setViewOrderRequest(null);
            fetchOrderRequests(
              pagination.page,
              pagination.limit,
              search,
              status,
            );
            fetchBadge(); // Update badge
          } catch (err) {
            dialog.error(
              err?.response?.data?.error || "Failed to cancel order request",
            );
          } finally {
            setLoading(false);
          }
        }}
      />
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Order Management</h1>
          <span className="text-gray-500 text-sm">
            Manage and track order requests
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={() => setModalOpen(true)}
            >
              <HiOutlinePlus className="text-md" /> Add Request
              {cartItems.length > 0 && (
                <span className="bg-white text-[#1e3a5f] text-xs font-bold rounded-full px-1.5 py-0.5">
                  {cartItems.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          )}
          {(canUpdate || canDelete) && (
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
              placeholder="Search by Requester, Product, Quantity..."
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
          <div>
            <label className="block text-gray-700 text-sm mb-1">Status</label>
            <StatusDropdown
              value={status}
              onChange={(status) => {
                setStatus(status);
                fetchOrderRequests(1, pagination.limit, search, start_date, end_date, status);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
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
                  {(canUpdate || canDelete) && (
                    <th className="w-15">
                      <input
                        type="checkbox"
                        name="selectAll"
                        id="selectAll"
                        className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                        checked={
                          requests.length > 0 &&
                          selectedIds.length === pagination.totalItems
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="number">No.</th>
                  <th>Requested By</th>
                  <th>Product(s)</th>
                  <th>Notes</th>
                  <th>Requested Date</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  {canView || canUpdate || canDelete ? (
                    <th className="text-center action">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => (
                    <tr
                      key={request._id}
                      className="hover:bg-[#f1f5f9] opacity-100"
                    >
                      {(canUpdate || canDelete) && (
                        <td className="w-15">
                          <input
                            type="checkbox"
                            name="select"
                            id="select"
                            className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                            checked={selectedIds.includes(request._id)}
                            onChange={(e) => handleSelectOne(e, request._id)}
                          />
                        </td>
                      )}
                      <td className="number">
                        {index + 1 + (pagination.page - 1) * pagination.limit}
                      </td>
                      <td>
                        {request.requester?.first_name +
                          " " +
                          request.requester?.last_name || "-"}
                      </td>
                      <td>
                        {Array.isArray(request.items) &&
                        request.items.length > 0
                          ? request.items
                              .map((item) => `${item.product?.name} (${item.quantity})`)
                              .join(", ")
                          : "-"}
                      </td>
                      <td>{request.notes || "-"}</td>
                      <td>{formatDate(request.createdAt) || "-"}</td>
                      <td>{formatDate(request.delivery_date) || "-"}</td>
                      <td>
                        <span
                          className={`inline-block w-22.5 text-center py-1.5 rounded-full text-sm text-white ${request.status === "pending" ? "bg-yellow-400" : request.status === "approved" ? "bg-green-400" : request.status === "rejected" ? "bg-red-400" : request.status === "completed" ? "bg-blue-400" : request.status === "cancelled" ? "bg-red-400" : request.status === "on_hold" ? "bg-orange-400" : "bg-gray-400"}`}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </span>
                      </td>
                      <td className="flex items-center gap-1 justify-center action">
                        <div className="flex items-center gap-1">
                          {(isInternalUser ||
                            canView ||
                            String(request.requester_id) ===
                              String(user?._id)) && (
                            <button
                              className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                              title="View"
                              onClick={() => {
                                handleView(request);
                              }}
                            >
                              <HiOutlineEye className="text-xl" />
                            </button>
                          )}
                          <Menu
                            as="div"
                            className="relative inline-block text-left"
                          >
                            <Menu.Button
                              className="text-[#1e3a5f] font-semibold cursor-pointer disabled:cursor-default p-2 rounded-full hover:bg-gray-200 disabled:hover:bg-transparent disabled:opacity-50"
                              disabled={
                                String(request.requester_id) !==
                                  String(user?._id) ||
                                request.status !== "pending"
                              }
                            >
                              <HiDotsVertical className="text-xl" />
                            </Menu.Button>
                            <Menu.Items
                              anchor="bottom end"
                              className="bg-white rounded-2xl shadow-lg p-2 w-40 z-50 animate-fade-in-up border border-gray-100"
                            >
                              <Menu.Item>
                                {() => (
                                  <button
                                    onClick={() => {
                                      setUpdateOrderRequest(request);
                                      setModalOpen(true);
                                    }}
                                    className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl cursor-pointer"
                                  >
                                    <HiOutlinePencil className="mr-2 h-5 w-5" />
                                    Update
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {() => (
                                  <button
                                    onClick={() =>
                                      handleCancelRequest(request._id)
                                    }
                                    className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl cursor-pointer"
                                  >
                                    <HiOutlineXCircle className="mr-2 h-5 w-5" />
                                    Cancel
                                  </button>
                                )}
                              </Menu.Item>
                            </Menu.Items>
                          </Menu>
                        </div>
                      </td>
                    </tr>
                  ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={canCreate || canUpdate || canDelete ? 9 : 8}>
                      <NoDataFound message="No order requests found." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {requests.length > 0 && (
        <div className="flex justify-end mt-3">
          <Pagination
            total={pagination.totalItems}
            page={pagination.page}
            limit={pagination.limit}
            onChange={({ page, limit }) => {
              setPagination((prev) => ({ ...prev, page, limit }));
              fetchOrderRequests(page, limit);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OrderRequests;
