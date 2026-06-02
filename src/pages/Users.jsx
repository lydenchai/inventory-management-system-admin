import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  HiSelector,
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
import { MdOutlineSmsFailed } from "react-icons/md";
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
import NoDataFound from "../components/NoDataFound";
import Loading from "../components/Loading";
import { Listbox, Menu } from "@headlessui/react";
import { useDialog } from "../contexts/dialog/useDialog";

function PermissionDropdown({
  selected,
  setSelected,
  permissionOptions: permissions,
}) {
  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>
            {permissions.find((p) => p._id === selected)?.name || "All Roles"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {permissions.map((option) => (
            <Listbox.Option
              key={option._id}
              value={option._id}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {option.name}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

PermissionDropdown.propTypes = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
  permissionOptions: PropTypes.array.isRequired,
};

function TypesDropdown({ selected, setSelected }) {
  const types = ["internal", "external"];
  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span className="capitalize">
            {selected ? selected : "All Types"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {types.map((s) => (
            <Listbox.Option
              key={s}
              value={s}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg capitalize ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {s}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

TypesDropdown.propTypes = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
};

function StatusDropdown({ selected, setSelected }) {
  const statuses = ["active", "inactive", "pending"];
  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span className="capitalize">
            {selected ? selected : "All Status"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {statuses.map((s) => (
            <Listbox.Option
              key={s}
              value={s}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg capitalize ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {s}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

StatusDropdown.propTypes = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
};

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const Users = () => {
  const [users, setUsers] = useState([]);

  // View User
  const [viewUser, setViewUser] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Loading and Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dialog
  const dialog = useDialog();
  const { user } = useAuth();

  // Permissions
  const [permissions, setPermissions] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [permission, setPermission] = useState("");
  const [status, setStatus] = useState("");
  const [user_type, setUserType] = useState("");

  // Select All
  const [selectedIds, setSelectedIds] = useState([]);

  // Permissions
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
    if (user) {
      const delayDebounceFn = setTimeout(() => {
        fetchUsers(1, pagination.limit, search, permission, user_type, status);
        setPagination((prev) => ({ ...prev, page: 1 }));
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search, permission, user_type, status]);

  async function handleSelectAll(e) {
    if (e.target.checked) {
      setLoading(true);
      try {
        const params = {
          limit: -1,
          search,
        };
        if (permission) params.permission_id = permission;
        if (user_type) params.user_type = user_type;
        if (status) params.status = status;

        const res = await getUsers(params);
        const allIds = res.data.data.map((u) => u._id);
        setSelectedIds(allIds);
      } catch (err) {
        console.error(err);
        setSelectedIds([]);
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

  async function handleBulkStatus(newStatus) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) => updateUser(id, { status: newStatus })),
      );
      await dialog.success(`Users marked as ${newStatus} successfully.`);
      fetchUsers(
        pagination.page,
        pagination.limit,
        search,
        permission,
        user_type,
        status,
      );
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
      fetchUsers(
        pagination.page,
        pagination.limit,
        search,
        permission,
        user_type,
        status,
      );
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to delete users.");
    } finally {
      setLoading(false);
    }
  }

  // Fetch users from API
  async function fetchUsers(
    page = 1,
    limit = 10,
    search,
    permission_id,
    user_type,
    status,
  ) {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit, search };
      if (permission_id) params.permission_id = permission_id;
      if (user_type) params.user_type = user_type;
      if (status) params.status = status;
      const res = await getUsers(params);
      setUsers(res.data.data);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  function handleView(user) {
    setEditUser(null);
    setViewUser(user);
    setModalOpen(true);
  }

  // Save user (create or update)
  async function handleSave(user) {
    setLoading(true);
    setError("");
    try {
      // Always send permission_id if present (for role/permission patching)
      const userPayload = { ...user };
      if (
        user.permission_id === undefined &&
        user.role &&
        Array.isArray(permissions)
      ) {
        // Try to find permission_id by role name if not set
        const found = permissions.find((p) => p.name === user.role);
        if (found) userPayload.permission_id = found._id;
      }
      if (editUser && editUser._id) {
        await updateUser(editUser._id, userPayload);
        dialog.success("User updated successfully");
      } else {
        await createUser(userPayload);
        dialog.success("User created successfully");
      }
      fetchUsers(1, pagination.limit, search, permission, user_type, status);
      setModalOpen(false);
      setEditUser(null);
    } catch {
      setError("Failed to save user");
      dialog.error("Failed to save user");
    } finally {
      setLoading(false);
    }
  }

  // Delete user
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
        fetchUsers(
          pagination.page,
          pagination.limit,
          search,
          permission,
          user_type,
          status,
        );
      } finally {
        setLoading(false);
      }
    }
  }

  // Reset Password
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

  const handleReset = () => {
    setSearch("");
    setPermission("");
    setUserType("");
    setStatus("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers(1, pagination.limit, "", "", "");
  };

  return (
    <div className="h-content-available">
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">User Management</h1>
          <span className="text-gray-500 text-sm">Manage users</span>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={() => {
                setEditUser(null);
                setViewUser(null);
                setModalOpen(true);
              }}
            >
              <HiOutlinePlus className="text-md" /> Add User
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
                      <HiOutlineRefresh
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Activate Users
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {() => (
                    <button
                      onClick={() => handleBulkStatus("pending")}
                      className={`w-full flex items-center px-2 py-3 text-[#64748b] transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:text-black hover:bg-[#f1f5f9]"}`}
                    >
                      <HiOutlineFilter
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Mark as Pending
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
                      Deactivate Users
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
                      Delete Users
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
          <div>
            <label className="block text-gray-700 text-sm mb-1">Role</label>
            <PermissionDropdown
              selected={permission}
              setSelected={setPermission}
              permissionOptions={permissions}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Type</label>
            <TypesDropdown selected={user_type} setSelected={setUserType} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Status</label>
            <StatusDropdown selected={status} setSelected={setStatus} />
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
                          users.length > 0 &&
                          selectedIds.length === pagination.totalItems
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="number">No.</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Status</th>
                  {canView || canUpdate || canDelete ? (
                    <th className="text-center action">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u._id} className="hover:bg-[#f1f5f9]">
                    {(canUpdate || canDelete) && (
                      <td className="w-15">
                        <input
                          type="checkbox"
                          name="select"
                          id="select"
                          className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                          checked={selectedIds.includes(u._id)}
                          onChange={(e) => handleSelectOne(e, u._id)}
                        />
                      </td>
                    )}
                    <td className="number">
                      {index + 1 + (pagination.page - 1) * pagination.limit}
                    </td>
                    <td>
                      {u.first_name} {u.last_name}
                    </td>
                    <td>{u.email || "-"}</td>
                    <td>{u.phone || "-"}</td>
                    <td className="capitalize">{u.role || "-"}</td>
                    <td className="capitalize">{u.user_type || "-"}</td>
                    <td>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm text-white ${
                          u.status === "active"
                            ? "bg-green-400"
                            : u.status === "pending"
                              ? "bg-yellow-400"
                              : "bg-red-400"
                        }`}
                      >
                        {u.status
                          ? u.status.charAt(0).toUpperCase() + u.status.slice(1)
                          : "Active"}
                      </span>
                    </td>
                    <td className="flex items-center gap-1 justify-center action">
                      {canView && (
                        <button
                          className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                          title="View"
                          onClick={() => handleView(u)}
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
                            className="bg-white rounded-2xl shadow-lg p-2 w-45 z-50 animate-fade-in-up border border-gray-100"
                          >
                            {canUpdate && (
                              <Menu.Item>
                                {() => (
                                  <button
                                    onClick={() => {
                                      setEditUser(u);
                                      setViewUser(null);
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
                            {canUpdate && (
                              <Menu.Item>
                                {() => (
                                  <button
                                    onClick={() => handleResetPassword(u._id)}
                                    className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-black hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl cursor-pointer"
                                  >
                                    <HiOutlineKey
                                      className="mr-2 h-5 w-5"
                                      aria-hidden="true"
                                    />
                                    Reset Password
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {canDelete && (
                              <Menu.Item>
                                {() => (
                                  <button
                                    onClick={() => handleDelete(u._id)}
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
                {users.length === 0 && (
                  <tr>
                    <td colSpan={canCreate || canUpdate || canDelete ? 9 : 8}>
                      <NoDataFound message="No users found." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {users.length > 0 && (
        <div className="flex justify-end mt-3">
          <Pagination
            total={pagination.totalItems}
            page={pagination.page}
            limit={pagination.limit}
            onChange={({ page, limit }) => {
              setPagination((prev) => ({ ...prev, page, limit }));
              fetchUsers(page, limit, search, permission, status);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Users;
