// @ts-nocheck
import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  HiXCircle,
  HiOutlineDocumentText,
  HiOutlinePencil,
  HiOutlineKey,
} from "react-icons/hi";

const permissionTable = [
  {
    label: "Dashboard",
    actions: ["view_dashboard"],
  },

  // Master Data
  {
    label: "Categories",
    actions: [
      "view_category",
      "create_category",
      "update_category",
      "delete_category",
    ],
  },
  {
    label: "Products",
    actions: [
      "view_product",
      "create_product",
      "update_product",
      "delete_product",
    ],
  },
  {
    label: "Suppliers",
    actions: [
      "view_supplier",
      "create_supplier",
      "update_supplier",
      "delete_supplier",
    ],
  },

  // Inventory
  {
    label: "Stocks",
    actions: ["view_stock", "create_stock", "update_stock", "delete_stock"],
  },

  // Purchasing / Receiving
  {
    label: "Order Requests",
    actions: [
      "view_order_request",
      "create_order_request",
      "update_order_request",
      "delete_order_request",
      "post_order_request",
    ],
  },
  {
    label: "Approve Requests",
    actions: ["view_approve_request", "update_approve_request"],
  },
  {
    label: "Confirm Delivery",
    actions: ["view_confirm_delivery", "update_confirm_delivery"],
  },

  // Sales
  {
    label: "Sales",
    actions: ["view_sale", "create_sale", "update_sale", "delete_sale"],
  },
  {
    label: "Expenses",
    actions: [
      "view_expense",
      "create_expense",
      "update_expense",
      "delete_expense",
    ],
  },
  {
    label: "Order History",
    actions: ["view_order_history"],
  },

  // Reports & Logs
  {
    label: "Activity Log",
    actions: ["view_activity_log"],
  },
  {
    label: "Reports",
    actions: ["view_report"],
  },

  // System Management
  {
    label: "Roles",
    actions: [
      "view_permission",
      "create_permission",
      "update_permission",
      "delete_permission",
    ],
  },
  {
    label: "Users",
    actions: ["view_user", "create_user", "update_user", "delete_user"],
  },
];

const initialRole = {
  name: "",
  description: "",
  permissions: [],
  status: "active",
};

// Always deep clone the initial role to avoid reference issues
function cloneRole(obj) {
  if (obj) {
    if (typeof obj.permissions === "string") {
      try {
        obj.permissions = JSON.parse(obj.permissions);
      } catch {
        obj.permissions = [];
      }
    }
    const cloned = JSON.parse(JSON.stringify(obj));
    if (!Array.isArray(cloned.permissions)) {
      cloned.permissions = [];
    }
    return cloned;
  }
  return initialRole;
}

import { useAuth } from "../../contexts/auth/useAuth";

const PermissionModal = ({
  open,
  onClose,
  onSave,
  data,
  viewOnly = false,
  onEdit,
}) => {
  const [role, setUpdateRole] = useState(cloneRole(data));
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  const { user } = useAuth();
  const canUpdate =
    user?.permission?.permissions?.includes("update_permission");

  React.useEffect(() => {
    if (open && !data) {
      setUpdateRole(cloneRole(null));
      setTouched({});
      setValidateOnSave(false);
    } else if (open && data) {
      setUpdateRole(cloneRole(data));
      setTouched({});
      setValidateOnSave(false);
    }
  }, [open, data]);

  function updatePermissionsState(updater) {
    setUpdateRole((prev) => {
      const currentPerms = Array.isArray(prev.permissions)
        ? prev.permissions.filter((p) => typeof p === "string")
        : [];
      const newPerms = updater(new Set(currentPerms));
      return { ...prev, permissions: Array.from(newPerms) };
    });
  }

  function handleRoleChange(e) {
    const { name, value, checked } = e.target;
    if (name === "name" || name === "description") {
      setUpdateRole((f) => ({ ...f, [name]: value }));
    } else {
      updatePermissionsState((set) => {
        if (checked) set.add(value);
        else set.delete(value);
        return set;
      });
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[60%] max-h-[90vh] shadow-xl relative flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-center shrink-0">
          {viewOnly ? "Role Details" : data ? "Update Role" : "Add Role"}
        </h2>
        <form className="flex flex-col flex-1 max-h-[50vh] gap-5 px-1">
          <div className="col-span-2 shrink-0">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiOutlineDocumentText className="inline-block text-xl text-gray-900" />
              <span>Basic Information</span>
            </h3>
            <div className="mb-3 grid lg:grid-cols-2 md:grid-cols-1 gap-3">
              <div>
                <label
                  htmlFor="role_name"
                  className="block text-gray-500 mb-1 text-sm font-medium"
                >
                  Name
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <input
                  id="role_name"
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!role.name && (touched.name || validateOnSave) ? "border-red-500" : "border-gray-200"}`}
                  value={role.name}
                  onChange={(e) =>
                    setUpdateRole({ ...role, name: e.target.value })
                  }
                  onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                  required
                  disabled={viewOnly}
                />
              </div>
              <div>
                <label
                  htmlFor="role_description"
                  className="block text-gray-500 mb-1 text-sm font-medium"
                >
                  Description
                </label>
                <input
                  type="text"
                  id="role_description"
                  name="description"
                  value={role.description}
                  onChange={handleRoleChange}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, description: true }))
                  }
                  className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                  required
                  disabled={viewOnly}
                />
              </div>
            </div>
          </div>
          <div className="col-span-2 mb-2 flex flex-col flex-1 min-h-0">
            <h3 className="flex items-center gap-2 text-base mb-2 text-gray-900 shrink-0">
              <HiOutlineKey className="inline-block text-xl text-gray-900" />
              <span>Permissions</span>
            </h3>
            <div className="bg-white rounded-xl border border-gray-100 flex-1 flex flex-col min-h-0">
              <div className="table-scroll-container h-full rounded-xl">
                <table className="min-w-full text-center text-sm align-middle">
                  <thead className="table-sticky-header">
                    <tr>
                      <th className="text-left">Menu</th>
                      <th>Check All</th>
                      <th>View</th>
                      <th>Create</th>
                      <th>Update</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissionTable.map((row) => (
                      <tr
                        key={row.label}
                        className="border-t border-gray-100 hover:bg-[#f1f5f9] transform-none! transition-none!"
                      >
                        <td className="text-left">{row.label}</td>
                        <td>
                          <input
                            className="w-5 h-5 mt-2 cursor-pointer accent-[#1e3a5f]"
                            type="checkbox"
                            checked={row.actions.every((a) =>
                              role.permissions?.includes(a),
                            )}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              updatePermissionsState((set) => {
                                if (isChecked) {
                                  row.actions.forEach((a) => set.add(a));
                                } else {
                                  row.actions.forEach((a) => set.delete(a));
                                }
                                return set;
                              });
                            }}
                            disabled={viewOnly}
                          />
                        </td>
                        {["view", "create", "update", "delete"].map(
                          (action) => {
                            const actionKey = row.actions.find((a) =>
                              a.startsWith(action),
                            );
                            return (
                              <td className="text-center" key={action}>
                                {actionKey ? (
                                  <input
                                    className={`w-5 h-5 mt-2 accent-[#1e3a5f] ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                                    type="checkbox"
                                    value={actionKey}
                                    checked={
                                      role.permissions?.includes(actionKey) ||
                                      false
                                    }
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      updatePermissionsState((set) => {
                                        if (isChecked) set.add(actionKey);
                                        else set.delete(actionKey);
                                        return set;
                                      });
                                    }}
                                    disabled={viewOnly}
                                  />
                                ) : null}
                              </td>
                            );
                          },
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </form>
        <div className="col-span-2 w-full flex items-center justify-end gap-3 mt-4 shrink-0">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-[#1e3a5f] px-6 py-2 rounded-xl focus:outline-none border border-gray-100 flex items-center gap-2 cursor-pointer text-sm"
            onClick={onClose}
          >
            <HiXCircle className="inline-block text-xl" />
            {viewOnly ? "Close" : "Cancel"}
          </button>
          {!viewOnly && (
            <button
              type="button"
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={() => {
                setValidateOnSave(true);
                setTouched({
                  name: true,
                });
                if (!role.name || role.name.trim() === "") {
                  return;
                }
                onSave(role);
              }}
            >
              <HiOutlineDocumentText className="inline-block text-xl" />
              {viewOnly ? "Role Details" : role._id ? "Update" : "Create"}
            </button>
          )}
          {viewOnly &&
            onEdit &&
            canUpdate &&
            role.name !== "admin" &&
            role.name !== "Admin" && (
              <button
                type="button"
                className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
                onClick={onEdit}
              >
                <HiOutlinePencil className="inline-block text-xl" />
                Update
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

PermissionModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  data: PropTypes.object,
  viewOnly: PropTypes.bool,
  onEdit: PropTypes.func,
};

export default PermissionModal;

