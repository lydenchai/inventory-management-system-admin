import React, { useEffect, useState } from "react";
import { Listbox } from "@headlessui/react";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOfficeBuilding,
  HiOutlineCube,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineArchive,
  HiSelector,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiDotsVertical,
  HiOutlineUpload,
} from "react-icons/hi";
import { Menu } from "@headlessui/react";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  importSuppliers,
} from "../api";
import { useDialog } from "../contexts/dialog/useDialog";
import SupplierModal from "../components/SupplierModal";
import { useAuth } from "../contexts/auth/useAuth";
import Pagination from "../components/Pagination";

import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import useDataFetch from "../hooks/useDataFetch";
import useDebounce from "../hooks/useDebounce";
import BulkImportModal from "../components/BulkImportModal";

const statusOptions = ["Active", "Inactive"];
const locationOptions = ["Main Warehouse", "Showroom"];

function FilterDropdown({ value, onChange, options, placeholder }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between">
          <span>{value || placeholder}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          <Listbox.Option value="" className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
            {placeholder}
          </Listbox.Option>
          {options.map((option) => (
            <Listbox.Option
              key={option}
              value={option}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
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

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const Suppliers = () => {
  const dialog = useDialog();
  const { user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [viewSupplier, setViewSupplier] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const canView = getPermission(user, "view_supplier");
  const canCreate = getPermission(user, "create_supplier");
  const canUpdate = getPermission(user, "update_supplier");
  const canDelete = getPermission(user, "delete_supplier");

  const {
    data: suppliers,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
    setLoading
  } = useDataFetch(getSuppliers, { search: "", status: "", location: "" });

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
      await Promise.all(selectedIds.map((id) => updateSupplier(id, { status: newStatus })));
      await dialog.success(`Suppliers marked as ${newStatus} successfully.`);
      fetchData();
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
      fetchData();
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to delete suppliers.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(supplier) {
    setLoading(true);
    try {
      if (editSupplier) {
        await updateSupplier(editSupplier._id, supplier);
        dialog.success("Supplier updated successfully");
      } else {
        await createSupplier(supplier);
        dialog.success("Supplier created successfully");
      }
      fetchData();
      setModalOpen(false);
      setEditSupplier(null);
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save supplier");
    } finally {
      setLoading(false);
    }
  }

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
        fetchData();
      } catch (err) {
        dialog.error(err?.response?.data?.error || "Failed to delete supplier");
      } finally {
        setLoading(false);
      }
    }
  }

  const columns = [
    ...(canUpdate || canDelete ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
        checked={suppliers.length > 0 && selectedIds.length === suppliers.length}
        onChange={(e) => setSelectedIds(e.target.checked ? suppliers.map(s => s._id) : [])} />,
      className: "w-15",
      render: (s) => (
        <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          checked={selectedIds.includes(s._id)}
          onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, s._id] : prev.filter(id => id !== s._id))}
        />
      )
    }] : []),
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    {
      header: "Company Name", render: (s) => (
        <div className="flex items-center gap-2">
          <HiOfficeBuilding className="text-lg text-gray-900" />
          {s.company_name || "-"}
        </div>
      )
    },
    { header: "Contact Person", accessor: "contact_person" },
    { header: "Email", accessor: "contact_email" },
    { header: "Phone", accessor: "contact_phone" },
    {
      header: "Products", render: (s) => (
        <span className="flex items-center gap-2">
          <HiOutlineCube className="text-sm" />
          <span>{typeof s.products_count === "number" ? s.products_count : 0}</span>
        </span>
      )
    },
    {
      header: "Status", render: (s) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${s.status === "Active" ? "bg-emerald-500" : "bg-gray-400"}`}>
          {s.status}
        </span>
      )
    },
    ...(canView || canUpdate || canDelete ? [
      {
        header: "Actions", className: "text-center", render: (s) => (
          <div className="flex items-center gap-1 justify-center">
            {canView && (
              <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                onClick={() => { setEditSupplier(null); setViewSupplier(s); setModalOpen(true); }}>
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
                        onClick={() => { setEditSupplier(s); setViewSupplier(null); setModalOpen(true); }}>
                        <HiOutlinePencil className="mr-2 h-5 w-5" /> Update
                      </button>
                    </Menu.Item>
                  )}
                  {canDelete && (
                    <Menu.Item>
                      <button className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl"
                        onClick={() => handleDelete(s._id)}>
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
      <SupplierModal
        key={modalOpen ? (editSupplier ? editSupplier._id : viewSupplier ? viewSupplier._id : "new") : "closed"}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditSupplier(null); setViewSupplier(null); }}
        onSave={handleSave}
        data={editSupplier || viewSupplier}
        viewOnly={!!viewSupplier}
        onEdit={() => { setEditSupplier(viewSupplier); setViewSupplier(null); }}
      />
      <BulkImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={async (formData) => {
          await importSuppliers(formData);
          fetchData();
        }}
        title="Import Suppliers"
      />

      <PageHeader
        title="Supplier Management"
        description="Manage vendor relationships and product associations"
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <>
                <Button onClick={() => setImportModalOpen(true)} className="!bg-white !text-[#1e3a5f] border border-gray-200 hover:!bg-gray-50 flex items-center gap-2">
                  <HiOutlineUpload className="text-md" /> Import CSV
                </Button>
                <Button onClick={() => { setEditSupplier(null); setViewSupplier(null); setModalOpen(true); }}>
                  <HiOutlinePlus className="text-md" /> Add Supplier
                </Button>
              </>
            )}
            {(canUpdate || canDelete) && (
              <Menu as="div" className="relative inline-block text-left ml-2">
                <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                  <HiDotsVertical className="text-xl" />
                </Menu.Button>
                <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-50 z-50 border border-gray-100 focus:outline-none">
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("Active")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineCheckCircle className="mr-2 h-5 w-5" /> Active Suppliers
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={() => handleBulkStatus("Inactive")} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineArchive className="mr-2 h-5 w-5" /> Archive Suppliers
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={handleBulkDelete} className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl">
                      <HiOutlineTrash className="text-red-500 mr-2 h-5 w-5" /> Delete Suppliers
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
          <button onClick={handleReset} className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
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
            <label className="block text-gray-700 text-sm mb-1">Location</label>
            <FilterDropdown value={filters.location} onChange={val => updateFilters({ location: val })} options={locationOptions} placeholder="All Locations" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Status</label>
            <FilterDropdown value={filters.status} onChange={val => updateFilters({ status: val })} options={statusOptions} placeholder="All Statuses" />
          </div>
        </div>
      </div>

      <div className="overflow-auto min-h-0 flex flex-col">
        <DataTable columns={columns} data={suppliers} loading={loading} error={error} />
      </div>

      {suppliers.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default Suppliers;
