import React, { useEffect, useState } from "react";
import {
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineKey,
  HiDotsVertical,
  HiOutlineArchive,
} from "react-icons/hi";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getPermissions,
  resetUserPassword,
} from "../api";
import UserModal from "../components/UserModal";
import { useAuth } from "../contexts/auth/useAuth";
import Pagination from "../components/Pagination";
import { Menu } from "@headlessui/react";
import { useDialog } from "../contexts/dialog/useDialog";

import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import useDataFetch from "../hooks/useDataFetch";
import useDebounce from "../hooks/useDebounce";
import { PermissionDropdown, TypesDropdown, UserStatusDropdown } from "../components/filters/UserFilterDropdowns";

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const Users = () => {
  const dialog = useDialog();
  const { user } = useAuth();

  const [permissions, setPermissions] = useState([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);

  // Local filter states
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: users,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
    setLoading
  } = useDataFetch(getUsers, { search: "", permission_id: "", user_type: "", status: "" });

  const canView = getPermission(user, "view_user");
  const canCreate = getPermission(user, "create_user");
  const canUpdate = getPermission(user, "update_user");
  const canDelete = getPermission(user, "delete_user");

  useEffect(() => {
    getPermissions({ limit: -1 }).then((res) => {
      if (Array.isArray(res.data)) {
        setPermissions(res.data);
      } else if (Array.isArray(res.data?.data)) {
        setPermissions(res.data.data);
      } else {
        setPermissions([]);
      }
    });
  }, []);

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

  async function handleBulkStatus(newStatus) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updateUser(id, { status: newStatus })));
      await dialog.success(`Users marked as ${newStatus} successfully.`);
      fetchData();
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to update users.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Users",
      message: `Are you sure you want to delete ${selectedIds.length} users?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteUser(id)));
      await dialog.success("Users deleted successfully.");
      fetchData();
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to delete users.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(userData) {
    setLoading(true);
    try {
      const userPayload = { ...userData };
      if (userPayload.permission_id === undefined && userPayload.role && Array.isArray(permissions)) {
        const found = permissions.find((p) => p.name === userPayload.role);
        if (found) userPayload.permission_id = found._id;
      }

      if (editUser && editUser._id) {
        await updateUser(editUser._id, userPayload);
        dialog.success("User updated successfully");
      } else {
        await createUser(userPayload);
        dialog.success("User created successfully");
      }

      fetchData();
      setModalOpen(false);
      setEditUser(null);
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save user");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete User",
      message: "Are you sure you want to delete this user?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      setLoading(true);
      try {
        await deleteUser(id);
        dialog.success("User deleted successfully");
        fetchData();
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleResetPassword(id) {
    const password = await dialog.prompt({
      title: "Reset Password",
      message: "Enter the new password for this user:",
      placeholder: "New Password",
      inputType: "password",
      confirmText: "Reset",
      cancelText: "Cancel",
    });
    if (password) {
      if (password.length < 6) {
        dialog.error("Password must be at least 6 characters long");
        return;
      }
      setLoading(true);
      try {
        await resetUserPassword(id, password);
        dialog.success("Password reset successfully");
      } catch (err) {
        dialog.error(err.response?.data?.error || "Failed to reset password");
      } finally {
        setLoading(false);
      }
    }
  }

  const columns = [
    ...(canUpdate || canDelete ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
        checked={users.length > 0 && selectedIds.length === users.length}
        onChange={(e) => setSelectedIds(e.target.checked ? users.map(u => u._id) : [])} />,
      className: "w-15",
      render: (u) => (
        <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          checked={selectedIds.includes(u._id)}
          onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, u._id] : prev.filter(id => id !== u._id))}
        />
      )
    }] : []),
    { header: "No.", className: "number", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Name", render: (u) => `${u.first_name} ${u.last_name}` },
    { header: "Email", accessor: "email" },
    { header: "Phone", render: (u) => u.phone || "-" },
    { header: "Role", render: (u) => <span className="capitalize">{u.role || "-"}</span> },
    { header: "Type", render: (u) => <span className="capitalize">{u.user_type || "-"}</span> },
    {
      header: "Status", render: (u) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${u.status === "active" ? "bg-emerald-500" : u.status === "pending" ? "bg-amber-500" : "bg-rose-500"
          }`}>
          {u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : "Active"}
        </span>
      )
    },
    ...(canView || canUpdate || canDelete ? [
      {
        header: "Actions", className: "text-center action", render: (u) => (
          <div className="flex items-center gap-1 justify-center">
            {canView && (
              <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200 transition"
                onClick={() => {
                  setEditUser(null);
                  setViewUser(u);
                  setModalOpen(true);
                }}>
                <HiOutlineEye className="text-xl" />
              </button>
            )}
            {(canUpdate || canDelete) && (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200 transition">
                  <HiDotsVertical className="text-xl" />
                </Menu.Button>
                <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-45 z-50 border border-gray-100 focus:outline-none">
                  {canUpdate && (
                    <>
                      <Menu.Item>
                        <button className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl"
                          onClick={() => { setEditUser(u); setViewUser(null); setModalOpen(true); }}>
                          <HiOutlinePencil className="mr-2 h-5 w-5" /> Update
                        </button>
                      </Menu.Item>
                      <Menu.Item>
                        <button className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl"
                          onClick={() => handleResetPassword(u._id)}>
                          <HiOutlineKey className="mr-2 h-5 w-5" /> Reset Password
                        </button>
                      </Menu.Item>
                    </>
                  )}
                  {canDelete && (
                    <Menu.Item>
                      <button className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl"
                        onClick={() => handleDelete(u._id)}>
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
      <UserModal
        key={modalOpen ? (editUser ? editUser._id : "new") : "closed"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditUser(null);
          setViewUser(null);
        }}
        onSave={handleSave}
        data={editUser || viewUser}
        viewOnly={!!viewUser}
        onEdit={() => {
          setEditUser(viewUser);
          setViewUser(null);
        }}
      />

      <PageHeader
        title="User Management"
        description="Manage your staff and external users"
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={() => { setEditUser(null); setViewUser(null); setModalOpen(true); }}>
                <HiOutlinePlus className="text-md" /> Add User
              </Button>
            )}
            {(canUpdate || canDelete) && (
              <Menu as="div" className="relative inline-block text-left ml-2">
                <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                  <HiDotsVertical className="text-xl" />
                </Menu.Button>
                <Menu.Items className="absolute right-0 bg-white rounded-2xl shadow-lg p-2 w-50 z-50 border border-gray-100">
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("active")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineRefresh className="mr-2 h-5 w-5" /> Activate Users
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("pending")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineFilter className="mr-2 h-5 w-5" /> Mark as Pending
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("inactive")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineArchive className="mr-2 h-5 w-5" /> Deactivate Users
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={handleBulkDelete} className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl">
                      <HiOutlineTrash className="text-red-500 mr-2 h-5 w-5" /> Delete Users
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
          <button onClick={handleReset} className="flex items-center gap-2 text-sm text-black cursor-pointer">
            <HiOutlineRefresh /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Search</label>
            <input className="bg-gray-50 border border-gray-100 rounded-lg py-2 px-4 text-sm w-full"
              placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Role</label>
            <PermissionDropdown selected={filters.permission_id} setSelected={p => updateFilters({ permission_id: p })} permissionOptions={permissions} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Type</label>
            <TypesDropdown selected={filters.user_type} setSelected={t => updateFilters({ user_type: t })} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Status</label>
            <UserStatusDropdown selected={filters.status} setSelected={s => updateFilters({ status: s })} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <DataTable columns={columns} data={users} loading={loading} error={error} />
      </div>

      {users.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={({ page, limit }) => updatePage(page)} />
        </div>
      )}
    </div>
  );
};

export default Users;
