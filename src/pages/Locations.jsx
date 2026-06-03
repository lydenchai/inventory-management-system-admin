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
} from "react-icons/hi";
import { useAuth } from "../contexts/auth/useAuth";
import { useDialog } from "../contexts/dialog/useDialog.js";
import LocationModal from "../components/LocationModal";
import { getLocations, createLocation, updateLocation, deleteLocation } from "../api";
import Pagination from "../components/Pagination";

import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import useDataFetch from "../hooks/useDataFetch";
import useDebounce from "../hooks/useDebounce";

const getPermission = (user, permission) => user?.permission?.permissions?.includes(permission);

const Locations = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [viewLocation, setViewLocation] = useState(null);

  const { user } = useAuth();
  const dialog = useDialog();

  const canView = getPermission(user, "view_location");
  const canCreate = getPermission(user, "create_location");
  const canUpdate = getPermission(user, "update_location");
  const canDelete = getPermission(user, "delete_location");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: locations,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
    setLoading
  } = useDataFetch(getLocations, { search: "" });

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

  async function handleSave(locationData) {
    setLoading(true);
    try {
      if (editLocation) {
        await updateLocation(editLocation._id, locationData);
        dialog.success("Location updated successfully.");
      } else {
        await createLocation(locationData);
        dialog.success("Location created successfully.");
      }
      fetchData();
      setModalOpen(false);
      setEditLocation(null);
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save location.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Location", message: "Are you sure?" });
    if (!confirmed) return;
    setLoading(true);
    try {
      await deleteLocation(id);
      dialog.success("Location deleted successfully.");
      fetchData();
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to delete location.");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Name", accessor: "name" },
    { header: "Address", render: (c) => c.address || "-" },
    {
      header: "Status", render: (c) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize text-white ${c.status === "active" ? "bg-emerald-500" : "bg-gray-400"}`}>
          {c.status}
        </span>
      )
    },
    {
      header: "Actions", className: "text-center", render: (c) => (
        <div className="flex items-center gap-1 justify-center">
          {canView && (
            <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
              onClick={() => { setEditLocation(null); setViewLocation(c); setModalOpen(true); }}>
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
                      onClick={() => { setViewLocation(null); setEditLocation(c); setModalOpen(true); }}>
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
      )
    }
  ];

  return (
    <div className="h-content-available flex flex-col">
      <LocationModal
        key={modalOpen ? (editLocation ? editLocation._id : "new") : "closed"}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditLocation(null); setViewLocation(null); }}
        onSave={handleSave}
        data={editLocation || viewLocation}
        viewOnly={!!viewLocation}
        onEdit={() => { setEditLocation(viewLocation); setViewLocation(null); }}
      />

      <PageHeader
        title="Location Management"
        description="Organize and manage warehouses and storefronts"
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={() => { setEditLocation(null); setViewLocation(null); setModalOpen(true); }}>
                <HiOutlinePlus className="text-md" /> Add Location
              </Button>
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
              placeholder="Search locations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="overflow-auto min-h-0 flex flex-col">
        <DataTable columns={columns} data={locations} loading={loading} error={error} />
      </div>

      {locations.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default Locations;
