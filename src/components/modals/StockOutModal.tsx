// @ts-nocheck
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../contexts/auth/useAuth";
import { Listbox } from "@headlessui/react";
import {
  HiSelector,
  HiXCircle,
  HiOutlineDocumentText,
  HiExclamationCircle,
  HiOutlineUpload,
  HiOutlineCamera,
} from "react-icons/hi";

import { createStock, updateStock } from "../../api";
import { useDialog } from "../../contexts/dialog/useDialog";
import BarcodeScannerModal from "./BarcodeScannerModal";

const StockOutModal = ({ open, onClose, products, locations = [], data }) => {
  const { user } = useAuth();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [reason, setReason] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const dialog = useDialog();
  useEffect(() => {
    let t;
    if (open) {
      if (data) {
        t = setTimeout(() => {
          setProductId(data.product?._id || data.product || data.product_id?._id || data.product_id || "");
          setQuantity(data.quantity || "");
          setBatchNumber(data.batch_number || "");
          setReason(data.reason || "");
          setWarehouse(data.location?._id || data.location || data.location_id?._id || data.location_id || "");
          setNotes(data.notes || "");
          setExpiryDate(data.expiry_date ? new Date(data.expiry_date).toISOString().split('T')[0] : "");
          setTouched({});
          setValidateOnSave(false);
        }, 0);
      } else {
        t = setTimeout(() => {
          setProductId("");
          setQuantity("");
          setBatchNumber("");
          setReason("");
          setWarehouse("");
          setNotes("");
          setExpiryDate("");
          setTouched({});
          setValidateOnSave(false);
        }, 0);
      }
    }
    return () => clearTimeout(t);
  }, [open, data]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setValidateOnSave(true);
    setTouched({});
    if (!productId || !quantity || !reason || !warehouse) {
      return;
    }
    setLoading(true);
    try {
      const payload = {
        product_id: productId,
        quantity: Number(quantity),
        batch_number: batchNumber,
        reason,
        location_id: warehouse,
        notes: notes,
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        type: "out",
        user_id: user?._id,
        completed_at: new Date(),
        status: "active",
      };
      if (data) {
        await updateStock(data._id, payload);
        dialog.success("Stock out updated successfully");
      } else {
        await createStock(payload);
        dialog.success("Stock out created successfully");
      }
      onClose();
    } catch (error) {
      dialog.error(
        `Failed to ${data ? "update" : "create"} stock out: ` +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (decodedText) => {
    const scannedProduct = products.find(p => p.code === decodedText);
    if (scannedProduct) {
      setProductId(scannedProduct._id);
      dialog.success(`Product ${scannedProduct.name} selected via barcode`);
    } else {
      dialog.error(`No product found with barcode: ${decodedText}`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
      <div className="bg-white rounded-2xl p-5 w-full max-w-[40%] max-h-[80vh] shadow-xl relative">
        <div className="mb-6 text-center">
          <HiOutlineUpload className="text-3xl text-red-600 mx-auto mb-2" />
          <h2 className="text-xl font-bold mb-2 text-center">
            {data ? "Update Stock Out" : "Stock Out"}
          </h2>
          <span className="text-sm text-gray-500">
            {data
              ? "Update transaction details"
              : "Record inventory transaction"}
          </span>
        </div>
        <form className="space-y-5 overflow-auto max-h-[50vh] px-1">
          <div>
            <label
              htmlFor="product"
              className="text-sm font-medium text-gray-700"
            >
              Product <sup className="text-red-500">*</sup>
            </label>
            <div className="flex gap-2">
              <Listbox value={productId} onChange={setProductId}>
                <div className="relative flex-1">
                <Listbox.Button
                  id="product"
                  className={`cursor-pointer w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${!productId && (touched.productId || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                >
                  <span className="truncate">
                    {products.some((p) => p._id === productId)
                      ? products.find((p) => p._id === productId).name
                      : "Select product"}
                  </span>
                  <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                  {products.map((p) => {
                    const isDisabled = p.stock - (p.reserved_stock || 0) <= 0;
                    return (
                      <Listbox.Option
                        key={p._id}
                        value={p._id}
                        className={({ selected }) =>
                          `px-3 py-2 text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""} ${isDisabled ? "opacity-50 cursor-default bg-gray-50 text-gray-400" : "cursor-pointer"}`
                        }
                        disabled={isDisabled}
                      >
                        {({ selected }) => (
                          <span
                            className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                          >
                            {p.name} (Stock:
                            {p.stock - (p.reserved_stock || 0)})
                            {isDisabled ? " - Out of stock" : ""}
                          </span>
                        )}
                      </Listbox.Option>
                    );
                  })}
                </Listbox.Options>
              </div>
            </Listbox>
            <button 
                type="button"
                className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-3 py-2 rounded-lg transition"
                onClick={() => setScannerOpen(true)}
                title="Scan Barcode"
              >
                <HiOutlineCamera className="text-xl" />
              </button>
            </div>
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
                onChange={(e) => {
                  const val = e.target.value;
                  const product = products.find((p) => p._id === productId);
                  const maxStock = product
                    ? product.stock - (product.reserved_stock || 0)
                    : null;

                  if (maxStock !== null && Number(val) > maxStock) {
                    setQuantity(maxStock);
                  } else {
                    setQuantity(val);
                  }
                }}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, quantity: true }))
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
                placeholder="Optional batch number"
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
            <label
              htmlFor="expiryDate"
              className="text-sm font-medium text-gray-700 mt-3 block"
            >
              Expiry Date
            </label>
            <input
              id="expiryDate"
              type="date"
              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100 mt-1"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            <Listbox value={reason} onChange={setReason}>
              <div className="relative mt-3">
                <Listbox.Button
                  id="reason"
                  className={`cursor-pointer w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${!reason && (touched.reason || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                >
                  <span>{reason || "Select transaction reason"}</span>
                  <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                  {["Sale", "Damage", "Adjustment", "Other"].map((option) => (
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
                  className={`cursor-pointer w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${!warehouse && (touched.warehouse || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                >
                  <span className="truncate">
                    {locations.find(l => l._id === warehouse)?.name || "Select Location"}
                  </span>
                  <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                  {locations.map((loc) => (
                    <Listbox.Option
                      key={loc._id}
                      value={loc._id}
                      className={({ selected }) =>
                        `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                      }
                    >
                      {loc.name}
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
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500 flex gap-2">
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
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer"
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
            {data ? "Update Stock Out" : "Confirm Stock Out"}
          </button>
        </div>
      </div>
    </div>
  );
};

StockOutModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  products: PropTypes.array.isRequired,
  data: PropTypes.object,
};

export default StockOutModal;

