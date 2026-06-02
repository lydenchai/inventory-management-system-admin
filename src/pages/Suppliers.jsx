import React, { useEffect, useState } from "react";
import { Listbox } from "@headlessui/react";
import PropTypes from "prop-types";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineBuildingOffice2,
  HiOutlineCube,
  HiOutlineEye,
} from "react-icons/hi2";
import {
  HiOutlineCheckCircle,
  HiOutlineArchive,
  HiSelector,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiDotsVertical,
} from "react-icons/hi";
import { MdOutlineSmsFailed } from "react-icons/md";
import { Menu } from "@headlessui/react";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../api";
import { useDialog } from "../contexts/dialog/useDialog";
import SupplierModal from "../components/SupplierModal";
import { useAuth } from "../contexts/auth/useAuth";
import Pagination from "../components/Pagination";
import NoDataFound from "../components/NoDataFound";
import Loading from "../components/Loading";

// Custom dropdowns for Suppliers page
const statusOptions = ["Active", "Inactive"];
const locationOptions = ["Main Warehouse", "Showroom"];

// Dropdowns now accept value and onChange from parent
function StatusDropdown({ value, onChange }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>{value || "All Statuses"}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {statusOptions.map((option) => (
            <Listbox.Option
              key={option}
              value={option}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {option}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

StatusDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function LocationDropdown({ value, onChange }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>{value || "All Locations"}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {locationOptions.map((option) => (
            <Listbox.Option
              key={option}
              value={option}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {option}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

LocationDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);

  // View Supplier
  const [viewSupplier, setViewSupplier] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);

  // Loading and Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");

  // Permissions
  const dialog = useDialog();
  const { user } = useAuth();
  const canView = getPermission(user, "view_supplier");
  const canCreate = getPermission(user, "create_supplier");
  const canUpdate = getPermission(user, "update_supplier");
  const canDelete = getPermission(user, "delete_supplier");

  useEffect(() => {
    if (user) {
      fetchSuppliers(
        pagination.page,
        pagination.limit,
        search,
        status,
        location,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pagination.page, pagination.limit, search, status, location]);

  // Fetch suppliers from API
  async function fetchSuppliers(
    page = pagination.page,
    limit = pagination.limit,
    searchVal = search,
    statusVal = status,
    locationVal = location,
  ) {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit };
      if (searchVal) params.search = searchVal;
      if (statusVal) params.status = statusVal;
      if (locationVal) params.location = locationVal;
      const res = await getSuppliers(params);
      setSuppliers(res.data.data);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  function handleView(supplier) {
    // Always open in view mode (viewOnly) for view action
    setEditSupplier(null);
    setViewSupplier(supplier);
    setModalOpen(true);
  }

  // Save supplier (create or update)
  async function handleSave(supplier) {
    setLoading(true);
    setError("");
    try {
      if (editSupplier) {
        await updateSupplier(editSupplier._id, supplier);
        dialog.success("Supplier updated successfully");
      } else {
        await createSupplier(supplier);
        dialog.success("Supplier created successfully");
      }
      fetchSuppliers(pagination.page, pagination.limit);
      setModalOpen(false);
      setEditSupplier(null);
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save supplier");
    } finally {
      setLoading(false);
    }
  }

  // Delete supplier
  async function handleDelete(id) {
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Supplier",
      message: "Are you sure you want to delete this supplier?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      setLoading(true);
      try {
        await deleteSupplier(id);
        dialog.success("Supplier deleted successfully");
        fetchSuppliers(pagination.page, pagination.limit);
      } catch (err) {
        dialog.error(err?.response?.data?.error || "Failed to delete supplier");
      } finally {
        setLoading(false);
      }
    }
  }

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setLocation("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSuppliers(1, pagination.limit, "", "", "");
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
          status,
          location,
        };
        const res = await getSuppliers(params);
        const allIds = res.data.data.map((s) => s._id);
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
      await Promise.all(selectedIds.map((id) => editSupplier(id, { status })));
      await dialog.success(`Suppliers marked as ${status} successfully.`);
      fetchSuppliers(
        pagination.page,
        pagination.limit,
        search,
        status,
        location,
      );
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to update suppliers.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Suppliers",
      message: `Are you sure you want to delete ${selectedIds.length} suppliers?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteSupplier(id)));
      await dialog.success("Suppliers deleted successfully.");
      fetchSuppliers(
        pagination.page,
        pagination.limit,
        search,
        status,
        location,
      );
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to delete suppliers.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-content-available">
      <SupplierModal
        key={
          modalOpen
            ? editSupplier
              ? editSupplier._id
              : viewSupplier
                ? viewSupplier._id
                : "new"
            : "closed"
        }
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditSupplier(null);
          setViewSupplier(null);
        }}
        onSave={handleSave}
        data={editSupplier || viewSupplier}
        viewOnly={!!viewSupplier}
        onEdit={() => {
          setEditSupplier(viewSupplier);
          setViewSupplier(null);
        }}
      />
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Supplier Management</h1>
          <span className="text-gray-500 text-sm">
            Manage vendor relationships and product associations
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={() => {
                setEditSupplier(null);
                setModalOpen(true);
              }}
            >
              <HiOutlinePlus className="text-md" /> Add Supplier
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
                      onClick={() => handleBulkStatus("Active")}
                      className={`w-full flex items-center px-2 py-3 text-[#64748b] transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:text-black hover:bg-[#f1f5f9]"}`}
                    >
                      <HiOutlineCheckCircle
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Active Suppliers
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {() => (
                    <button
                      onClick={() => handleBulkStatus("Inactive")}
                      className={`w-full flex items-center px-2 py-3 text-[#64748b] transition text-sm space-x-2 rounded-xl ${selectedIds.length === 0 ? "opacity-50 cursor-default" : "cursor-pointer hover:text-black hover:bg-[#f1f5f9]"}`}
                    >
                      <HiOutlineArchive
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Archive Suppliers
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
                      Delete Suppliers
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
              onChange={(e) => {
                setSearch(e.target.value);
                fetchSuppliers(
                  1,
                  pagination.limit,
                  e.target.value,
                  status,
                  location,
                );
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Location</label>
            <LocationDropdown
              value={location}
              onChange={(val) => {
                setLocation(val);
                fetchSuppliers(1, pagination.limit, search, status, val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Status</label>
            <StatusDropdown
              value={status}
              onChange={(val) => {
                setStatus(val);
                fetchSuppliers(1, pagination.limit, search, val, location);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
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
                          suppliers.length > 0 &&
                          selectedIds.length === pagination.totalItems
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="number">No.</th>
                  <th>Company Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Products</th>
                  <th>Status</th>
                  {canView || canUpdate || canDelete ? (
                    <th className="text-center action">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier, index) => (
                  <tr key={supplier._id} className="hover:bg-[#f1f5f9]">
                    {(canUpdate || canDelete) && (
                      <td className="w-15">
                        <input
                          type="checkbox"
                          name="select"
                          id="select"
                          className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                          checked={selectedIds.includes(supplier._id)}
                          onChange={(e) => handleSelectOne(e, supplier._id)}
                        />
                      </td>
                    )}
                    <td className="number">
                      {index + 1 + (pagination.page - 1) * pagination.limit}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <HiOutlineBuildingOffice2 className="text-lg text-blue-700" />
                        {supplier.company_name || "-"}
                      </div>
                    </td>
                    <td>{supplier.contact_person || "-"}</td>
                    <td>{supplier.contact_email || "-"}</td>
                    <td>{supplier.contact_phone || "-"}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        <HiOutlineCube className="text-sm" />
                        <span>
                          {typeof supplier.products_count === "number"
                            ? supplier.products_count
                            : 0}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm capitalize text-white ${supplier.status === "Active" ? "bg-green-400" : "bg-gray-100"}`}
                      >
                        {supplier.status}
                      </span>
                    </td>
                    <td className="flex items-center gap-1 justify-center action">
                      {canView && (
                        <button
                          className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                          title="View"
                          onClick={() => handleView(supplier)}
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
                                      setEditSupplier(supplier);
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
                                    onClick={() => handleDelete(supplier._id)}
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
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={canCreate || canUpdate || canDelete ? 8 : 7}>
                      <NoDataFound message="No suppliers found." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {suppliers.length > 0 && (
        <div className="flex justify-end mt-3">
          <Pagination
            total={pagination.totalItems}
            page={pagination.page}
            limit={pagination.limit}
            onChange={({ page, limit }) => {
              setPagination((prev) => ({ ...prev, page, limit }));
              fetchSuppliers(page, limit, search, status, location);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Suppliers;
