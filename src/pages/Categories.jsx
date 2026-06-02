import React, { useEffect, useState } from "react";
import {
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
import { MdOutlineSmsFailed } from "react-icons/md";
import { Menu } from "@headlessui/react";
import CategoryModal from "../components/CategoryModal";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api";
import { useAuth } from "../contexts/auth/useAuth";
import { useDialog } from "../contexts/dialog/useDialog.js";
import Pagination from "../components/Pagination";
import NoDataFound from "../components/NoDataFound";
import Loading from "../components/Loading";

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const Categories = () => {
  const [categories, setCategories] = useState([]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [viewCategory, setViewCategory] = useState(null);

  // Loading and Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dialog
  const { user } = useAuth();
  const dialog = useDialog();

  // Filters
  const [search, setSearch] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Permissions
  const canView = getPermission(user, "view_category");
  const canCreate = getPermission(user, "create_category");
  const canUpdate = getPermission(user, "update_category");
  const canDelete = getPermission(user, "delete_category");

  useEffect(() => {
    if (user) {
      const delayDebounceFn = setTimeout(() => {
        fetchCategories(1, pagination.limit, search);
        setPagination((prev) => ({ ...prev, page: 1 }));
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search]);

  async function fetchCategories(page = 1, limit = 10, search) {
    setLoading(true);
    setError("");
    try {
      const res = await getCategories({ page, limit, search });
      setCategories(res.data.data);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  function handleView(category) {
    setEditCategory(null);
    setViewCategory(category);
    setModalOpen(true);
  }

  async function handleSave(category) {
    setLoading(true);
    setError("");
    try {
      if (editCategory) {
        await updateCategory(editCategory._id, category);
        await dialog.success("Category updated successfully.");
      } else {
        await createCategory(category);
        await dialog.success("Category created successfully.");
      }
      fetchCategories();
      setModalOpen(false);
      setEditCategory(null);
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save category.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Category",
      message: "Are you sure you want to delete this category?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    setLoading(true);
    try {
      await deleteCategory(id);
      await dialog.success("Category deleted successfully.");
      fetchCategories();
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to delete category.");
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setSearch("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCategories(1, pagination.limit, "");
  };

  async function handleSelectAll(e) {
    if (e.target.checked) {
      setLoading(true);
      try {
        const res = await getCategories({ limit: -1, search });
        const allIds = res.data.data.map((c) => c._id);
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
      await Promise.all(
        selectedIds.map((id) => updateCategory(id, { status })),
      );
      await dialog.success(`Categories marked as ${status} successfully.`);
      fetchCategories(pagination.page, pagination.limit, search);
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to update categories.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Categories",
      message: `Are you sure you want to delete ${selectedIds.length} categories?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteCategory(id)));
      await dialog.success("Categories deleted successfully.");
      fetchCategories(pagination.page, pagination.limit, search);
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to delete categories.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-content-available">
      <CategoryModal
        key={modalOpen ? (editCategory ? editCategory._id : "new") : "closed"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditCategory(null);
        }}
        onSave={handleSave}
        data={editCategory || viewCategory}
        viewOnly={!!viewCategory}
        onEdit={() => {
          setEditCategory(viewCategory);
          setViewCategory(null);
        }}
      />
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Category Management</h1>
          <span className="text-gray-500 text-sm">
            Organize and manage product categories
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={() => {
                setEditCategory(null);
                setModalOpen(true);
              }}
            >
              <HiOutlinePlus className="text-md" /> Add Category
            </button>
          )}
          {(canUpdate || canDelete) && (
            <Menu as="div" className="relative inline-block text-left">
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
                      Active Categories
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
                      Archive Categories
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
                      Delete Categories
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
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                          categories.length > 0 &&
                          selectedIds.length === pagination.totalItems
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="number">No.</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  {canView || canUpdate || canDelete ? (
                    <th className="text-center action">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category._id} className="hover:bg-[#f1f5f9]">
                    {(canUpdate || canDelete) && (
                      <td className="w-15">
                        <input
                          type="checkbox"
                          name="select"
                          id="select"
                          className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                          checked={selectedIds.includes(category._id)}
                          onChange={(e) => handleSelectOne(e, category._id)}
                        />
                      </td>
                    )}
                    <td className="number">
                      {index + 1 + (pagination.page - 1) * pagination.limit}
                    </td>
                    <td>{category.name || "-"}</td>
                    <td>{category.description || "-"}</td>
                    <td>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm capitalize text-white ${category.status === "active" ? "bg-green-400" : "bg-gray-400"}`}
                      >
                        {category.status}
                      </span>
                    </td>
                    <td className="flex items-center gap-1 justify-center">
                      {canView && (
                        <button
                          className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                          title="View"
                          onClick={() => handleView(category)}
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
                                      setEditCategory(category);
                                      setViewCategory(null);
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
                                    onClick={() => handleDelete(category._id)}
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
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={canCreate || canUpdate || canDelete ? 6 : 5}>
                      <NoDataFound message="No categories found." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {categories.length > 0 && (
        <div className="flex justify-end mt-3">
          <Pagination
            total={pagination.totalItems}
            page={pagination.page}
            limit={pagination.limit}
            onChange={({ page, limit }) => {
              setPagination((prev) => ({ ...prev, page, limit }));
              fetchCategories(page, limit);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Categories;
