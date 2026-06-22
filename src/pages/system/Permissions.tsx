// @ts-nocheck
import React, { useState, useEffect } from "react";
import PermissionModal from "../../components/PermissionModal";
import {
  HiOutlineCheckCircle,
  HiOutlineArchive,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineEye,
  HiDotsVertical,
} from "react-icons/hi";
import { Menu } from "@headlessui/react";
import { getPermissions, createPermission, updatePermission, deletePermission } from "../../api";
import { useAuth } from "../../contexts/auth/useAuth";
import Pagination from "../../components/Pagination";
import { useDialog } from "../../contexts/dialog/useDialog";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import useDataFetch from "../../hooks/useDataFetch";
import useDebounce from "../../hooks/useDebounce";

const getPermission = (user, permission) => user?.permission?.permissions?.includes(permission);

const Permissions = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [viewRole, setViewRole] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const dialog = useDialog();
  const { user } = useAuth();

  const canView = getPermission(user, "view_permission");
  const canCreate = getPermission(user, "create_permission");
  const canUpdate = getPermission(user, "update_permission");
  const canDelete = getPermission(user, "delete_permission");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: roles,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
    setLoading
  } = useDataFetch(getPermissions, {
    search: ""
  });

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

  async function handleSave(roleData) {
    setLoading(true);
    try {
      if (editRole) {
        await updatePermission(editRole._id, roleData);
        dialog.success("Role updated successfully");
      } else {
        await createPermission(roleData);
        dialog.success("Role created successfully");
      }
      fetchData();
      setModalOpen(false);
      setEditRole(null);
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save role");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Role", message: "Are you sure?" });
    if (confirmed) {
      setLoading(true);
      try {
        await deletePermission(id);
        dialog.success("Role deleted successfully");
        fetchData();
      } catch (err) {
        dialog.error(err?.response?.data?.error || "Failed to delete role");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleBulkStatus(status) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updatePermission(id, { status })));
      dialog.success(`Roles marked as ${status} successfully.`);
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to update roles.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Roles", message: "Are you sure?" });
    if (!confirmed) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deletePermission(id)));
      dialog.success("Roles deleted successfully.");
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to delete roles.");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    ...(canUpdate || canDelete ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
        checked={roles.length > 0 && selectedIds.length === roles.length}
        onChange={(e) => setSelectedIds(e.target.checked ? roles.map(r => r._id) : [])} />,
      className: "w-15",
      render: (r) => (
        <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          checked={selectedIds.includes(r._id)}
          onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, r._id] : prev.filter(id => id !== r._id))}
        />
      )
    }] : []),
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Name", accessor: "name" },
    { header: "Description", className: "whitespace-nowrap", render: (r) => r.description || "-" },
    {
      header: "Status", render: (r) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize text-white ${r.status === "active" ? "bg-green-500" : "bg-gray-400"}`}>
          {r.status}
        </span>
      )
    },
    ...(canView || canUpdate || canDelete ? [
      {
        header: "Actions", className: "text-center", render: (r) => {
          const isAdmin = r.name?.toLowerCase() === "admin";
          return (
            <div className="flex items-center gap-1 justify-center">
              {canView && (
                <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                  onClick={() => { setEditRole(null); setViewRole(r); setModalOpen(true); }}>
                  <HiOutlineEye className="text-xl" />
                </button>
              )}
              {(canUpdate || canDelete) && (
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button
                    className="text-[#1e3a5f] font-semibold cursor-pointer disabled:cursor-default p-2 rounded-full hover:bg-gray-200 disabled:hover:bg-transparent disabled:opacity-50"
                    disabled={isAdmin}>
                    <HiDotsVertical className="text-xl" />
                  </Menu.Button>
                  <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-40 z-50 border border-gray-100 focus:outline-none">
                    {canUpdate && (
                      <Menu.Item>
                        <button className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl"
                          onClick={() => { setViewRole(null); setEditRole(r); setModalOpen(true); }}>
                          <HiOutlinePencil className="mr-2 h-5 w-5" /> Update
                        </button>
                      </Menu.Item>
                    )}
                    {canDelete && (
                      <Menu.Item>
                        <button className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl"
                          onClick={() => handleDelete(r._id)}>
                          <HiOutlineTrash className="mr-2 h-5 w-5" /> Delete
                        </button>
                      </Menu.Item>
                    )}
                  </Menu.Items>
                </Menu>
              )}
            </div>
          );
        }
      }
    ] : [])
  ];

  return (
    <div className="h-content-available flex flex-col">
      <PermissionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditRole(null); setViewRole(null); }}
        onSave={handleSave}
        data={editRole || viewRole}
        viewOnly={!!viewRole}
        onEdit={() => { setEditRole(viewRole); setViewRole(null); }}
      />

      <PageHeader
        title="Role Management"
        description="Manage roles and their permissions"
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={() => { setEditRole(null); setViewRole(null); setModalOpen(true); }}>
                <HiOutlinePlus className="text-md" /> Add Role
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
                      <HiOutlineCheckCircle className="mr-2 h-5 w-5" /> Active Roles
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("inactive")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineArchive className="mr-2 h-5 w-5" /> Archive Roles
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={handleBulkDelete} className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl">
                      <HiOutlineTrash className="text-red-500 mr-2 h-5 w-5" /> Delete Roles
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
        <DataTable columns={columns} data={roles} loading={loading} error={error} />
      </div>

      {roles.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default Permissions;

