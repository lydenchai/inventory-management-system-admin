// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Listbox, Menu } from "@headlessui/react";
import {
  HiSelector,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineEye,
  HiDotsVertical,
  HiOutlineCheckCircle,
  HiOutlineArchive,
} from "react-icons/hi";
import { useAuth } from "../contexts/auth/useAuth";
import { useDialog } from "../contexts/dialog/useDialog";
import ExpenseModal from "../components/ExpenseModal";
import { getExpenses, deleteExpense, createExpense, updateExpense } from "../api";
import Pagination from "../components/Pagination";
import { formatDate } from "../utils/dateFormat";
import DatePicker from "../components/DatePicker";

import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import useDataFetch from "../hooks/useDataFetch";
import useDebounce from "../hooks/useDebounce";

const categoryStyles = {
  Rent: "bg-orange-500 text-white",
  Utilities: "bg-cyan-100 text-cyan-700",
  Salary: "bg-green-500 text-white",
  Inventory: "bg-gray-100 text-gray-900",
  Marketing: "bg-purple-100 text-purple-700",
  Transport: "bg-amber-100 text-amber-700",
  Other: "bg-gray-100 text-gray-700",
};

function CategoryDropdown({ value, onChange }) {
  const categories = ["Rent", "Utilities", "Salary", "Inventory", "Marketing", "Transport", "Other"];
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between">
          <span className="truncate">{value || "All Categories"}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          <Listbox.Option value="" className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
            All Categories
          </Listbox.Option>
          {categories.map((cat) => (
            <Listbox.Option key={cat} value={cat} className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
              {cat}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

const getPermission = (user, permission) => user?.permission?.permissions?.includes(permission);

const Expenses = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [viewExpense, setViewExpense] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const dialog = useDialog();
  const { user } = useAuth();

  const canView = getPermission(user, "view_expense");
  const canCreate = getPermission(user, "create_expense");
  const canUpdate = getPermission(user, "update_expense");
  const canDelete = getPermission(user, "delete_expense");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: expenses,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
    setLoading
  } = useDataFetch(getExpenses, {
    search: "",
    category: "",
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

  async function handleSave(expenseData) {
    setLoading(true);
    try {
      if (editExpense) {
        await updateExpense(editExpense._id, expenseData);
        dialog.success("Expense updated successfully");
      } else {
        await createExpense(expenseData);
        dialog.success("Expense added successfully");
      }
      fetchData();
      setModalOpen(false);
      setEditExpense(null);
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Expense", message: "Are you sure?" });
    if (confirmed) {
      setLoading(true);
      try {
        await deleteExpense(id);
        dialog.success("Expense deleted successfully");
        fetchData();
      } catch (err) {
        dialog.error(err?.response?.data?.error || "Failed to delete expense");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleBulkStatus(status) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updateExpense(id, { status })));
      dialog.success(`Expenses marked as ${status} successfully.`);
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to update expenses.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Expenses", message: "Are you sure?" });
    if (!confirmed) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteExpense(id)));
      dialog.success("Expenses deleted successfully.");
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to delete expenses.");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    ...(canUpdate || canDelete ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
        checked={expenses.length > 0 && selectedIds.length === expenses.length}
        onChange={(e) => setSelectedIds(e.target.checked ? expenses.map(ex => ex._id) : [])} />,
      className: "w-15",
      render: (ex) => (
        <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          checked={selectedIds.includes(ex._id)}
          onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, ex._id] : prev.filter(id => id !== ex._id))}
        />
      )
    }] : []),
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Description", render: (ex) => ex.description || "-" },
    {
      header: "Category", render: (ex) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${categoryStyles[ex.category] || "bg-gray-100 text-gray-700"}`}>
          {ex.category}
        </span>
      )
    },
    { header: "Amount", className: "font-medium text-red-600", render: (ex) => `-$${Number(ex.amount).toFixed(2)}` },
    { header: "Date", render: (ex) => formatDate(ex.date, true) || "-" },
    {
      header: "Receipt", render: (ex) => ex.receipt_image ? (
        <a href={ex.receipt_image} target="_blank" rel="noopener noreferrer" className="text-[#1e3a5f] hover:underline text-xs">View</a>
      ) : "-"
    },
    {
      header: "Status", render: (ex) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize text-white ${ex.status === "active" ? "bg-green-500" : "bg-gray-400"}`}>
          {ex.status}
        </span>
      )
    },
    ...(canView || canUpdate || canDelete ? [
      {
        header: "Actions", className: "text-center", render: (ex) => (
          <div className="flex items-center gap-1 justify-center">
            {canView && (
              <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                onClick={() => { setEditExpense(null); setViewExpense(ex); setModalOpen(true); }}>
                <HiOutlineEye className="text-xl" />
              </button>
            )}
            {(canUpdate || canDelete) && (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                  <HiDotsVertical className="text-xl" />
                </Menu.Button>
                <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-40 z-50 border border-gray-100 focus:outline-none">
                  {canUpdate && (
                    <Menu.Item>
                      <button className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl"
                        onClick={() => { setViewExpense(null); setEditExpense(ex); setModalOpen(true); }}>
                        <HiOutlinePencil className="mr-2 h-5 w-5" /> Update
                      </button>
                    </Menu.Item>
                  )}
                  {canDelete && (
                    <Menu.Item>
                      <button className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl"
                        onClick={() => handleDelete(ex._id)}>
                        <HiOutlineTrash className="mr-2 h-5 w-5" /> Delete
                      </button>
                    </Menu.Item>
                  )}
                </Menu.Items>
              </Menu>
            )}
          </div>
        )
      }
    ] : [])
  ];

  return (
    <div className="h-content-available flex flex-col">
      <ExpenseModal
        key={modalOpen ? (editExpense ? editExpense._id : "new") : "closed"}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditExpense(null); setViewExpense(null); }}
        onSave={handleSave}
        data={editExpense || viewExpense}
        viewOnly={!!viewExpense}
        onEdit={() => { setEditExpense(viewExpense); setViewExpense(null); }}
      />

      <PageHeader
        title="Expense Tracking"
        description="Manage your business expenses"
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={() => { setViewExpense(null); setEditExpense(null); setModalOpen(true); }}>
                <HiOutlinePlus className="text-md" /> Add Expense
              </Button>
            )}
            {(canUpdate || canDelete) && (
              <Menu as="div" className="relative inline-block text-left ml-2">
                <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                  <HiDotsVertical className="text-xl" />
                </Menu.Button>
                <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-50 z-50 border border-gray-100 focus:outline-none">
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("active")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineCheckCircle className="mr-2 h-5 w-5" /> Active Expenses
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("inactive")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineArchive className="mr-2 h-5 w-5" /> Archive Expenses
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={handleBulkDelete} className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl">
                      <HiOutlineTrash className="text-red-500 mr-2 h-5 w-5" /> Delete Expenses
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
            <label className="block text-gray-700 text-sm mb-1">Category</label>
            <CategoryDropdown value={filters.category} onChange={val => updateFilters({ category: val })} />
          </div>
        </div>
      </div>

      <div className="overflow-auto min-h-0 flex flex-col">
        <DataTable columns={columns} data={expenses} loading={loading} error={error} />
      </div>

      {expenses.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default Expenses;

