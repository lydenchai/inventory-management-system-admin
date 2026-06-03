import React, { useState, useEffect } from "react";
import { getActivityLogs } from "../api";
import Pagination from "../components/Pagination";
import { useAuth } from "../contexts/auth/useAuth";
import { HiOutlineFilter, HiOutlineRefresh } from "react-icons/hi";
import DatePicker from "../components/DatePicker";
import { formatDate } from "../utils/dateFormat";

import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import useDataFetch from "../hooks/useDataFetch";
import useDebounce from "../hooks/useDebounce";

// Stable wrapper — maps start_date/end_date filter keys to the API's startDate/endDate params
const fetchActivityLogs = (params) =>
  getActivityLogs({ ...params, startDate: params.start_date, endDate: params.end_date });

const ActivityLog = () => {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: logs,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
  } = useDataFetch(fetchActivityLogs, {
    search: "",
    start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0]
  }
  );

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

  const columns = [
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "User", render: (log) => log.user ? `${log.user.first_name} ${log.user.last_name}` : "-" },
    { header: "Entity Type", render: (log) => log.entity_type || "-" },
    { header: "Details", render: (log) => log.details || "-" },
    { header: "Timestamp", render: (log) => formatDate(log.createdAt, true) },
    {
      header: "Action", render: (log) => log.action
        ? log.action.replace(/_/g, " ").charAt(0).toUpperCase() + log.action.replace(/_/g, " ").slice(1)
        : "-"
    }
  ];

  return (
    <div className="h-content-available flex flex-col">
      <PageHeader
        title="Activity Log"
        description="View and manage activity logs"
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
              placeholder="Search description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
        <DataTable columns={columns} data={logs} loading={loading} error={error} />
      </div>

      {logs.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
