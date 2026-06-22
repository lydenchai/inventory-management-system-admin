// @ts-nocheck
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../contexts/auth/useAuth";
import { Listbox } from "@headlessui/react";
import {
  HiXCircle,
  HiOutlineDocumentText,
  HiCube,
  HiOutlinePlus,
  HiOutlineTrash,
  HiSelector,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePencil,
} from "react-icons/hi";
import {
  getProducts,
  getSuppliers,
  createOrderRequest,
  updateOrderRequest,
} from "../api";
import { BsCurrencyDollar } from "react-icons/bs";
import { useDialog } from "../contexts/dialog/useDialog";
import DatePicker from "../components/DatePicker";
import { formatDate } from "../utils/dateFormat";

const initialOrderRequest = {
  supplier_id: "",
  delivery_date: new Date().toISOString().slice(0, 10),
  notes: "",
  orderItems: [
    { product_id: "", quantity: 1, unit_price: null, subtotal: null },
  ],
};

const OrderRequestModal = ({
  open,
  onClose,
  onSave,
  data,
  viewOnly = false,
  onApprove,
  onReject,
  onConfirm,
  onEdit,
  onCancelRequest,
}) => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [order, setOrder] = useState(data || initialOrderRequest);
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  const [loading, setLoading] = useState(false);
  const dialog = useDialog();
  const { user } = useAuth();
  const canApprove = user?.permission?.permissions?.includes(
    "update_approve_request",
  );
  const canConfirm = user?.permission?.permissions?.includes(
    "update_confirm_delivery",
  );

  useEffect(() => {
    let t;
    if (open) {
      getProducts({ limit: -1 }).then((res) =>
        setProducts(res.data.data || []),
      );
      getSuppliers({ limit: -1 }).then((res) =>
        setSuppliers(res.data.data || []),
      );
      if (data) {
        t = setTimeout(() => {
          // Convert delivery_date to yyyy-MM-dd for input value
          let deliveryDateValue = data.delivery_date || "";
          if (deliveryDateValue) {
            const d = new Date(deliveryDateValue);
            if (!Number.isNaN(d)) {
              deliveryDateValue = d.toISOString().slice(0, 10);
            }
          }
          setOrder({
            _id: data._id,
            supplier_id:
              data.supplier_id ||
              (typeof data.supplier === "object"
                ? data.supplier?._id
                : data.supplier) ||
              "",
            delivery_date: deliveryDateValue,
            notes: data.notes || "",
            orderItems:
              data.orderItems &&
              Array.isArray(data.orderItems) &&
              data.orderItems.length > 0
                ? data.orderItems
                : data.items && Array.isArray(data.items)
                  ? data.items.map((item) => ({
                      product_id: item.product_id,
                      quantity: item.quantity,
                      unit_price: item.unit_price,
                      subtotal: item.subtotal,
                    }))
                  : [
                      {
                        product_id: "",
                        quantity: 1,
                        unit_price: null,
                        subtotal: null,
                      },
                    ],
          });
          setTouched({});
          setValidateOnSave(false);
        }, 0);
      } else {
        t = setTimeout(() => {
          setOrder(initialOrderRequest);
          setTouched({});
          setValidateOnSave(false);
        }, 0);
      }
    }
    return () => clearTimeout(t);
  }, [open, data]);

  function handleChange(e) {
    const { name, value } = e.target;
    setOrder((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleOrderItemChange(idx, field, value) {
    setOrder((prev) => {
      const items = prev.orderItems.map((item, i) => {
        if (i === idx) {
          let newItem = { ...item };
          if (field === "product_id") {
            newItem.product_id = value;
            // Set unit price from selected product
            const product = products.find((p) => p._id === value);
            newItem.unit_price = product ? product.price : 0;
            // Optionally reset quantity
            if (!item.quantity) newItem.quantity = 1;
          } else if (field === "quantity") {
            const product = products.find((p) => p._id === item.product_id);
            const maxStock = product
              ? product.stock - (product.reserved_stock || 0)
              : null;
            let newValue = value;
            if (maxStock !== null && Number(value) > maxStock) {
              newValue = maxStock;
            }
            newItem.quantity = Number(newValue);
          } else if (field === "unit_price") {
            newItem.unit_price = Number(value);
          }
          // Always update subtotal
          newItem.subtotal =
            (newItem.unit_price ?? 0) * (newItem.quantity ?? 0);
          return newItem;
        }
        return item;
      });
      return { ...prev, orderItems: items };
    });
  }

  function addOrderItem() {
    setOrder((prev) => ({
      ...prev,
      orderItems: [
        ...prev.orderItems,
        { product_id: "", quantity: 1, unit_price: 0, subtotal: 0 },
      ],
    }));
  }

  function removeOrderItem(idx) {
    setOrder((prev) => ({
      ...prev,
      orderItems: prev.orderItems.filter((_, i) => i !== idx),
    }));
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setValidateOnSave(true);
    const isUpdate = Boolean(data?._id);
    const supplierField = order.supplier_id;
    if (
      !supplierField ||
      !order.delivery_date ||
      order.orderItems.length === 0 ||
      order.orderItems.some(
        (item) =>
          !item.product_id ||
          typeof item.quantity !== "number" ||
          item.quantity <= 0 ||
          typeof item.unit_price !== "number" ||
          item.unit_price < 0,
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const payload = {
        supplier_id: order.supplier_id,
        delivery_date: order.delivery_date
          ? new Date(order.delivery_date).toISOString()
          : order.delivery_date,
        notes: order.notes,
        orderItems: order.orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal:
            item.unit_price && item.quantity
              ? item.unit_price * item.quantity
              : 0,
        })),
      };
      if (isUpdate) {
        await updateOrderRequest(data._id, payload);
        await dialog.success("Order request updated successfully.");
        if (onSave) onSave();
        handleClose();
      } else {
        await createOrderRequest(payload);
        await dialog.success("Order request created successfully.");
        if (onSave) onSave();
        handleClose();
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOrder(initialOrderRequest);
    setTouched({});
    setValidateOnSave(false);
    onClose();
  }

  let modalTitle;
  if (viewOnly) {
    modalTitle = "Order Request Details";
  } else if (data?._id) {
    modalTitle = "Update Order Request";
  } else {
    modalTitle = "New Order Request";
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[65%] max-h-[80vh] shadow-xl relative">
        <h2 className="text-xl font-bold mb-6 text-center">{modalTitle}</h2>
        <form className="space-y-5 overflow-auto max-h-[60vh] px-1">
          <div className="col-span-2 mb-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <HiOutlineDocumentText className="inline-block text-xl text-gray-900" />
                  <span>Basic Information</span>
                </div>
                {viewOnly && data?.status && (
                  <span
                    className={`px-3 py-2 rounded-full text-sm text-white capitalize ${data.status === "pending" ? "bg-yellow-400" : data.status === "approved" ? "bg-green-400" : data.status === "rejected" ? "bg-red-400" : data.status === "completed" ? "bg-gray-400" : data.status === "cancelled" ? "bg-red-400" : data.status === "on_hold" ? "bg-orange-400" : "bg-gray-400"}`}
                  >
                    {data.status}
                  </span>
                )}
              </div>
            </h3>
            <div className="mb-3 grid lg:grid-cols-2 md:grid-cols-1 gap-3">
              <div>
                <label
                  htmlFor="supplier"
                  className="text-sm font-medium text-gray-700"
                >
                  Supplier
                  {!viewOnly ? <sup className="text-red-500">*</sup> : null}
                </label>
                <Listbox
                  value={
                    suppliers.find((s) => s._id === order.supplier_id) || null
                  }
                  onChange={(supplier) => {
                    if (viewOnly) return;
                    // If supplier changes, reset items to avoid mismatch
                    if (order.supplier_id !== (supplier ? supplier._id : "")) {
                      setOrder((prev) => ({
                        ...prev,
                        supplier_id: supplier ? supplier._id : "",
                        orderItems: [
                          {
                            product_id: "",
                            quantity: 1,
                            unit_price: null,
                            subtotal: null,
                          },
                        ],
                      }));
                    } else {
                      setOrder((prev) => ({
                        ...prev,
                        supplier_id: supplier ? supplier._id : "",
                      }));
                    }
                    setTouched((prev) => ({ ...prev, supplier_id: true }));
                  }}
                  disabled={viewOnly}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="supplier"
                      className={`${viewOnly ? "cursor-default" : "cursor-pointer"} w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${!order.supplier_id && (touched.supplier_id || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    >
                      <span>
                        {suppliers.find(
                          (s) => s._id === (order.supplier_id || ""),
                        )?.company_name || "Select supplier"}
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
                      {suppliers.map((supplier) => (
                        <Listbox.Option
                          key={supplier._id}
                          value={supplier}
                          className={({ selected }) =>
                            `px-3 py-2 text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""} ${supplier.products_count <= 0 ? "opacity-50 cursor-default bg-gray-50 text-gray-400" : "cursor-pointer"}`
                          }
                          disabled={supplier.products_count <= 0}
                        >
                          {supplier.company_name} ({supplier.products_count}
                          {supplier.products_count > 1
                            ? " Products"
                            : " Product"}
                          )
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label
                  htmlFor="delivery_date"
                  className="text-sm font-medium text-gray-700"
                >
                  Delivery Date
                  {!viewOnly ? <sup className="text-red-500">*</sup> : null}
                </label>
                <DatePicker
                  id="delivery_date"
                  selected={order.delivery_date}
                  onChange={(date) =>
                    setOrder((prev) => ({
                      ...prev,
                      delivery_date: date
                        ? date.toISOString().split("T")[0]
                        : "",
                    }))
                  }
                  viewOnly={viewOnly}
                  placeholder="Delivery Date"
                />
              </div>
            </div>
          </div>
          <div className="col-span-2 mb-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiCube className="inline-block text-xl text-gray-900" />
              <span>Products</span>
            </h3>
            {(order.orderItems || []).map((item, idx) => (
              <div key={idx} className="w-full flex items-center">
                <div className="w-full mb-3 grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3">
                  <div>
                    <label
                      htmlFor={`product_${idx}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Product
                      {!viewOnly ? <sup className="text-red-500">*</sup> : null}
                    </label>
                    {(() => {
                      const selectedProduct = products.find(
                        (p) => p._id === item.product_id,
                      );
                      let productPlaceholder = "";
                      if (selectedProduct?.name) {
                        productPlaceholder = selectedProduct.name;
                      } else if (order.supplier_id) {
                        productPlaceholder = "Select product";
                      } else {
                        productPlaceholder = "Select supplier first";
                      }
                      return (
                        <Listbox
                          value={selectedProduct || null}
                          onChange={(product) => {
                            if (viewOnly) return;
                            handleOrderItemChange(
                              idx,
                              "product_id",
                              product ? product._id : "",
                            );
                          }}
                          disabled={viewOnly || !order.supplier_id}
                        >
                          <div className="relative">
                            <Listbox.Button
                              id={`product_${idx}`}
                              className={`${viewOnly || !order.supplier_id ? "cursor-default" : "cursor-pointer"} bg-gray-50 w-full border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${!item.product_id && validateOnSave ? "border-red-500" : "border-gray-100"}`}
                            >
                              <span>{productPlaceholder}</span>
                              {!viewOnly && (
                                <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                              )}
                            </Listbox.Button>
                            <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                              {(() => {
                                const filteredProducts = order.supplier_id
                                  ? products.filter(
                                      (p) =>
                                        p.supplier_id === order.supplier_id ||
                                        p.supplier?._id === order.supplier_id,
                                    )
                                  : [];

                                if (filteredProducts.length === 0) {
                                  return (
                                    <div className="px-4 py-2 text-gray-400">
                                      {order.supplier_id
                                        ? "No products for this supplier"
                                        : "Select a supplier first"}
                                    </div>
                                  );
                                }

                                return filteredProducts.map((product) => {
                                  const isSelected = order.orderItems.some(
                                    (orderItem, orderIdx) =>
                                      orderItem.product_id === product._id &&
                                      orderIdx !== idx,
                                  );
                                  const availableStock =
                                    product.stock -
                                    (product.reserved_stock || 0);
                                  const isDisabled =
                                    availableStock <= 0 || isSelected;
                                  return (
                                    <Listbox.Option
                                      key={product._id}
                                      value={product}
                                      className={({ selected }) =>
                                        `px-3 py-2 text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""} ${isDisabled ? "opacity-50 cursor-default bg-gray-50 text-gray-400" : "cursor-pointer"}`
                                      }
                                      disabled={isDisabled}
                                    >
                                      {product.name} (Stock: {availableStock})
                                      {isSelected ? " - Already added" : ""}
                                      {availableStock <= 0 && !isSelected
                                        ? " - Out of stock (or reserved)"
                                        : ""}
                                    </Listbox.Option>
                                  );
                                });
                              })()}
                            </Listbox.Options>
                          </div>
                        </Listbox>
                      );
                    })()}
                  </div>
                  <div>
                    <label
                      htmlFor={`quantity_${idx}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Quantity
                      {!viewOnly ? <sup className="text-red-500">*</sup> : null}
                    </label>
                    <input
                      type={viewOnly ? "text" : "number"}
                      id={`quantity_${idx}`}
                      min={1}
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100`}
                      value={item.quantity}
                      onChange={(e) => {
                        if (viewOnly) return;
                        handleOrderItemChange(idx, "quantity", e.target.value);
                      }}
                      disabled={viewOnly}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`unit_price_${idx}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Unit Price
                    </label>
                    <input
                      type={viewOnly ? "text" : "number"}
                      id={`unit_price_${idx}`}
                      min={0}
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100`}
                      placeholder="Unit Price"
                      value={item.unit_price?.toFixed(2) ?? ""}
                      disabled
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`line_total_${idx}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Line Total
                    </label>
                    <input
                      id={`line_total_${idx}`}
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100`}
                      value={
                        (item.unit_price ?? 0) && (item.quantity ?? 0)
                          ? (
                              (item.unit_price ?? 0) * (item.quantity ?? 0)
                            ).toFixed(2)
                          : "0"
                      }
                      disabled
                    />
                  </div>
                </div>
                {!viewOnly && (
                  <div className="max-w-10">
                    <button
                      type="button"
                      className={`text-xl px-2 mt-6 max-w-10 ${order.orderItems.length === 1 ? "text-gray-400 cursor-default" : "text-red-500 cursor-pointer"}`}
                      onClick={() => {
                        if (viewOnly) return;
                        removeOrderItem(idx);
                      }}
                      title="Remove"
                      disabled={order.orderItems.length === 1 || viewOnly}
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!viewOnly && (
              <div className="w-full flex items-center justify-center mt-4">
                <button
                  type="button"
                  className="text-sm text-[#1e3a5f] px-6 py-2 rounded-full focus:outline-none border border-[#1e3a5f] flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    if (viewOnly) return;
                    addOrderItem();
                  }}
                >
                  <HiOutlinePlus className="text-md" /> Add Item
                </button>
              </div>
            )}
          </div>
          <div className="w-full bg-gray-50 border rounded-lg px-3 py-4 text-sm text-gray-800 border-gray-100 flex items-center justify-end gap-2">
            <h3 className="flex items-center justify-end text-lg text-gray-900">
              <BsCurrencyDollar className="inline-block" />
              <span>Total:</span>
              <span className="ml-2 font-bold">
                {(order.orderItems || [])
                  .reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0)
                  .toFixed(2)}
              </span>
            </h3>
          </div>
          <div>
            <label
              htmlFor="notes"
              className="text-sm font-medium text-gray-700"
            >
              Notes / Remarks
            </label>
            <textarea
              id="notes"
              name="notes"
              value={order.notes || ""}
              onChange={(e) => {
                if (viewOnly) return;
                handleChange(e);
              }}
              onBlur={handleBlur}
              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
              disabled={viewOnly}
              rows={3}
            />
          </div>

          {viewOnly &&
            (data?.approved_at ||
              data?.confirmed_at ||
              data?.rejection_reason) && (
              <div>
                <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
                  <HiOutlineDocumentText className="inline-block text-xl text-gray-900" />
                  <span>Workflow History</span>
                </h3>
                <div className="flex flex-col gap-3 text-sm">
                  {data?.approved_at && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <HiOutlineCheckCircle className="text-green-500 text-xl mt-0.5" />
                      <div>
                        <span className="block font-semibold text-green-500">
                          Approved
                        </span>
                        <span className="block text-gray-700">
                          By:{" "}
                          <span>
                            {data.approver
                              ? `${data.approver.first_name} ${data.approver.last_name}`
                              : "Admin"}
                          </span>
                        </span>
                        <span className="block text-gray-400 text-sm">
                          {formatDate(data.approved_at, true)}
                        </span>
                        {data.admin_remark && (
                          <div className="mt-1 text-gray-500 italic">
                            "{data.admin_remark}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {data?.confirmed_at && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <HiOutlineCheckCircle className="text-[#1e3a5f] text-xl mt-0.5" />
                      <div>
                        <span className="block font-semibold text-[#1e3a5f]">
                          Confirmed
                        </span>
                        <span className="block text-gray-700">
                          By:{" "}
                          <span>
                            {data.confirmer
                              ? `${data.confirmer.first_name} ${data.confirmer.last_name}`
                              : "Staff"}
                          </span>
                        </span>
                        <span className="block text-gray-400 text-sm">
                          {formatDate(data.confirmed_at, true)}
                        </span>
                      </div>
                    </div>
                  )}
                  {data?.rejection_reason && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                      <HiOutlineXCircle className="text-red-500 text-xl mt-0.5" />
                      <div>
                        <span className="block font-semibold text-red-500">
                          Rejected
                        </span>
                        <span className="block text-gray-700 font-semibold">
                          Reason:
                        </span>
                        <span className="block text-red-600">
                          {data.rejection_reason}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </form>
        <div className="col-span-2 w-full flex items-center justify-end gap-3 mt-4">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-[#1e3a5f] px-6 py-2 rounded-xl focus:outline-none border border-gray-100 flex items-center gap-2 cursor-pointer text-sm"
            onClick={handleClose}
          >
            <HiXCircle className="inline-block text-xl" />
            {viewOnly ? "Close" : "Cancel"}
          </button>
          {viewOnly && onConfirm && canConfirm && !data?.confirmed_at && (
            <button
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={onConfirm}
            >
              <HiOutlineCheckCircle className="inline-block text-xl" />
              Confirm
            </button>
          )}
          {viewOnly && onApprove && canApprove && (
            <button
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={onApprove}
            >
              <HiOutlineCheckCircle className="inline-block text-xl" />
              Approve
            </button>
          )}
          {viewOnly && onReject && canApprove && (
            <button
              type="button"
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={onReject}
            >
              <HiOutlineXCircle className="inline-block text-xl" />
              Reject
            </button>
          )}
          {!viewOnly && (
            <button
              type="button"
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={handleSubmit}
            >
              <HiOutlineDocumentText className="inline-block text-xl" />
              {loading ? "Submitting..." : data?._id ? "Update" : "Submit"}
            </button>
          )}
          {viewOnly &&
            onEdit &&
            String(data.requester_id) === String(user?._id) &&
            data.status === "pending" && (
              <button
                type="button"
                className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
                onClick={onEdit}
              >
                <HiOutlinePencil className="inline-block text-xl" />
                Update
              </button>
            )}
          {viewOnly &&
            onCancelRequest &&
            String(data.requester_id) === String(user?._id) &&
            data.status === "pending" && (
              <button
                type="button"
                className="text-red-500 bg-red-50 hover:bg-red-100 px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
                onClick={onCancelRequest}
              >
                <HiOutlineXCircle className="inline-block text-xl" />
                Cancel
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

OrderRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  suppliers: PropTypes.array,
  data: PropTypes.object,
  viewOnly: PropTypes.bool,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  onConfirm: PropTypes.func,
  onEdit: PropTypes.func,
  onCancelRequest: PropTypes.func,
};

export default OrderRequestModal;

