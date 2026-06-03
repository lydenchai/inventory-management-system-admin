import React, { useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineEye,
  HiViewGrid,
  HiViewList,
  HiOutlineShoppingCart,
  HiDotsVertical,
  HiOutlineCheckCircle,
  HiOutlineArchive,
  HiOutlineFilter,
  HiOutlineRefresh
} from "react-icons/hi";
import { MdOutlineSmsFailed } from "react-icons/md";

import ProductModal from "../components/ProductModal.jsx";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getSuppliers,
} from "../api";
import { useDialog } from "../contexts/dialog/useDialog";
import { useAuth } from "../contexts/auth/useAuth.js";
import { useCart } from "../contexts/cart/useCart";

import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import Pagination from "../components/Pagination";
import useDataFetch from "../hooks/useDataFetch";
import useDebounce from "../hooks/useDebounce";
import { CategoryDropdown, SupplierDropdown, StatusDropdown } from "../components/filters/FilterDropdowns";
import CardSkeleton from "../components/CardSkeleton";
import NoDataFound from "../components/NoDataFound";

const statusOptions = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "low_stock", label: "Low Stock" },
];

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

export default function Products() {
  const [viewMode, setViewMode] = useState("table");
  const dialog = useDialog();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [modalState, setModalState] = useState({ open: false, data: null, viewOnly: false });
  const [selectedIds, setSelectedIds] = useState([]);

  // Local filter states for immediate UI binding
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: products,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePage,
    resetFilters,
    fetchData
  } = useDataFetch(getProducts, { search: "", category: "", supplier: "", status: "" });

  const canView = getPermission(user, "view_product");
  const canCreate = getPermission(user, "create_product");
  const canUpdate = getPermission(user, "update_product");
  const canDelete = getPermission(user, "delete_product");

  useEffect(() => {
    getCategories({ limit: -1 }).then((res) => setCategories(res.data.data || []));
    getSuppliers({ limit: -1 }).then((res) => setSuppliers(res.data.data || []));
  }, []);

  // Sync debounced search to hook
  useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch]);

  // Initial fetch
  useEffect(() => {
    if (user) fetchData();
  }, [user, filters, pagination.page, pagination.limit]);

  const handleReset = () => {
    setSearchTerm("");
    resetFilters();
  };

  async function handleSave(product) {
    try {
      let dataToSave = { ...product };
      if (product.image instanceof File) {
        const formData = new FormData();
        Object.entries(product).forEach(([key, value]) => formData.append(key, value));
        dataToSave = formData;
      }

      const res = modalState.data && modalState.data._id
        ? await updateProduct(modalState.data._id, dataToSave)
        : await createProduct(dataToSave);

      if (res.data && res.data.success === false) {
        dialog.error(res.data.error || "Failed to save product");
        return;
      }

      dialog.success(modalState.data && modalState.data._id ? "Product updated" : "Product created");
      fetchData();
      setModalState({ open: false, data: null, viewOnly: false });
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save product");
    }
  }

  async function handleDelete(id) {
    const confirmed = await dialog.ask({ type: "confirm", title: "Delete Product", message: "Are you sure?" });
    if (confirmed) {
      try {
        await deleteProduct(id);
        dialog.success("Product deleted successfully");
        fetchData();
      } catch (err) {
        dialog.error(err?.response?.data?.error || "Failed to delete product");
      }
    }
  }

  const columns = [
    ...(canUpdate || canDelete ? [{
      header: <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
        checked={products.length > 0 && selectedIds.length === products.length}
        onChange={(e) => setSelectedIds(e.target.checked ? products.map(p => p._id) : [])} />,
      className: "w-15",
      render: (p) => (
        <input type="checkbox" className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          checked={selectedIds.includes(p._id)}
          onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, p._id] : prev.filter(id => id !== p._id))}
        />
      )
    }] : []),
    { header: "No.", render: (_, i) => i + 1 + (pagination.page - 1) * pagination.limit },
    { header: "Product Code", render: (p) => `#${p.code || "-"}` },
    { header: "Product Name", accessor: "name" },
    { header: "Category", render: (p) => <span className="text-[#1e3a5f]/80">{p.category?.name || "-"}</span> },
    { header: "Supplier", render: (p) => <span className="text-[#1e3a5f]/80">{p.supplier?.company_name || "-"}</span> },
    {
      header: "Stock", className: "text-right", render: (p) => (
        <span className={p.stock === 0 ? "text-red-600" : p.stock < 10 ? "text-orange-600" : "text-green-600"}>
          {p.stock} units
        </span>
      )
    },
    { header: "Price", className: "text-right", render: (p) => `$${Number(p.price).toFixed(2)}` },
    ...(canView || canUpdate || canDelete ? [
      {
        header: "Cart", className: "text-center", render: (p) => (
          p.status === "active" && (
            <button className={`cursor-pointer p-2 rounded-full hover:bg-gray-200 ${cartItems.some(i => i.product._id === p._id) ? "text-green-600" : "text-[#1e3a5f]"}`}
              onClick={() => addToCart(p)}>
              <HiOutlineShoppingCart className="text-xl" />
            </button>
          )
        )
      },
      {
        header: "Actions", className: "text-center", render: (p) => (
          <div className="flex items-center gap-1 justify-center">
            {canView && (
              <button className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                onClick={() => setModalState({ open: true, data: p, viewOnly: true })}>
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
                        onClick={() => setModalState({ open: true, data: p, viewOnly: false })}>
                        <HiOutlinePencil className="mr-2 h-5 w-5" /> Update
                      </button>
                    </Menu.Item>
                  )}
                  {canDelete && (
                    <Menu.Item>
                      <button className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl"
                        onClick={() => handleDelete(p._id)}>
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
      <ProductModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, data: null, viewOnly: false })}
        onSave={handleSave}
        data={modalState.data}
        viewOnly={modalState.viewOnly}
        onEdit={() => setModalState({ open: true, data: modalState.data, viewOnly: false })}
        categories={categories}
        suppliers={suppliers}
      />

      <PageHeader
        title="Product Management"
        description="Manage your product catalog and inventory"
        actions={
          <>
            {canCreate && (
              <Button onClick={() => setModalState({ open: true, data: null, viewOnly: false })}>
                <HiOutlinePlus className="text-md" /> Add Product
              </Button>
            )}
          </>
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
            <label className="block text-gray-700 text-sm mb-1">Category</label>
            <CategoryDropdown selected={filters.category} setSelected={c => updateFilters({ category: c })} categoryOptions={categories} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Supplier</label>
            <SupplierDropdown selected={filters.supplier} setSelected={s => updateFilters({ supplier: s })} supplierOptions={suppliers} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Stock Status</label>
            <StatusDropdown selected={filters.status} setSelected={s => updateFilters({ status: s })} statusOptions={statusOptions} />
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center mb-3 flex-shrink-0">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button className={`px-6 py-2 rounded-xl text-sm font-medium flex items-center ${viewMode === "table" ? "bg-white text-[#1e3a5f]" : "text-gray-500 hover:text-gray-900"}`} onClick={() => setViewMode("table")}>
            <HiViewList className="mr-1 text-lg" /> Table
          </button>
          <button className={`px-6 py-2 rounded-xl text-sm font-medium flex items-center ${viewMode === "card" ? "bg-white text-[#1e3a5f]" : "text-gray-500 hover:text-gray-900"}`} onClick={() => setViewMode("card")}>
            <HiViewGrid className="mr-1 text-lg" /> Cards
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="overflow-auto min-h-0 flex flex-col">
          <DataTable columns={columns} data={products} loading={loading} error={error} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {products.map(product => (
                <div key={product._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm hover-scale group cursor-pointer" onClick={() => setModalState({ open: true, data: product, viewOnly: true })}>
                  <div className="h-48 w-full bg-gray-50 relative overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${product.stock === 0 ? "bg-red-500" : product.stock < 10 ? "bg-orange-500" : "bg-emerald-500"}`}>
                        {product.stock === 0 ? "Out of Stock" : product.stock < 10 ? "Low Stock" : "In Stock"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="font-bold text-gray-800 text-lg mb-1">{product.name}</div>
                    <div className="text-sm text-gray-500 mb-3">#{product.code}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-bold text-xl text-[#1e3a5f]">${Number(product.price).toFixed(2)}</span>
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{product.stock} units</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <NoDataFound message="No products found." />
          )}
        </div>
      )}

      {products.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
}
