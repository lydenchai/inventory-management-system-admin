// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Listbox, Menu } from "@headlessui/react";
import {
  HiOutlinePlus,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiSelector,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiDotsVertical,
  HiOutlineArchive,
  HiOutlineCheckCircle,
  HiOutlineReply,
} from "react-icons/hi";
import { getSales, deleteSale, getUsers, createSale, updateSale } from "../../api";
import Pagination from "../../components/ui/Pagination";
import SaleModal from "../../components/modals/SaleModal";
import ProcessReturnModal from "../../components/modals/ProcessReturnModal";
import { useAuth } from "../../contexts/auth/useAuth";
import { useDialog } from "../../contexts/dialog/useDialog";
import { formatDate } from "../../utils/dateFormat";
import { useNotification } from "../../contexts/notification/useNotification";
import DatePicker from "../../components/ui/DatePicker";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import useDataFetch from "../../hooks/useDataFetch";
import useDebounce from "../../hooks/useDebounce";

const statusOptions = ["Processing", "Completed", "Cancelled"];

function FilterDropdown({ value, onChange, options, placeholder }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between">
          <span className="truncate">{value || placeholder}</span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          <Listbox.Option value="" className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
            {placeholder}
          </Listbox.Option>
          {options.map((option) => (
            <Listbox.Option key={option} value={option} className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
              {option}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

function UserDropdown({ value, onChange, userOptions }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between">
          <span className="truncate">
            {userOptions.find((u) => u._id === value) ? `${userOptions.find((u) => u._id === value).first_name} ${userOptions.find((u) => u._id === value).last_name}` : "All Customers"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          <Listbox.Option value="" className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
            All Customers
          </Listbox.Option>
          {userOptions.map((user) => (
            <Listbox.Option key={user._id} value={user._id} className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
              {user.first_name} {user.last_name}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

const getPermission = (user, permission) => user?.permission?.permissions?.includes(permission);

const Sales = () => {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [viewSale, setViewSale] = useState(null);
  const [returnSale, setReturnSale] = useState(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const dialog = useDialog();
  const { user } = useAuth();
  const notification = useNotification();

  const canView = getPermission(user, "view_sale");
  const canCreate = getPermission(user, "create_sale");
  const canUpdate = getPermission(user, "update_sale");
  const canDelete = getPermission(user, "delete_sale");
  const canViewUsers = getPermission(user, "view_user");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: sales,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData,
    setLoading
  } = useDataFetch(getSales, {
    search: "",
    customer: "",
    status: "",
    start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (user && canViewUsers) {
      getUsers({ limit: -1 }).then(res => setUsers(res.data.data || [])).catch(console.error);
    }
  }, [user, canViewUsers]);

  const handleReset = () => {
    setSearchTerm("");
    resetFilters({
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0]
    });
  };

  async function handleSave(saleData) {
    setLoading(true);
    try {
      if (editSale) {
        await updateSale(editSale._id, saleData);
        dialog.success("Sale updated successfully");
        if (saleData.status && saleData.status.toLowerCase() === "completed") {
          notification?.show?.({ type: "success", message: "Sale marked as completed!" });
        }
      } else {
        await createSale(saleData);
        dialog.success("Sale created successfully");
      }
      fetchData();
      setModalOpen(false);
      setEditSale(null);
    } catch (err) {
      dialog.error(err?.response?.data?.error || err?.message || "Failed to save sale");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Sale", message: "Are you sure?" });
    if (confirmed) {
      setLoading(true);
      try {
        await deleteSale(id);
        dialog.success("Sale deleted successfully");
        fetchData();
      } catch {
        dialog.error("Failed to delete sale");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleBulkActive(isActive) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => updateSale(id, { is_active: isActive })));
      dialog.success(`Sales marked as ${isActive ? "Active" : "Archived"} successfully.`);
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to update sales.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Sales", message: "Are you sure?" });
    if (!confirmed) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteSale(id)));
      dialog.success("Sales deleted successfully.");
      fetchData();
      setSelectedIds([]);
    } catch {
      dialog.error("Failed to delete sales.");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    ...(canUpdate || canDelete ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
        checked={sales.length > 0 && selectedIds.length === sales.length}
        onChange={(e) => setSelectedIds(e.target.checked ? sales.map(s => s._id) : [])} />,
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
      header: "Customer", render: (s) => {
        const customer = s.customer || users.find(u => u._id === s.customer_id);
        return customer ? `${customer.first_name || ""} ${customer.last_name || ""}` : "Walk-in Guest";
      }
    },
    {
      header: "Total", render: (s) => {
        const totalAmount = (() => {
          if (s.items && s.items.length > 0) {
            return s.items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0) * (1 - (Number(item.discount) || 0) / 100), 0);
          } else {
            return (Number(s.price) || 0) * (Number(s.quantity) || 0) * (1 - (Number(s.discount) || 0) / 100);
          }
        })().toFixed(2);
        return `$${totalAmount}`;
      }
    },
    { header: "Payment Method", render: (s) => s.payment_method || "-" },
    { header: "Date", render: (s) => formatDate(s.completed_at, true) || "-" },
    ...(canView || canUpdate || canDelete ? [
      {
        header: "Actions", className: "text-center", render: (s) => (
          <div className="flex items-center gap-1 justify-center">
            {canView && (
              <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                onClick={() => { setEditSale(null); setViewSale(s); setModalOpen(true); }}>
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
                        onClick={() => { setViewSale(null); setEditSale(s); setModalOpen(true); }}>
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
                  {s.status === "Completed" && (
                    <Menu.Item>
                      <button className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-[#1e3a5f] hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl"
                        onClick={() => { setReturnSale(s); setReturnModalOpen(true); }}>
                        <HiOutlineReply className="mr-2 h-5 w-5" /> Process Return
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
      <SaleModal
        key={modalOpen ? (editSale ? editSale._id : viewSale ? viewSale._id : "new") : "closed"}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditSale(null); setViewSale(null); }}
        onSave={handleSave}
        data={editSale || viewSale}
        viewOnly={!!viewSale}
        onEdit={() => { setEditSale(viewSale); setViewSale(null); }}
      />
      <ProcessReturnModal
        open={returnModalOpen}
        onClose={() => { setReturnModalOpen(false); setReturnSale(null); }}
        data={returnSale}
        type="customer_return"
        onSuccess={fetchData}
      />

      <PageHeader
        title="Sales Management"
        description="Record and track all sales transactions with customer information"
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={() => { setViewSale(null); setEditSale(null); setModalOpen(true); }}>
                <HiOutlinePlus className="text-md" /> Record Sale
              </Button>
            )}
            {(canUpdate || canDelete) && (
              <Menu as="div" className="relative inline-block text-left ml-2">
                <Menu.Button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200">
                  <HiDotsVertical className="text-xl" />
                </Menu.Button>
                <Menu.Items anchor="bottom end" className="bg-white rounded-2xl shadow-lg p-2 w-50 z-50 border border-gray-100 focus:outline-none">
                  <Menu.Item>
                    <button onClick={() => handleBulkActive(true)} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineCheckCircle className="mr-2 h-5 w-5" /> Active Sales
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={() => handleBulkActive(false)} className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl">
                      <HiOutlineArchive className="mr-2 h-5 w-5" /> Archive Sales
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button onClick={handleBulkDelete} className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl">
                      <HiOutlineTrash className="text-red-500 mr-2 h-5 w-5" /> Delete Sales
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Search</label>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
              placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Start Date</label>
            <DatePicker selected={filters.start_date} onChange={date => updateFilters({ start_date: date ? date.toISOString().split("T")[0] : "" })} placeholder="Start Date" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">End Date</label>
            <DatePicker selected={filters.end_date} onChange={date => updateFilters({ end_date: date ? date.toISOString().split("T")[0] : "" })} placeholder="End Date" />
          </div>
          {canViewUsers && (
            <div>
              <label className="block text-gray-700 text-sm mb-1">Customer</label>
              <UserDropdown value={filters.customer} onChange={val => updateFilters({ customer: val })} userOptions={users} />
            </div>
          )}
          <div>
            <label className="block text-gray-700 text-sm mb-1">Status</label>
            <FilterDropdown value={filters.status} onChange={val => updateFilters({ status: val })} options={statusOptions} placeholder="All Status" />
          </div>
        </div>
      </div>

      <div className="overflow-auto min-h-0 flex flex-col">
        <DataTable
          columns={columns}
          data={sales}
          loading={loading}
          error={error}
          rowClassName={(sale) => sale.is_active === false ? "opacity-50 grayscale" : ""}
        />
      </div>

      {sales.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
};

export default Sales;

