import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../contexts/auth/useAuth";
import { createStock, updateStock } from "../api";
import { Listbox } from "@headlessui/react";
import {
  HiSelector,
  HiXCircle,
  HiOutlineDocumentText,
  HiExclamationCircle,
  HiOutlineDownload,
} from "react-icons/hi";

import { useDialog } from "../contexts/dialog/useDialog";

const StockInModal = ({ open, onClose, products, data }) => {
  const { user } = useAuth();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [reason, setReason] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  const dialog = useDialog();

  useEffect(() => {
    let t;
    if (open) {
      if (data) {
        t = setTimeout(() => {
          setProductId(data.product_id || data.product?._id || "");
          setQuantity(data.quantity || "");
          setBatchNumber(data.batch_number || "");
          setReason(data.reason || "");
          setWarehouse(data.location || "Main Warehouse");
          setNotes(data.note || "");
          setTouched({});
          setValidateOnSave(false);
        }, 0);
      } else {
        t = setTimeout(() => {
          setProductId("");
          setQuantity("");
          setBatchNumber("");
          setReason("");
          setWarehouse("Main Warehouse");
          setNotes("");
          setUnitPrice("");
          setTouched({});
          setValidateOnSave(false);
        }, 0);
      }
    }
    return () => clearTimeout(t);
  }, [open, data]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    if (
      !productId ||
      !quantity ||
      !reason ||
      !warehouse ||
      (reason === "Purchase" && !unitPrice)
    ) {
      setLoading(false);
      return;
    }
    try {
      const payload = {
        product_id: productId,
        quantity: Number(quantity),
        batch_number: batchNumber,
        reason,
        location: warehouse,
        note: notes,
        type: "in",
        user_id: user?._id,
        completed_at: new Date(),
        cost_price: unitPrice ? Number(unitPrice) : undefined,
        status: "active",
      };

      if (data) {
        await updateStock(data._id, payload);
        dialog.success("Stock in updated successfully");
      } else {
        await createStock(payload);
        dialog.success("Stock in created successfully");
      }
      onClose();
    } catch (error) {
      dialog.error(
        `Failed to ${data ? "update" : "create"} stock in: ` +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[40%] max-h-[80vh] shadow-xl relative">
        <div className="mb-6 text-center">
          <HiOutlineDownload className="text-3xl text-green-600 mx-auto mb-2" />
          <h2 className="text-xl font-bold mb-2 text-center">
            {data ? "Update Stock In" : "Stock In"}
          </h2>
          <span className="text-sm text-gray-600">
            {data
              ? "Update transaction details"
              : "Record inventory transaction"}
          </span>
        </div>
        <form className="space-y-5 overflow-auto max-h-[50vh] px-1">
          <div>
            <label
              htmlFor="product-listbox"
              className="text-sm font-medium text-gray-700"
            >
              Product <sup className="text-red-500">*</sup>
            </label>
            <Listbox value={productId} onChange={setProductId}>
              <div className="relative">
                <Listbox.Button
                  id="product-listbox"
                  className={`cursor-pointer w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-black flex items-center justify-between ${!productId && (touched.productId || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                >
                  <span className="truncate">
                    {products.find((p) => p._id === productId)
                      ? products.find((p) => p._id === productId).name
                      : "Select product"}
                  </span>
                  <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                  {products.map((p) => {
                    return (
                      <Listbox.Option
                        key={p._id}
                        value={p._id}
                        className={({ selected }) =>
                          `px-3 py-2 text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] cursor-pointer rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                        }
                      >
                        {({ selected }) => (
                          <span
                            className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                          >
                            {p.name} (Stock: {p.stock - (p.reserved_stock || 0)}
                            )
                          </span>
                        )}
                      </Listbox.Option>
                    );
                  })}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="quantity"
                className="text-sm font-medium text-gray-700"
              >
                Quantity <sup className="text-red-500">*</sup>
              </label>
              <input
                id="quantity"
                type="number"
                className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!quantity && (touched.quantity || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                value={quantity}
                min={1}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, quantity: true }))
                }
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="unitPrice"
                className="text-sm font-medium text-gray-700"
              >
                Cost Price
                {reason === "Purchase" && <sup className="text-red-500">*</sup>}
              </label>
              <input
                id="unitPrice"
                type="number"
                className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100 ${reason === "Purchase" && !unitPrice && (touched.unitPrice || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                value={unitPrice}
                min={0}
                onChange={(e) => setUnitPrice(e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, unitPrice: true }))
                }
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="batchNumber"
                className="text-sm font-medium text-gray-700"
              >
                Batch Number
              </label>
              <input
                id="batchNumber"
                type="text"
                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="reason"
              className="text-sm font-medium text-gray-700"
            >
              Reason <sup className="text-red-500">*</sup>
            </label>
            <Listbox value={reason} onChange={setReason}>
              <div className="relative">
                <Listbox.Button
                  id="reason"
                  className={`cursor-pointer w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-black flex items-center justify-between ${!reason && (touched.reason || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                >
                  <span>{reason || "Select transaction reason"}</span>
                  <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                  {["Purchase", "Return", "Adjustment", "Other"].map(
                    (option) => (
                      <Listbox.Option
                        key={option}
                        value={option}
                        className={({ selected }) =>
                          `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                        }
                      >
                        {option}
                      </Listbox.Option>
                    ),
                  )}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
          <div>
            <label
              htmlFor="warehouse"
              className="text-sm font-medium text-gray-700"
            >
              Warehouse <sup className="text-red-500">*</sup>
            </label>
            <Listbox value={warehouse} onChange={setWarehouse}>
              <div className="relative">
                <Listbox.Button
                  id="warehouse"
                  className={`cursor-pointer w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-black flex items-center justify-between ${!warehouse && (touched.warehouse || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                >
                  <span className="truncate">
                    {warehouse || "Select Warehouse"}
                  </span>
                  <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                  {["Main Warehouse", "Showroom"].map((loc) => (
                    <Listbox.Option
                      key={loc}
                      value={loc}
                      className={({ selected }) =>
                        `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                      }
                    >
                      {loc}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
          <div>
            <label
              htmlFor="notes"
              className="text-sm font-medium text-gray-700"
            >
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or comments..."
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 flex gap-2">
            <HiExclamationCircle className="inline-block text-3xl" />
            <div className="flex flex-col">
              <span className="font-semibold">Transaction Information</span>
              <span>
                This transaction will be recorded with your user ID and current
                timestamp. Stock levels will be updated automatically across the
                system.
              </span>
            </div>
          </div>
        </form>
        <div className="col-span-2 w-full flex items-center justify-end gap-3 mt-4">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-[#1e3a5f] px-6 py-2 rounded-xl focus:outline-none border border-gray-100 flex items-center gap-2 cursor-pointer text-sm"
            onClick={onClose}
          >
            <HiXCircle className="inline-block text-xl" /> Cancel
          </button>
          <button
            type="button"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer"
            disabled={loading}
            onClick={() => {
              setValidateOnSave(true);
              setTouched({
                productId: true,
                quantity: true,
                reason: true,
                warehouse: true,
              });
              if (!warehouse || warehouse.trim() === "") {
                return;
              }
              handleSubmit();
            }}
          >
            <HiOutlineDocumentText className="inline-block text-xl" />
            {data ? "Update Stock In" : "Confirm Stock In"}
          </button>
        </div>
      </div>
    </div>
  );
};

StockInModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  products: PropTypes.array.isRequired,
  data: PropTypes.object,
};

export default StockInModal;
