// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
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
import { useAuth } from "../../contexts/auth/useAuth";
import { useDialog } from "../../contexts/dialog/useDialog.js";
import CategoryModal from "../../components/CategoryModal";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../../api";
import Pagination from "../../components/Pagination";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import useDataFetch from "../../hooks/useDataFetch";
import useDebounce from "../../hooks/useDebounce";

const getPermission = (user, permission) => user?.permission?.permissions?.includes(permission);

const Categories = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [viewCategory, setViewCategory] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const { user } = useAuth();
  const dialog = useDialog();

  const canView = getPermission(user, "view_category");
  const canCreate = getPermission(user, "create_category");
  const canUpdate = getPermission(user, "update_category");
  const canDelete = getPermission(user, "delete_category");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: categories,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
    setLoading
  } = useDataFetch(getCategories, { search: "" });

  useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, filters, pagination.page, pagination.limit]);

  const handleReset = () => {
    setSearchTerm("");
    resetFilters();
  };

  async function handleSave(categoryData) {
    setLoading(true);
    try {
      if (editCategory) {
        await updateCategory(editCategory._id, categoryData);
        dialog.success("Category updated successfully.");
      } else {
        await createCategory(categoryData);
        dialog.success("Category created successfully.");
      }
      fetchData();
      setModalOpen(false);
      setEditCategory(null);
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save category.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Category", message: "Are you sure?" });
    if (!confirmed) return;
    setLoading(true);
    try {
      await deleteCategory(id);
      dialog.success("Category deleted successfully.");
      fetchData();
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to delete category.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkStatus(status) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updateCategory(id, { status })));
      dialog.success(`Categories marked as ${status} successfully.`);
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to update categories.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Categories", message: "Are you sure?" });
    if (!confirmed) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteCategory(id)));
      dialog.success("Categories deleted successfully.");
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to delete categories.");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    ...(canUpdate || canDelete ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                checked={categories.length > 0 && selectedIds.length === categories.length}
                onChange={(e) => setSelectedIds(e.target.checked ? categories.map(c => c._id) : [])} />,
      className: "w-15",
      render: (c) => (
        <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          checked={selectedIds.includes(c._id)}
          onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, c._id] : prev.filter(id => id !== c._id))}
        />
      )
    }] : []),
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Name", accessor: "name" },
    { header: "Description", render: (c) => c.description || "-" },
    { header: "Status", render: (c) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize text-white ${c.status === "active" ? "bg-green-500" : "bg-gray-400"}`}>
          {c.status}
        </span>
    )},
    ...(canView || canUpdate || canDelete ? [
      { header: "Actions", className: "text-center", render: (c) => (
          <div className="flex items-center gap-1 justify-center">
            {canView && (
              <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                onClick={() => { setEditCategory(null); setViewCategory(c); setModalOpen(true); }}>
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
                        onClick={() => { setViewCategory(null); setEditCategory(c); setModalOpen(true); }}>
                        <HiOutlinePencil className="mr-2 h-5 w-5" /> Update
                      </button>
                    </Menu.Item>
                  )}
                  {canDelete && (
                    <Menu.Item>
                      <button className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl"
                        onClick={() => handleDelete(c._id)}>
                        <HiOutlineTrash className="mr-2 h-5 w-5" /> Delete
                      </button>
                    </Menu.Item>
                  )}
                </Menu.Items>
              </Menu>
            )}
          </div>
      )}
    ] : [])
  ];

  return (
    <div className="h-content-available flex flex-col">
      <CategoryModal
        key={modalOpen ? (editCategory ? editCategory._id : "new") : "closed"}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCategory(null); setViewCategory(null); }}
        onSave={handleSave}
        data={editCategory || viewCategory}
        viewOnly={!!viewCategory}
        onEdit={() => { setEditCategory(viewCategory); setViewCategory(null); }}
      />

      <PageHeader
        title="Category Management"
        description="Organize and manage product categories"
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={() => { setEditCategory(null); setViewCategory(null); setModalOpen(true); }}>
                <HiOutlinePlus className="text-md" /> Add Category
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
                      <HiOutlineCheckCircle className="mr-2 h-5 w-5" /> Active Categories
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("inactive")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineArchive className="mr-2 h-5 w-5" /> Archive Categories
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={handleBulkDelete} className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl">
                      <HiOutlineTrash className="text-red-500 mr-2 h-5 w-5" /> Delete Categories
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Search</label>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
              placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="overflow-auto min-h-0 flex flex-col">
        <DataTable columns={columns} data={categories} loading={loading} error={error} />
      </div>

      {categories.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default Categories;

