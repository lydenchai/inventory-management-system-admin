// @ts-nocheck
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getProducts, getCustomers } from "../api";
import {
  HiXCircle,
  HiOutlineDocumentText,
  HiSelector,
  HiCube,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlinePencil,
} from "react-icons/hi";
import { Listbox } from "@headlessui/react";
import { useDialog } from "../contexts/dialog/useDialog";
import { useAuth } from "../contexts/auth/useAuth";

const defaultSale = {
  customer: "",
  items: [{ product: "", quantity: 1, price: 0, discount: 0 }],
  payment_method: "Cash",
  notes: "",
};

const paymentMethods = ["Cash", "Card", "Bank Transfer", "Other"];

const SaleModal = ({
  open,
  onClose,
  onSave,
  data,
  viewOnly = false,
  onEdit,
}) => {
  const [sale, setSale] = useState(defaultSale);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const dialog = useDialog();
  const { user } = useAuth();
  const canUpdate = user?.permission?.permissions?.includes("update_sale");

  useEffect(() => {
    let t;
    if (open) {
      getProducts({ limit: -1 }).then((res) =>
        setProducts(res.data.data || []),
      );
      getCustomers().then((res) => {
        setUsers(res.data.data || []);
      });
      if (data) {
        t = setTimeout(() => {
          setSale({
            _id: data._id,
            customer: data.customer?._id || data.customer_id || "",
            items:
              data.items && data.items.length > 0
                ? data.items.map((item) => ({
                    ...item,
                    product:
                      typeof item.product === "object"
                        ? item.product._id
                        : item.product,
                  }))
                : [
                    {
                      product: data.product?._id || data.product_id || "",
                      quantity: data.quantity || 1,
                      price: data.price || 0,
                      discount: data.discount || 0,
                    },
                  ],
            payment_method: data.payment_method || "Cash",
            notes: data.notes || "",
          });
        }, 0);
      } else {
        t = setTimeout(() => setSale(defaultSale), 0);
      }
    }
    return () => clearTimeout(t);
  }, [open, data]);

  const handleItemChange = (idx, field, value) => {
    setSale((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setSale((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product: "", quantity: 1, price: 0, discount: 0 },
      ],
    }));
  };

  const removeItem = (idx) => {
    setSale((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const calcLineTotal = (item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    const discount = Number(item.discount) || 0;
    return (price * qty * (1 - discount / 100)).toFixed(2);
  };

  const calcTotal = () => {
    return sale.items
      .reduce((sum, item) => sum + Number.parseFloat(calcLineTotal(item)), 0)
      .toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    // Customer is now optional for Walk-in sales
    if (sale.items.length === 0) {
      dialog.error("Please add at least one product.");
      return;
    }
    for (const item of sale.items) {
      if (!item.product) {
        dialog.error("Please select a product for all items.");
        return;
      }
      if (Number(item.quantity) <= 0) {
        dialog.error("Quantity must be greater than 0.");
        return;
      }
      if (Number(item.price) < 0) {
        dialog.error("Price cannot be negative.");
        return;
      }
    }

    const payload = {
      customer_id: sale.customer,
      items: sale.items.map((item) => ({
        product_id: item.product,
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: Number(item.discount),
      })),
      payment_method: sale.payment_method,
      notes: sale.notes,
      status: "processing",
    };

    onSave(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[78%] max-h-[80vh] shadow-xl relative">
        <h2 className="text-xl font-bold mb-6 text-center">
          {viewOnly ? "Sale Details" : sale._id ? "Update Sale" : "New Sale"}
        </h2>
        <form className="space-y-5 overflow-auto max-h-[60vh] px-1">
          <div className="col-span-2 mb-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiOutlineDocumentText className="inline-block text-xl text-gray-900" />
              <span> Customer Information</span>
            </h3>
            <div className="mb-3 grid grid-cols-1 gap-3">
              <div>
                <label
                  htmlFor="customer"
                  className="text-sm font-medium text-gray-700"
                >
                  Customer <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <Listbox
                  value={sale.customer}
                  onChange={(val) =>
                    setSale((prev) => ({ ...prev, customer: val }))
                  }
                  as="div"
                  disabled={viewOnly}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="customer"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between border-gray-100 ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className={sale.customer ? "" : "text-gray-400"}>
                        {sale.customer
                          ? (() => {
                              const u = users.find(
                                (u) => u._id === sale.customer,
                              );
                              return u
                                ? `${u.first_name} ${u.last_name || ""} (${u.email})`
                                : "Walk-in Customer (Guest)";
                            })()
                          : "Walk-in Customer (Guest)"}
                      </span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      <Listbox.Option
                        value=""
                        className={({ selected }) =>
                          `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                        }
                      >
                        Walk-in Customer (Guest)
                      </Listbox.Option>
                      {users.map((u) => (
                        <Listbox.Option
                          key={u._id}
                          value={u._id}
                          className={({ selected }) =>
                            `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                          }
                        >
                          {u.first_name} {u.last_name} ({u.email})
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>
          <div className="col-span-1 mb-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiCube className="inline-block text-xl text-gray-900" />
              <span>Products</span>
            </h3>
            {sale.items.map((item, idx) => {
              return (
                <div key={idx} className="w-full flex items-center">
                  <div className="w-full mb-3 grid lg:grid-cols-5 md:grid-cols-2 grid-cols-1 gap-3">
                    <div>
                      <label
                        htmlFor={`product-${idx}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Product
                        {!viewOnly && <sup className="text-red-500">*</sup>}
                      </label>
                      <Listbox
                        value={item.product}
                        onChange={(val) =>
                          handleItemChange(idx, "product", val)
                        }
                        as="div"
                        disabled={viewOnly}
                      >
                        <div className="relative">
                          <Listbox.Button
                            id={`product-${idx}`}
                            className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between border-gray-100 ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                          >
                            <span
                              className={item.product ? "" : "text-gray-400"}
                            >
                              {item.product
                                ? (() => {
                                    const p = products.find(
                                      (p) => p._id === item.product,
                                    );
                                    return p ? `${p.name}` : "Select an option";
                                  })()
                                : "Select an option"}
                            </span>
                            {!viewOnly && (
                              <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                            )}
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                            {products.map((p) => {
                              const isSelected = sale.items.some(
                                (saleItem, saleIdx) =>
                                  saleItem.product === p._id && saleIdx !== idx,
                              );
                              const availableStock =
                                p.stock - (p.reserved_stock || 0);
                              const isDisabled =
                                availableStock <= 0 || isSelected;

                              return (
                                <Listbox.Option
                                  key={p._id}
                                  value={p._id}
                                  className={({ selected }) =>
                                    `px-3 py-2 text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""} ${isDisabled ? "opacity-50 cursor-default bg-gray-50 text-gray-400" : "cursor-pointer "}`
                                  }
                                  disabled={isDisabled}
                                >
                                  {p.name} (Stock: {availableStock})
                                  {isSelected ? " - Already added" : ""}
                                  {availableStock <= 0 && !isSelected
                                    ? " - Out of stock (or reserved)"
                                    : ""}
                                </Listbox.Option>
                              );
                            })}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                    <div>
                      <label
                        htmlFor={`quantity-${idx}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Quantity
                        {!viewOnly && <sup className="text-red-500">*</sup>}
                      </label>
                      <div className="relative">
                        <input
                          id={`quantity-${idx}`}
                          type={viewOnly ? "text" : "number"}
                          className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100`}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const p = products.find(
                              (prod) => prod._id === item.product,
                            );
                            const maxStock = p
                              ? p.stock - (p.reserved_stock || 0)
                              : null;
                            if (maxStock !== null && val > maxStock) {
                              handleItemChange(idx, "quantity", maxStock);
                            } else {
                              handleItemChange(idx, "quantity", e.target.value);
                            }
                          }}
                          required
                          disabled={viewOnly}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor={`price-${idx}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Price
                        {!viewOnly && <sup className="text-red-500">*</sup>}
                      </label>
                      <input
                        id={`price-${idx}`}
                        type={viewOnly ? "text" : "number"}
                        min="0"
                        className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100`}
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(idx, "price", e.target.value)
                        }
                        required
                        disabled={viewOnly}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`discount-${idx}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Discount (%)
                      </label>
                      <input
                        id={`discount-${idx}`}
                        type={viewOnly ? "text" : "number"}
                        min="0"
                        max="100"
                        className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100`}
                        value={item.discount}
                        onChange={(e) =>
                          handleItemChange(idx, "discount", e.target.value)
                        }
                        disabled={viewOnly}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`line-total-${idx}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Line Total
                      </label>
                      <input
                        id={`line-total-${idx}`}
                        className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                        value={calcLineTotal(item)}
                        disabled
                      />
                    </div>
                  </div>
                  {!viewOnly && (
                    <div className="max-w-10">
                      <button
                        type="button"
                        className={`text-xl px-2 mt-6 max-w-10 ${sale.items.length === 1 ? "opacity-50 cursor-default" : "text-red-500 cursor-pointer"}`}
                        onClick={() => removeItem(idx)}
                        title="Remove"
                        disabled={sale.items.length === 1}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {!viewOnly && (
              <div className="w-full flex items-center justify-center mt-4">
                <button
                  type="button"
                  className="text-sm text-[#1e3a5f] px-6 py-2 rounded-full focus:outline-none border border-[#1e3a5f] flex items-center gap-2 cursor-pointer"
                  onClick={addItem}
                >
                  <HiOutlinePlus className="text-md" /> Add Item
                </button>
              </div>
            )}
          </div>
          <div className="col-span-1 mb-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiOutlineDocumentText className="inline-block text-xl text-gray-900" />
              <span>Payment Details</span>
            </h3>
            <div className="mb-3 grid lg:grid-cols-2 md:grid-cols-1 gap-3">
              <div>
                <label
                  htmlFor="payment-method"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Payment Method
                  {!viewOnly && <span className="text-red-500">*</span>}
                </label>
                <Listbox
                  value={sale.payment_method}
                  onChange={(val) =>
                    setSale((prev) => ({ ...prev, payment_method: val }))
                  }
                  as="div"
                  disabled={viewOnly}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="payment-method"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between border-gray-100 ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span>{sale.payment_method}</span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {paymentMethods.map((method) => (
                        <Listbox.Option
                          key={method}
                          value={method}
                          className={({ selected }) =>
                            `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                          }
                        >
                          {method}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label
                  htmlFor="total-amount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Total Amount
                </label>
                <input
                  id="total-amount"
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100`}
                  value={calcTotal()}
                  disabled
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              className="w-full border border-gray-100 rounded-lg px-3 py-2 bg-gray-50 text-gray-800"
              rows={3}
              value={sale.notes}
              onChange={(e) =>
                setSale((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add any additional notes..."
              disabled={viewOnly}
            />
          </div>
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
              type="submit"
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={handleSubmit}
            >
              <HiOutlineDocumentText className="inline-block text-xl" />
              {sale._id ? "Update Sale" : "Complete Sale"}
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

SaleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  data: PropTypes.object,
  viewOnly: PropTypes.bool,
  onEdit: PropTypes.func,
};

export default SaleModal;

