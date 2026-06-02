import React, { useEffect, useState } from "react";
import { getActivityLogs } from "../api";
import Pagination from "../components/Pagination";
import { useAuth } from "../contexts/auth/useAuth";
import NoDataFound from "../components/NoDataFound";
import Loading from "../components/Loading";
import { HiOutlineFilter, HiOutlineRefresh } from "react-icons/hi";
import DatePicker from "../components/DatePicker";
import { formatDate } from "../utils/dateFormat";
import { MdOutlineSmsFailed } from "react-icons/md";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);

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

  // Auth
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

  useEffect(() => {
    if (user) {
      fetchLogs(1, pagination.limit, search, start_date, end_date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search, start_date, end_date]);

  async function fetchLogs(
    page = pagination.page,
    limit = pagination.limit,
    search = "",
    start_date,
    end_date,
  ) {
    setLoading(true);
    setError("");
    try {
      const res = await getActivityLogs({
        page,
        limit,
        search,
        startDate: start_date,
        endDate: end_date,
      });
      setLogs(res.data.data);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setSearch("");
    fetchLogs(
      1,
      pagination.limit,
      "",
      new Date().toISOString().split("T")[0],
      new Date().toISOString().split("T")[0],
    );
  };

  return (
    <div className="h-content-available">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Activity Log</h1>
          <span className="text-gray-500 text-sm">
            View and manage activity logs
          </span>
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
              type="text"
              className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-gray-700 text-sm"
              placeholder="Search description..."
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
                  <th className="number">No.</th>
                  <th>User</th>
                  <th>Entity Type</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log._id} className="hover:bg-[#f1f5f9]">
                    <td className="number">
                      {index + 1 + (pagination.page - 1) * pagination.limit}
                    </td>
                    <td>
                      {log.user?.first_name + " " + log.user?.last_name || "-"}
                    </td>
                    <td>{log.entity_type || "-"}</td>
                    <td>{log.details || "-"}</td>
                    <td>{formatDate(log.createdAt, true)}</td>
                    <td>
                      {log.action
                        ? log.action
                            .replace(/_/g, " ")
                            .charAt(0)
                            .toUpperCase() +
                          log.action.replace(/_/g, " ").slice(1)
                        : "-"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <NoDataFound message="No activity logs found." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {logs.length > 0 && pagination && typeof pagination === "object" && (
        <div className="flex justify-end mt-3">
          <Pagination
            total={pagination.totalItems}
            page={pagination.page}
            limit={pagination.limit}
            onChange={({ page, limit }) => {
              setPagination((prev) => ({ ...prev, page, limit }));
              fetchLogs(page, limit);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
