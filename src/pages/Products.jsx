import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Listbox, Menu } from "@headlessui/react";
import {
  HiSelector,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiDotsVertical,
  HiOutlineCheckCircle,
  HiOutlineArchive,
  HiViewGrid,
  HiViewList,
  HiOutlineShoppingCart,
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
import Pagination from "../components/Pagination";
import NoDataFound from "../components/NoDataFound";
import Loading from "../components/Loading";
import CardSkeleton from "../components/CardSkeleton";

const statusOptions = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "low_stock", label: "Low Stock" },
];

function CategoryDropdown({
  selected,
  setSelected,
  categoryOptions: categories,
}) {
  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>
            {categories.find((p) => p._id === selected)?.name ||
              "All Categories"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {categories.map((option) => (
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

CategoryDropdown.propTypes = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
  categoryOptions: PropTypes.array.isRequired,
};

function SupplierDropdown({
  selected,
  setSelected,
  supplierOptions: suppliers,
}) {
  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>
            {suppliers.find((p) => p._id === selected)?.company_name ||
              "All Suppliers"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {suppliers.map((option) => (
            <Listbox.Option
              key={option._id}
              value={option._id}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {option.company_name}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

SupplierDropdown.propTypes = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
  supplierOptions: PropTypes.array.isRequired,
};

function StatusDropdown({ selected, setSelected, statusOptions }) {
  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-black text-sm flex items-center justify-between">
          <span>
            {statusOptions.find((p) => p.value === selected)?.label ||
              "All Statuses"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {statusOptions.map((option) => (
            <Listbox.Option
              key={option.value}
              value={option.value}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {option.label}
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
  statusOptions: PropTypes.array.isRequired,
};

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [viewMode, setViewMode] = useState("table");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState("");

  // Loading and Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dialog
  const dialog = useDialog();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();

  function handleAddToCart(product) {
    addToCart(product);
  }

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Permissions
  const canView = getPermission(user, "view_product");
  const canCreate = getPermission(user, "create_product");
  const canUpdate = getPermission(user, "update_product");
  const canDelete = getPermission(user, "delete_product");

  useEffect(() => {
    getCategories({ limit: -1 }).then((res) =>
      setCategories(res.data.data || []),
    );
    getSuppliers({ limit: -1 }).then((res) =>
      setSuppliers(res.data.data || []),
    );
  }, []);

  useEffect(() => {
    if (user) {
      const delayDebounceFn = setTimeout(() => {
        fetchProducts(1, pagination.limit, search, category, supplier, status);
        setPagination((prev) => ({ ...prev, page: 1 }));
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search, category, supplier, status]);

  async function fetchProducts(
    page = 1,
    limit = 10,
    search = "",
    category = "",
    supplier = "",
    status = "",
  ) {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (category) params.category = category;
      if (supplier) params.supplier = supplier;
      if (status) params.status = status;
      const res = await getProducts(params);
      setProducts(res.data.data);
      setPagination((prev) => ({
        ...prev,
        ...res.data.pagination,
        page,
        limit,
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setEditProduct(null);
    setModalOpen(true);
  }

  function handleUpdate(product) {
    // Ensure category and supplier are _id strings for the modal, handle nulls
    let category = "";
    let supplier = "";
    if (product.category && typeof product.category === "object") {
      category = product.category._id || "";
    } else if (typeof product.category === "string") {
      category = product.category;
    }
    if (product.supplier && typeof product.supplier === "object") {
      supplier = product.supplier._id || "";
    } else if (typeof product.supplier === "string") {
      supplier = product.supplier;
    }
    setEditProduct({ ...product, category: category, supplier: supplier });
    setModalOpen(true);
  }

  async function handleSave(product) {
    setLoading(true);
    setError("");
    try {
      // Handle image upload (FormData) if image is a File
      let data = { ...product };
      if (product.image instanceof File) {
        const formData = new FormData();
        Object.entries(product).forEach(([key, value]) => {
          formData.append(key, value);
        });
        data = formData;
      }
      let res;
      if (editProduct) {
        res = await updateProduct(editProduct._id, data);
      } else {
        res = await createProduct(data);
      }
      if (res.data && res.data.success === false) {
        if (res.data.errors) {
          setError(res.data.errors.map((e) => e.msg).join(", "));
          dialog.error(
            res.data.errors.map((e) => e.msg).join(", ") ||
              "Failed to save product",
          );
        } else {
          setError(res.data.error || "Failed to save product");
          dialog.error(res.data.error || "Failed to save product");
        }
        return;
      }
      dialog.success(
        editProduct
          ? "Product updated successfully"
          : "Product created successfully",
      );
      fetchProducts(pagination.page, pagination.limit);
      setModalOpen(false);
    } catch (err) {
      dialog.error(err?.response?.data?.error || "Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  function handleView(product) {
    // Always open in view mode (viewOnly) for view action
    setEditProduct(null);
    setViewProduct(product);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Product",
      message: "Are you sure you want to delete this product?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      setLoading(true);
      setError("");
      try {
        await deleteProduct(id);
        dialog.success("Product deleted successfully");
        fetchProducts(pagination.page, pagination.limit);
      } catch (err) {
        dialog.error(err?.response?.data?.error || "Failed to delete product");
      } finally {
        setLoading(false);
      }
    }
  }

  const handleReset = () => {
    setSearch("");
    setCategory("");
    setSupplier("");
    setStatus("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts(1, pagination.limit, "", "", "", "");
  };

  async function handleSelectAll(e) {
    if (e.target.checked) {
      setLoading(true);
      try {
        const params = {
          limit: -1,
          search,
          category,
          supplier,
          status,
        };
        const res = await getProducts(params);
        const allIds = res.data.data.map((p) => p._id);
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
      await Promise.all(selectedIds.map((id) => editProduct(id, { status })));
      await dialog.success(`Products marked as ${status} successfully.`);
      fetchProducts(pagination.page, pagination.limit);
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to update products.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = await dialog.ask({
      type: "confirm",
      title: "Delete Products",
      message: `Are you sure you want to delete ${selectedIds.length} products?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteProduct(id)));
      await dialog.success("Products deleted successfully.");
      fetchProducts(pagination.page, pagination.limit);
      setSelectedIds([]);
    } catch {
      await dialog.error("Failed to delete products.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-content-available">
      <ProductModal
        key={
          modalOpen
            ? editProduct
              ? editProduct._id
              : viewProduct
                ? viewProduct._id
                : "new"
            : "closed"
        }
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditProduct(null);
          setViewProduct(null);
        }}
        onSave={handleSave}
        data={editProduct || viewProduct}
        viewOnly={!!viewProduct}
        onEdit={() => {
          // Prepare product for editing (similar logic to handleUpdate)
          let category = "";
          let supplier = "";
          if (
            viewProduct.category &&
            typeof viewProduct.category === "object"
          ) {
            category = viewProduct.category._id || "";
          } else if (typeof viewProduct.category === "string") {
            category = viewProduct.category;
          }
          if (
            viewProduct.supplier &&
            typeof viewProduct.supplier === "object"
          ) {
            supplier = viewProduct.supplier._id || "";
          } else if (typeof viewProduct.supplier === "string") {
            supplier = viewProduct.supplier;
          }

          setEditProduct({
            ...viewProduct,
            category: category,
            supplier: supplier,
          });
          setViewProduct(null);
        }}
      />
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Product Management</h1>
          <span className="text-gray-500 text-sm">
            Manage your product catalog and inventory
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={handleAdd}
              disabled={loading}
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
            >
              <HiOutlinePlus className="text-md" /> Add Product
            </button>
          )}
          {(canUpdate || canDelete) && (
            <Menu as="div" className="relative inline-block text-left">
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
                      <HiOutlineCheckCircle
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Active Products
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
                      Archive Products
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
                      Delete Products
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
            <label className="block text-gray-700 text-sm mb-1">Category</label>
            <CategoryDropdown
              selected={category}
              setSelected={setCategory}
              categoryOptions={categories}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Supplier</label>
            <SupplierDropdown
              selected={supplier}
              setSelected={setSupplier}
              supplierOptions={suppliers}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Stock Status
            </label>
            <StatusDropdown
              selected={status}
              setSelected={setStatus}
              statusOptions={statusOptions}
            />
          </div>
        </div>
      </div>
      {/* View Toggle */}
      <div className="flex justify-end items-center mb-3">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all flex items-center cursor-pointer ${viewMode === "table" ? "bg-white text-[#1e3a5f]" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setViewMode("table")}
          >
            <HiViewList className="mr-1 text-lg" /> Table
          </button>
          <button
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all flex items-center cursor-pointer ${viewMode === "card" ? "bg-white text-[#1e3a5f]" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setViewMode("card")}
          >
            <HiViewGrid className="mr-1 text-lg" /> Cards
          </button>
        </div>
      </div>
      {viewMode === "card" ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
              {[...Array(8)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <>
              <MdOutlineSmsFailed className="text-6xl text-red-500" />
              <div className="p-8 text-center text-red-500">{error}</div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 hover:scale-101"
                >
                  <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/400x300?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="text-gray-300 flex flex-col items-center">
                        <HiOutlineArchive className="text-4xl mb-2" />
                        <span className="text-sm">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {(canUpdate || canDelete) && (
                        <Menu
                          as="div"
                          className="relative inline-block text-left"
                        >
                          <Menu.Button className="bg-white/80 backdrop-blur-sm text-[#1e3a5f] p-1.5 rounded-full hover:bg-white shadow-sm cursor-pointer">
                            <HiDotsVertical className="text-lg" />
                          </Menu.Button>
                          <Menu.Items
                            anchor="bottom end"
                            className="bg-white rounded-2xl shadow-lg p-2 w-40 z-50 animate-fade-in-up border border-gray-100"
                          >
                            {canUpdate && (
                              <Menu.Item>
                                {() => (
                                  <button
                                    onClick={() => handleUpdate(product)}
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
                                    onClick={() => handleDelete(product._id)}
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
                    </div>
                    <div className="absolute top-3 left-3">
                      {(canUpdate || canDelete) && (
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-[#1e3a5f] cursor-pointer rounded border-gray-300"
                          checked={selectedIds.includes(product._id)}
                          onChange={(e) => handleSelectOne(e, product._id)}
                        />
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3
                          className="text-base font-semibold text-gray-900 line-clamp-1"
                          title={product.name}
                        >
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500">#{product.code}</p>
                      </div>
                      {/* <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize text-white ${
                          product.status === "active"
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                      >
                        {product.status}
                      </span> */}
                    </div>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="font-medium text-gray-900">
                          {product.category?.name || product.category || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Supplier:</span>
                        <span
                          className="font-medium text-gray-900 truncate max-w-30"
                          title={
                            typeof product.supplier === "object"
                              ? product.supplier?.company_name
                              : product.supplier
                          }
                        >
                          {typeof product.supplier === "object"
                            ? product.supplier?.company_name
                            : product.supplier || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-end">
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-lg font-bold text-[#1e3a5f]">
                          ${Number(product.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Stock</p>
                        <p
                          className={`font-semibold ${
                            product.stock === 0
                              ? "text-red-600"
                              : product.stock < 10
                                ? "text-orange-600"
                                : "text-green-600"
                          }`}
                        >
                          {product.stock}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {canView && (
                        <button
                          onClick={() => handleView(product)}
                          className="flex-1 py-2 flex items-center justify-center text-sm font-medium text-[#1e3a5f] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <HiOutlineEye className="mr-1.5 text-lg" /> View
                        </button>
                      )}
                      {product.status === "active" && (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 py-2 flex items-center justify-center text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#16375b] rounded-lg transition-colors cursor-pointer relative"
                          title="Add to cart"
                        >
                          <HiOutlineShoppingCart className="mr-1.5 text-lg" />
                          {cartItems.some((i) => i.product._id === product._id)
                            ? `In Cart (${cartItems.find((i) => i.product._id === product._id)?.quantity})`
                            : "Add to Cart"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="col-span-full">
                  <NoDataFound message="No products found." />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
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
                            products.length > 0 &&
                            selectedIds.length === pagination.totalItems
                          }
                          onChange={handleSelectAll}
                        />
                      </th>
                    )}
                    <th className="number">No.</th>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Supplier</th>
                    {/* <th>Status</th> */}
                    <th className="text-right">Stock</th>
                    {canCreate || canUpdate || canDelete ? (
                      <th className="text-right">Cost</th>
                    ) : null}
                    <th className="text-right">Price</th>
                    {canView || canUpdate || canDelete ? (
                      <>
                        <th className="text-center">Cart</th>
                        <th className="text-center action">Actions</th>
                      </>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product._id} className="hover:bg-[#f1f5f9]">
                      {(canUpdate || canDelete) && (
                        <td className="w-15">
                          <input
                            type="checkbox"
                            name="select"
                            id="select"
                            className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                            checked={selectedIds.includes(product._id)}
                            onChange={(e) => handleSelectOne(e, product._id)}
                          />
                        </td>
                      )}
                      <td className="number">
                        {index + 1 + (pagination.page - 1) * pagination.limit}
                      </td>
                      <td>#{product.code || "-"}</td>
                      <td>{product.name || "-"}</td>
                      <td>
                        <span className="text-blue-500/80">
                          {product.category?.name || product.category || "-"}
                        </span>
                      </td>
                      <td>
                        <span className="text-blue-500/80">
                          {typeof product.supplier === "object"
                            ? product.supplier?.company_name ||
                              product.supplier?.name || "-"

                            : product.supplier}
                        </span>
                      </td>
                      {/* <td>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm capitalize text-white ${product.status === "active" ? "bg-green-400" : "bg-gray-100"}`}
                        >
                          {product.status}
                        </span>
                      </td> */}
                      <td className="text-right">
                        <span
                          className={`text-sm ${product.stock === 0 ? "text-red-600" : product.stock < 10 ? "text-orange-600" : "text-green-600"}`}
                        >
                          {product.stock} {product.stock > 1 ? "units" : "unit"}
                        </span>
                      </td>
                      {canCreate || canUpdate || canDelete ? (
                        <td className="text-right">
                          <span className="text-gray-500">
                            ${Number(product.cost_price || 0).toFixed(2)}
                          </span>
                        </td>
                      ) : null}
                      <td className="text-right">
                        ${Number(product.price).toFixed(2)}
                      </td>
                      <td className="text-center">
                        {product.status === "active" && (
                          <button
                            className={`cursor-pointer p-2 rounded-full hover:bg-gray-200 ${
                              cartItems.some((i) => i.product._id === product._id)
                                ? "text-green-600"
                                : "text-[#1e3a5f]"
                            }`}
                            title={cartItems.some((i) => i.product._id === product._id) ? "Already in cart" : "Add to cart"}
                            onClick={() => handleAddToCart(product)}
                          >
                            <HiOutlineShoppingCart className="text-xl" />
                          </button>
                        )}
                      </td>
                      <td className="flex items-center gap-1 justify-center action">
                        {canView && (
                          <button
                            className="text-[#1e3a5f] font-semibold cursor-pointer p-2 rounded-full hover:bg-gray-200"
                            title="View"
                            onClick={() => handleView(product)}
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
                                      onClick={() => handleUpdate(product)}
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
                                      onClick={() => handleDelete(product._id)}
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
                  {products.length === 0 && (
                    <tr>
                      <td
                        colSpan={canCreate || canUpdate || canDelete ? 12 : 10}
                      >
                        <NoDataFound message="No products found." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {products.length > 0 && (
        <div className="flex justify-end mt-3">
          <Pagination
            total={pagination.totalItems}
            page={pagination.page}
            limit={pagination.limit}
            onChange={({ page, limit }) => {
              setPagination((prev) => ({ ...prev, page, limit }));
              fetchProducts(page, limit);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Products;
