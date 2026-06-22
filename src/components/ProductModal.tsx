// @ts-nocheck
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  HiXCircle,
  HiOutlineDocumentText,
  HiOutlineCamera,
  HiOutlineUpload,
  HiSelector,
  HiOutlinePencil,
} from "react-icons/hi";

const initialProduct = {
  code: "",
  name: "",
  category: "",
  supplier: "",
  cost_price: "",
  price: "",
  stock: "",
  image: "",
  status: "active",
};

import { uploadFile } from "../api";
import { Listbox } from "@headlessui/react";
import { useAuth } from "../contexts/auth/useAuth";
import { useCart } from "../contexts/cart/useCart";
import { HiOutlineShoppingCart } from "react-icons/hi";

const ProductModal = ({
  open,
  onClose,
  onSave,
  data,
  viewOnly = false,
  onEdit,
  categories = [],
  suppliers = [],
}) => {
  const [product, setProduct] = useState(data || initialProduct);
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  const { user } = useAuth();
  const isInternalUser = user.user_type === "internal";
  const canUpdate = user?.permission?.permissions?.includes("update_product");
  const { addToCart } = useCart();

  useEffect(() => {
    if (open) {
      if (!data) {
        setTimeout(() => {
          setProduct(initialProduct);
          setTouched({});
          setValidateOnSave(false);
        }, 0);
      } else {
        setTimeout(() => {
          setProduct(data);
          setTouched({});
          setValidateOnSave(false);
        }, 0);
      }
    }
    return undefined;
  }, [open, data]);

  async function handleImageChange(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const res = await uploadFile(file);
        const url = res.data?.url || res.data?.file?.url;
        if (url) {
          setProduct((prev) => ({ ...prev, image: url }));
        }
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[40%] max-h-[80vh] shadow-xl relative">
        <h2 className="text-xl font-bold mb-6 text-center">
          {viewOnly
            ? "Product Details"
            : product._id
              ? "Update Product"
              : "Add Product"}
        </h2>
        <form className="space-y-5 overflow-auto max-h-[50vh] px-1">
          <div className="col-span-2 mb-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <HiOutlineDocumentText className="inline-block text-xl text-gray-900" />
                  <span>Basic Information</span>
                </div>
                {viewOnly && (
                  <button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
                    onClick={() => {
                      addToCart(product);
                      onClose();
                    }}
                  >
                    <HiOutlineShoppingCart className="inline-block text-xl" />
                    Add to Cart
                  </button>
                )}
              </div>
            </h3>
            <div className="mb-3 grid lg:grid-cols-2 md:grid-cols-1 gap-3">
              <div>
                <label
                  htmlFor="product_code"
                  className="text-sm font-medium text-gray-700"
                >
                  Product Code
                </label>
                <input
                  id="product_code"
                  name="code"
                  value={product.code}
                  disabled
                  onChange={(e) =>
                    setProduct({ ...product, code: e.target.value })
                  }
                  placeholder="Product Code"
                  className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="product_name"
                  className="text-sm font-medium text-gray-700"
                >
                  Name
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <input
                  id="product_name"
                  name="name"
                  value={product.name}
                  onChange={(e) =>
                    setProduct({ ...product, name: e.target.value })
                  }
                  onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                  placeholder="Product Name"
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!product.name && !data && (touched.name || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                  disabled={viewOnly}
                />
              </div>
              <div>
                <label
                  htmlFor="product_category"
                  className="text-sm font-medium text-gray-700"
                >
                  Category
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <Listbox
                  value={
                    categories.find((cat) => cat._id === product.category) ||
                    null
                  }
                  onChange={
                    viewOnly
                      ? () => { }
                      : (cat) =>
                        setProduct({
                          ...product,
                          category: cat ? cat._id : "",
                        })
                  }
                  disabled={viewOnly}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="product_category"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${viewOnly ? "cursor-default" : "cursor-pointer"} ${!product.category && !data && (touched.category || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                      disabled={viewOnly}
                    >
                      <span>
                        {categories.find((cat) => cat._id === product.category)
                          ?.name || "Select category"}
                      </span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {categories.length === 0 && (
                        <div className="px-4 py-2 text-gray-400">
                          No categories
                        </div>
                      )}
                      {categories.map((cat) => (
                        <Listbox.Option
                          key={cat._id}
                          value={cat}
                          className={({ selected }) =>
                            `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                          }
                        >
                          {cat.name}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label
                  htmlFor="product_supplier"
                  className="text-sm font-medium text-gray-700"
                >
                  Supplier
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <Listbox
                  value={
                    suppliers.find((sup) => sup._id === product.supplier) ||
                    null
                  }
                  onChange={
                    viewOnly
                      ? () => { }
                      : (sup) =>
                        setProduct({
                          ...product,
                          supplier: sup ? sup._id : "",
                        })
                  }
                  disabled={viewOnly}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="product_supplier"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${viewOnly ? "cursor-default" : "cursor-pointer"} ${!product.supplier && !data && (touched.supplier || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                      disabled={viewOnly}
                    >
                      <span>
                        {suppliers.find((sup) => sup._id === product.supplier)
                          ?.company_name || "Select supplier"}
                      </span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {suppliers.length === 0 && (
                        <div className="px-4 py-2 text-gray-400">
                          No suppliers
                        </div>
                      )}
                      {suppliers.map((sup) => (
                        <Listbox.Option
                          key={sup._id}
                          value={sup}
                          className={({ selected }) =>
                            `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                          }
                        >
                          {sup.company_name}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              {isInternalUser && (
                <div>
                  <label
                    htmlFor="product_cost_price"
                    className="text-sm font-medium text-gray-700"
                  >
                    Cost Price
                    {!viewOnly && <sup className="text-red-500">*</sup>}
                  </label>
                  <input
                    id="product_cost_price"
                    name="cost_price"
                    value={product.cost_price}
                    onChange={(e) =>
                      setProduct({ ...product, cost_price: e.target.value })
                    }
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, cost_price: true }))
                    }
                    type={viewOnly ? "text" : "number"}
                    step="0.01"
                    className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${(!product.cost_price || isNaN(product.cost_price)) && !data && (touched.cost_price || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    disabled={viewOnly}
                  />
                </div>
              )}
              <div>
                <label
                  htmlFor="product_price"
                  className="text-sm font-medium text-gray-700"
                >
                  {isInternalUser ? "Selling Price" : "Price"}
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <input
                  id="product_price"
                  name="price"
                  value={product.price}
                  onChange={(e) =>
                    setProduct({ ...product, price: e.target.value })
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, price: true }))
                  }
                  type={viewOnly ? "text" : "number"}
                  step="0.01"
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${(!product.price || isNaN(product.price)) && !data && (touched.price || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                  disabled={viewOnly}
                />
              </div>
              <div>
                <label
                  htmlFor="product_stock"
                  className="text-sm font-medium text-gray-700"
                >
                  {product._id ? "Current Stock" : "Initial Stock"}
                  {!viewOnly && !product._id && (
                    <sup className="text-red-500">*</sup>
                  )}
                </label>
                <input
                  id="product_stock"
                  name="stock"
                  value={product.stock}
                  onChange={(e) =>
                    setProduct({ ...product, stock: e.target.value })
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, stock: true }))
                  }
                  type={viewOnly ? "text" : "number"}
                  placeholder={
                    product._id ? "Current Stock" : "Initial Quantity"
                  }
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${(!product.stock || isNaN(product.stock)) && !data && (touched.stock || validateOnSave) ? "border-red-500" : "border-gray-100"} ${product._id ? "cursor-default" : ""}`}
                  disabled={viewOnly || !!product._id}
                />
                {!!product._id && !viewOnly && (
                  <p className="text-xs text-gray-500 mt-1">
                    To adjust stock, use "Stock In" or "Stock Out".
                  </p>
                )}
              </div>
            </div>
          </div>
          {(!viewOnly || product.image) && (
            <div className="col-span-2 mb-2">
              <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
                <HiOutlineCamera className="inline-block text-xl text-gray-900" />
                <span>Image</span>
              </h3>
              <div className="mb-3">
                <label
                  htmlFor="product_image"
                  className="block text-gray-700 text-sm mb-1"
                >
                  Product Image
                </label>
                {viewOnly ? (
                  <div className="mt-2 flex items-center justify-center border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <a
                      href={product.image}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={product.image}
                        alt="Product"
                        className="h-40 w-40 object-cover rounded transition-all duration-300 hover:scale-101"
                      />
                    </a>
                  </div>
                ) : (
                  <label
                    htmlFor="image"
                    className="cursor-pointer relative group h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-lg p-6 hover:bg-gray-50 transition w-full"
                  >
                    {product.image ? (
                      <div className="relative w-40 h-40">
                        <a
                          href={product.image}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={product.image}
                            alt="Product"
                            className="w-full h-full object-cover rounded-md transition-all duration-300 hover:scale-101"
                          />
                        </a>
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                          <span className="text-xs font-medium">
                            Click to Change
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <HiOutlineUpload className="text-4xl text-gray-400 mb-2" />
                        <span className="text-gray-500">
                          Drag and drop your image here, or{" "}
                          <span className="text-[#1e3a5f] underline ml-1">
                            browse files
                          </span>
                        </span>
                        <span className="text-sm text-gray-400 mt-1">
                          Supported formats: JPG, PNG, GIF (Max 5MB)
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      id="image"
                      accept="image/jpeg,image/png,image/gif"
                      className="hidden"
                      onChange={handleImageChange}
                      disabled={viewOnly}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </form>
        <div className="col-span-2 w-full flex items-center justify-end gap-3 mt-4">
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
                  code: true,
                  name: true,
                  category: true,
                  supplier: true,
                  price: true,
                  cost_price: true,
                  stock: true,
                  image: true,
                });
                if (
                  !product.name ||
                  product.name.trim() === "" ||
                  !product.category ||
                  !product.supplier ||
                  !product.price ||
                  isNaN(product.price) ||
                  (isInternalUser &&
                    (!product.cost_price || isNaN(product.cost_price))) ||
                  !product.stock ||
                  isNaN(product.stock)
                ) {
                  return;
                }
                onSave(product);
              }}
            >
              <HiOutlineDocumentText className="inline-block text-xl" />
              {product._id ? "Update Product" : "Add Product"}
            </button>
          )}
          {viewOnly && onEdit && canUpdate && (
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

ProductModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  data: PropTypes.object,
  viewOnly: PropTypes.bool,
  onEdit: PropTypes.func,
  categories: PropTypes.array,
  suppliers: PropTypes.array,
};

export default ProductModal;

