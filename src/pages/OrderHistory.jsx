import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../contexts/auth/useAuth";
import { getOrderRequests } from "../api";
import Pagination from "../components/Pagination";
import NoDataFound from "../components/NoDataFound";
import Loading from "../components/Loading";
import { formatDate } from "../utils/dateFormat";
import { HiSelector, HiOutlineFilter, HiOutlineRefresh } from "react-icons/hi";
import { Listbox } from "@headlessui/react";
import DatePicker from "../components/DatePicker";
import { MdOutlineSmsFailed } from "react-icons/md";

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

const OrderHistory = () => {
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
  const { user } = useAuth();

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

  useEffect(() => {
    if (user) {
      fetchOrders(
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

  async function fetchOrders(
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
      const params = { page, limit };
      if (status !== "") params.status = status;
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (search) params.search = search;
      const res = await getOrderRequests(params);
      setOrders(res.data.data);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load order history");
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOrders(
      1,
      pagination.limit,
      "",
      new Date().toISOString().split("T")[0],
      new Date().toISOString().split("T")[0],
      "",
    );
  };

  return (
    <div className="h-content-available">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Order History</h1>
          <span className="text-gray-500 text-sm">
            Review your past order requests and their statuses
          </span>
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
            <label className="block text-gray-700 text-sm mb-1">Status</label>
            <StatusDropdown
              value={status}
              onChange={(status) => {
                setStatus(status);
                fetchOrders(1, pagination.limit, search, status);
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
                  <th className="number">No.</th>
                  <th>Product(s)</th>
                  <th>Quantity(ies)</th>
                  <th>Notes</th>
                  <th>Requested Date</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Rejection Reason</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const userRole = user?.role?.toLowerCase();
                  return userRole === "admin" || userRole === "staff"
                    ? orders
                    : orders.filter(
                        (order) =>
                          String(order.requester_id) === String(user?._id),
                      );
                })().map((order, index) => (
                  <tr key={order._id} className="hover:bg-[#f1f5f9]">
                    <td className="number">
                      {index + 1 + (pagination.page - 1) * pagination.limit}
                    </td>
                    <td>
                      {Array.isArray(order.items) && order.items.length > 0
                        ? order.items
                            .map(
                              (item) => item.product?.name || item.product_id,
                            )
                            .join(", ")
                        : "-"}
                    </td>
                    <td>
                      {Array.isArray(order.items) && order.items.length > 0
                        ? order.items.map((item) => item.quantity).join(", ")
                        : "-"}
                    </td>
                    <td>{order.notes || "-"}</td>
                    <td>{formatDate(order.createdAt) || "-"}</td>
                    <td>{formatDate(order.delivery_date) || "-"}</td>
                    <td>
                      <span
                        className={`inline-block w-22.5 text-center py-1.5 rounded-full text-sm text-white ${order.status === "approved" ? "bg-green-400" : order.status === "rejected" ? "bg-red-400" : order.status === "completed" ? "bg-blue-400" : "bg-yellow-400"}`}
                      >
                        {order.status
                          ? order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)
                          : "Pending"}
                      </span>
                    </td>
                    <td>
                      {order.status === "rejected"
                        ? order.rejection_reason || "-"
                        : "-"}
                    </td>
                  </tr>
                ))}
                {(() => {
                  const userRole = user?.role?.toLowerCase();
                  return userRole === "admin" || userRole === "staff"
                    ? orders
                    : orders.filter(
                        (order) =>
                          String(order.requester_id) === String(user?._id),
                      );
                })().length === 0 && (
                  <tr>
                    <td colSpan="8">
                      <NoDataFound message="No orders found." />
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
              fetchOrders(page, limit);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
