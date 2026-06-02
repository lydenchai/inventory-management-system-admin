import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  HiOutlineCheckCircle,
  HiOutlineFilter,
  HiSelector,
  HiOutlineRefresh,
  HiOutlineEye,
  HiDotsVertical,
  HiOutlineArchive,
  HiOutlineXCircle,
} from "react-icons/hi";
import { MdOutlineSmsFailed } from "react-icons/md";
import { useAuth } from "../contexts/auth/useAuth";
import { getOrderRequests, confirmDeliveryAction } from "../api";
import { formatDate } from "../utils/dateFormat";
import Pagination from "../components/Pagination";
import NoDataFound from "../components/NoDataFound";
import { Listbox, Menu } from "@headlessui/react";
import { useDialog } from "../contexts/dialog/useDialog";
import Loading from "../components/Loading";
import DatePicker from "../components/DatePicker";
import OrderRequestModal from "../components/OrderRequestModal";

const deliveryStatusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];
const approvalStatusOptions = [
  { value: "Delivered", label: "Delivered" },
  { value: "Pending", label: "Pending" },
];

function ApprovalStatusDropdown({ value, onChange }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>{value || "All Statuses"}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {deliveryStatusOptions.map((option) => (
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

ApprovalStatusDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function DeliveryStatusDropdown({ value, onChange }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>{value || "All Statuses"}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {approvalStatusOptions.map((option) => (
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

DeliveryStatusDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const DeliveryConfirmation = () => {
  const [confirmDeliveries, setConfirmDeliveries] = useState([]);

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
  const dialog = useDialog();
  const [viewDialog, setViewDialog] = useState({ open: false, order: null });

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
  const [approve_status, setApproveStatus] = useState("");
  const [delivery_status, setDeliveryStatus] = useState("");

  // Permissions
  const canViewOrder = getPermission(user, "view_confirm_delivery") || getPermission(user, "view_approve_request");
  const canUpdate = getPermission(user, "update_confirm_delivery");

  useEffect(() => {
    if (user) {
      fetchConfirmDeliveries(
        pagination.page,
        pagination.limit,
        search,
        start_date,
        end_date,
        approve_status,
        delivery_status,
      );
    }
  }, [
    user,
    pagination.page,
    pagination.limit,
    search,
    start_date,
    end_date,
    approve_status,
    delivery_status,
  ]);

  async function fetchConfirmDeliveries(
    page = 1,
    limit = 10,
    search,
    start_date,
    end_date,
    approve_status,
    delivery_status,
  ) {
    setLoading(true);
    setError("");
    try {
      // Map frontend filter names to backend query params
      const params = { page, limit };
      if (search) params.search = search;
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      // approve_status maps to approve_request.status
      // map statuses for OrderRequest
      if (approve_status) params.status = approve_status; // e.g., 'approved'
      if (delivery_status === "Delivered") params.status = "completed";
      if (delivery_status === "Pending") params.status = "approved"; // Pending delivery = Approved order

      // Default filter: show only approved (ready for delivery) and completed (delivered)
      if (!params.status) {
        params.status = ["approved", "completed"];
      }
      const res = await getOrderRequests(params);

      // Remove client-side filtering to allow all statuses to be viewed/filtered by user
      setConfirmDeliveries(res.data.data);

      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load confirm deliveries");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelivery(id) {
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Confirm Delivery",
      message: "Are you sure you want to confirm this delivery?",
      confirmText: "Confirm",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      await confirmDeliveryAction(id);
      await dialog.success("Delivery confirmed.");
      fetchConfirmDeliveries(
        pagination.page,
        pagination.limit,
        search,
        start_date,
        end_date,
        approve_status,
        delivery_status,
      );
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to confirm delivery");
    }
  }

  function handleView(order) {
    setViewDialog({ open: true, order });
  }

  const handleReset = () => {
    setSearch("");
    const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0];
    const defaultEndDate = new Date().toISOString().split("T")[0];
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setApproveStatus("");
    setDeliveryStatus("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchConfirmDeliveries(
      1,
      pagination.limit,
      "",
      defaultStartDate,
      defaultEndDate,
      "",
      "",
    );
  };

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  function handleSelectAll(e) {
    if (e.target.checked) {
      const newIds = confirmDeliveries.map((o) => o._id);
      setSelectedIds((prev) => [...new Set([...prev, ...newIds])]);
    } else {
      const pageIds = new Set(confirmDeliveries.map((o) => o._id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
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
      dialog.success(
        `Deliveries marked as ${isActive ? "Active" : "Archived"} successfully.`,
      );
      fetchConfirmDeliveries(
        pagination.page,
        pagination.limit,
        search,
        start_date,
        end_date,
        approve_status,
        delivery_status,
      );
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      dialog.error("Failed to update deliveries.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Deliveries",
      message: `Are you sure you want to delete ${selectedIds.length} records?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      dialog.success("Deliveries deleted successfully.");
      fetchConfirmDeliveries(
        pagination.page,
        pagination.limit,
        search,
        start_date,
        end_date,
        approve_status,
        delivery_status,
      );
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to delete deliveries.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-content-available">
      <OrderRequestModal
        open={viewDialog.open}
        data={viewDialog.order}
        viewOnly={true}
        onClose={() => setViewDialog({ open: false, order: null })}
        onConfirm={() => {
          setViewDialog({ open: false, order: null });
          handleConfirmDelivery(viewDialog.order._id);
        }}
        onEdit={() => {}}
      />
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Delivery Confirmation</h1>
          <span className="text-gray-500 text-sm">
            Manage and confirm deliveries
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
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Approval Status
            </label>
            <ApprovalStatusDropdown
              value={approve_status}
              onChange={(status) => {
                setApproveStatus(status);
                fetchConfirmDeliveries(
                  1,
                  pagination.limit,
                  search,
                  start_date,
                  end_date,
                  status,
                  delivery_status,
                );
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Delivery Status
            </label>
            <DeliveryStatusDropdown
              value={delivery_status}
              onChange={(status) => {
                setDeliveryStatus(status);
                fetchConfirmDeliveries(
                  1,
                  pagination.limit,
                  search,
                  start_date,
                  end_date,
                  approve_status,
                  status,
                );
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
                  {canUpdate && (
                    <th className="w-12 text-center">
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        checked={
                          confirmDeliveries.length > 0 &&
                          confirmDeliveries.every((o) =>
                            selectedIds.includes(o._id),
                          )
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
                  <th>Approval Status</th>
                  <th>Delivery Status</th>
                  <th className="text-center action">Actions</th>
                </tr>
              </thead>
              <tbody>
                {confirmDeliveries.map((confirm_delivery, index) => {
                  const isArchived = confirm_delivery.is_active === false;
                  return (
                    <tr
                      key={confirm_delivery._id}
                      className={`hover:bg-[#f1f5f9] ${isArchived ? "opacity-50 grayscale bg-gray-50" : ""}`}
                    >
                      {canUpdate && (
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="cursor-pointer"
                            checked={selectedIds.includes(confirm_delivery._id)}
                            onChange={(e) =>
                              handleSelectOne(e, confirm_delivery._id)
                            }
                          />
                        </td>
                      )}
                      <td className="number">
                        {index + 1 + (pagination.page - 1) * pagination.limit}
                      </td>
                      <td>
                        {confirm_delivery.requester?.first_name}{" "}
                        {confirm_delivery.requester?.last_name}
                      </td>
                      <td>
                        {Array.isArray(confirm_delivery?.items) &&
                        confirm_delivery?.items.length > 0
                          ? confirm_delivery?.items
                              .map((item) => `${item.product?.name} (${item.quantity})`)
                              .join(", ")
                          : "-"}
                      </td>
                      <td>{formatDate(confirm_delivery.createdAt) || "-"}</td>
                      <td>
                        {formatDate(confirm_delivery.delivery_date) || "-"}
                      </td>
                      <td>
                        <span
                          className={`inline-block w-22.5 text-center py-1.5 rounded-full text-sm text-white ${confirm_delivery.status === "approved" || confirm_delivery.status === "completed" ? "bg-green-400" : "bg-yellow-400"}`}
                        >
                          Approved
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-block w-22.5 text-center py-1.5 rounded-full text-sm text-white ${confirm_delivery.status === "completed" ? "bg-green-400" : "bg-yellow-400"}`}
                        >
                          {confirm_delivery.status === "completed"
                            ? "Delivered"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="flex items-center gap-1 justify-center action">
                        {canViewOrder && (
                          <button
                            className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                            title="View"
                            onClick={() => handleView(confirm_delivery)}
                          >
                            <HiOutlineEye className="text-2xl" />
                          </button>
                        )}
                        <Menu
                          as="div"
                          className="relative inline-block text-left"
                        >
                          <Menu.Button
                            className="text-[#1e3a5f] font-semibold cursor-pointer disabled:cursor-default p-2 rounded-full hover:bg-gray-200 disabled:hover:bg-transparent disabled:opacity-50"
                            disabled={
                              confirm_delivery.status === "completed" ||
                              !canUpdate
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
                                  onClick={() =>
                                    handleConfirmDelivery(confirm_delivery._id)
                                  }
                                  className="w-full flex items-center px-2 py-3 text-green-600 hover:bg-green-50 transition text-sm space-x-2 rounded-xl cursor-pointer"
                                >
                                  <HiOutlineCheckCircle
                                    className="text-green-600 mr-2 h-5 w-5"
                                    aria-hidden="true"
                                  />
                                  Confirm
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </td>
                    </tr>
                  );
                })}
                {confirmDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={canUpdate ? 9 : 8}>
                      <NoDataFound message="No deliveries found." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {confirmDeliveries.length > 0 && (
        <div className="flex justify-end mt-3">
          <Pagination
            total={pagination.totalItems}
            page={pagination.page}
            limit={pagination.limit}
            onChange={({ page, limit }) => {
              setPagination((prev) => ({ ...prev, page, limit }));
              fetchConfirmDeliveries(page, limit);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DeliveryConfirmation;
