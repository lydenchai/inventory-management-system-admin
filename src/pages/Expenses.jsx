import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  getExpenses,
  deleteExpense,
  createExpense,
  updateExpense,
} from "../api";
import Pagination from "../components/Pagination";
import ExpenseModal from "../components/ExpenseModal";
import { useAuth } from "../contexts/auth/useAuth";
import NoDataFound from "../components/NoDataFound";
import Loading from "../components/Loading";
import {
  HiOutlinePlus,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineArchive,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiSelector,
  HiDotsVertical,
} from "react-icons/hi";
import { MdOutlineSmsFailed } from "react-icons/md";
import { useDialog } from "../contexts/dialog/useDialog";
import { Listbox, Menu } from "@headlessui/react";
import { formatDate } from "../utils/dateFormat";
import DatePicker from "../components/DatePicker";

const categoryStyles = {
  Rent: "bg-orange-100 text-orange-700",
  Utilities: "bg-cyan-100 text-cyan-700",
  Salary: "bg-emerald-100 text-emerald-700",
  Inventory: "bg-blue-100 text-blue-700",
  Marketing: "bg-purple-100 text-purple-700",
  Transport: "bg-amber-100 text-amber-700",
  Other: "bg-gray-100 text-gray-700",
};

function CategoryDropdown({ value, onChange }) {
  const categories = [
    "Rent",
    "Utilities",
    "Salary",
    "Inventory",
    "Marketing",
    "Transport",
    "Other",
  ];
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>{value || "All Categories"}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {categories.map((cat) => (
            <Listbox.Option
              key={cat}
              value={cat}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {cat}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

CategoryDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);

  // View Expense
  const [viewExpense, setViewExpense] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);

  // Loading and Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dialog
  const dialog = useDialog();

  // Auth
  const { user } = useAuth();

  // Permissions
  const canView = getPermission(user, "view_expense");
  const canCreate = getPermission(user, "create_expense");
  const canUpdate = getPermission(user, "update_expense");
  const canDelete = getPermission(user, "delete_expense");

  // Filters
  const [category, setCategory] = useState("All Categories");
  const [start_date, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
  );
  const [end_date, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchExpenses(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, start_date, end_date, search]);

  async function fetchExpenses(page = 1, limit = 10) {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit };
      if (category !== "All Categories") params.category = category;
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (search) params.search = search;

      const res = await getExpenses(params);
      setExpenses(res.data.data);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }

  function handleView(expense) {
    setEditExpense(null);
    setViewExpense(expense);
    setModalOpen(true);
  }

  async function handleSave(expenseData) {
    setLoading(true);
    setError("");
    try {
      if (editExpense) {
        await updateExpense(editExpense._id, expenseData);
        dialog.success("Expense updated successfully");
      } else {
        await createExpense(expenseData);
        dialog.success("Expense added successfully");
      }
      fetchExpenses(1, pagination.limit);
      setModalOpen(false);
      setEditExpense(null);
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Expense",
      message: "Are you sure you want to delete this expense record?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      setLoading(true);
      try {
        await deleteExpense(id);
        await dialog.success("Expense deleted successfully");
        fetchExpenses(pagination.page, pagination.limit);
      } catch {
        dialog.error("Failed to delete expense");
      } finally {
        setLoading(false);
      }
    }
  }

  const handleReset = () => {
    setCategory("All Categories");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchExpenses(
      1,
      pagination.limit,
      "",
      new Date().toISOString().split("T")[0],
      new Date().toISOString().split("T")[0],
      "All Categories",
    );
  };

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  async function handleSelectAll(e) {
    if (e.target.checked) {
      setLoading(true);
      try {
        const params = {
          limit: -1,
          search,
          category,
          start_date,
          end_date,
        };
        if (category !== "All Categories") params.category = category;

        const res = await getExpenses(params);
        const allIds = res.data.data.map((ex) => ex._id);
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

  async function handleBulkStatus(status) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updateExpense(id, { status })));
      await dialog.success(`Expenses marked as ${status} successfully.`);
      fetchExpenses(pagination.page, pagination.limit);
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to update expenses.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Expenses",
      message: `Are you sure you want to delete ${selectedIds.length} expenses?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteExpense(id)));
      await dialog.success("Expenses deleted successfully.");
      fetchExpenses(pagination.page, pagination.limit);
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to delete expenses.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-content-available">
      <ExpenseModal
        key={modalOpen ? (editExpense ? editExpense._id : "new") : "closed"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditExpense(null);
          setViewExpense(null);
        }}
        onSave={handleSave}
        data={editExpense || viewExpense}
        viewOnly={!!viewExpense}
        onEdit={() => {
          setEditExpense(viewExpense);
          setViewExpense(null);
        }}
      />
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Expense Tracking</h1>
          <span className="text-gray-500 text-sm">
            Manage your business expenses
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={() => {
                setViewExpense(null);
                setEditExpense(null);
                setModalOpen(true);
              }}
            >
              <HiOutlinePlus className="text-md" /> Add Expense
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
                      onClick={() => handleBulkStatus("active")}
                      className={`w-full flex items-center px-2 py-3 text-[#64748b] transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:text-black hover:bg-[#f1f5f9]"}`}
                    >
                      <HiOutlineCheckCircle
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Active Expenses
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {() => (
                    <button
                      onClick={() => handleBulkStatus("inactive")}
                      className={`w-full flex items-center px-2 py-3 text-[#64748b] transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:text-black hover:bg-[#f1f5f9]"}`}
                    >
                      <HiOutlineArchive
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Archive Expenses
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {() => (
                    <button
                      onClick={handleBulkDelete}
                      className={`w-full flex items-center px-2 py-3 text-red-500 transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:bg-red-50"}`}
                    >
                      <HiOutlineTrash
                        className="text-red-500 mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Delete Expenses
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          )}
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
            <label className="block text-gray-700 text-sm mb-1">Category</label>
            <CategoryDropdown value={category} onChange={setCategory} />
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
                          expenses.length > 0 &&
                          selectedIds.length === pagination.totalItems
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="number">No.</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Receipt</th>
                  <th>Status</th>
                  {canView || canUpdate || canDelete ? (
                    <th className="text-center action">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => (
                  <tr key={expense._id} className="hover:bg-[#f1f5f9]">
                    {(canUpdate || canDelete) && (
                      <td className="w-15">
                        <input
                          type="checkbox"
                          name="select"
                          id="select"
                          className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                          checked={selectedIds.includes(expense._id)}
                          onChange={(e) => handleSelectOne(e, expense._id)}
                        />
                      </td>
                    )}
                    <td className="number">
                      {index + 1 + (pagination.page - 1) * pagination.limit}
                    </td>
                    <td>{expense.description || "-"}</td>
                    <td>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm ${categoryStyles[expense?.category] || "bg-gray-100 text-gray-700"}`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="font-medium text-red-600">
                      -${Number(expense.amount).toFixed(2)}
                    </td>
                    <td>{formatDate(expense.date, true) || "-"}</td>
                    <td>
                      {expense.receipt_image ? (
                        <a
                          href={expense.receipt_image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm capitalize text-white ${expense.status === "active" ? "bg-green-400" : "bg-gray-100"}`}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td className="flex items-center gap-1 justify-center action">
                      {canView && (
                        <button
                          className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                          title="View"
                          onClick={() => handleView(expense)}
                        >
                          <HiOutlineEye className="text-xl" />
                        </button>
                      )}
                      {(canUpdate || canDelete) && (
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
                            {canUpdate && (
                              <Menu.Item>
                                {() => (
                                  <button
                                    onClick={() => {
                                      setViewExpense(null);
                                      setEditExpense(expense);
                                      setModalOpen(true);
                                    }}
                                    className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl cursor-pointer"
                                  >
                                    <HiOutlinePencil
                                      className="mr-2 h-5 w-5"
                                      aria-hidden="true"
                                    />
                                    Update
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {canDelete && (
                              <Menu.Item>
                                {() => (
                                  <button
                                    onClick={() => handleDelete(expense._id)}
                                    className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl cursor-pointer"
                                  >
                                    <HiOutlineTrash
                                      className="text-red-500 mr-2 h-5 w-5"
                                      aria-hidden="true"
                                    />
                                    Delete
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                          </Menu.Items>
                        </Menu>
                      )}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={canCreate || canUpdate || canDelete ? 9 : 8}>
                      <NoDataFound message="No expenses found." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {expenses.length > 0 && (
        <div className="flex justify-end mt-3">
          <Pagination
            total={pagination.totalItems}
            page={pagination.page}
            limit={pagination.limit}
            onChange={({ page, limit }) => {
              setPagination((prev) => ({ ...prev, page, limit }));
              fetchExpenses(page, limit);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Expenses;
