// @ts-nocheck
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../contexts/auth/useAuth";
import { createStockTransfer } from "../../api";
import { Listbox } from "@headlessui/react";
import {
  HiSelector,
  HiXCircle,
  HiOutlineDocumentText,
  HiOutlineSwitchHorizontal,
} from "react-icons/hi";
import { useDialog } from "../../contexts/dialog/useDialog";

const StockTransferModal = ({ open, onClose, products, locations, onTransferSuccess }) => {
  const { user } = useAuth();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sourceLocation, setSourceLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  const dialog = useDialog();

  useEffect(() => {
    let t;
    if (open) {
      t = setTimeout(() => {
        setProductId("");
        setQuantity("");
        setSourceLocation("");
        setDestinationLocation("");
        setReason("");
        setTouched({});
        setValidateOnSave(false);
      }, 0);
    }
    return () => clearTimeout(t);
  }, [open]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    if (!productId || !quantity || !sourceLocation || !destinationLocation) {
      setLoading(false);
      return;
    }
    if (sourceLocation === destinationLocation) {
      dialog.error("Source and destination locations cannot be the same.");
      setLoading(false);
      return;
    }
    try {
      const payload = {
        product_id: productId,
        quantity: Number(quantity),
        from_location_id: sourceLocation,
        to_location_id: destinationLocation,
        notes: reason,
        user_id: user?._id,
      };

      await createStockTransfer(payload);
      dialog.success("Stock transfer completed successfully");
      if (onTransferSuccess) onTransferSuccess();
      onClose();
    } catch (error) {
      dialog.error("Failed to transfer stock: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[40%] max-h-[80vh] shadow-xl relative flex flex-col">
        <div className="mb-6 text-center">
          <HiOutlineSwitchHorizontal className="text-3xl text-[#1e3a5f] mx-auto mb-2" />
          <h2 className="text-xl font-bold mb-2 text-center">Transfer Stock</h2>
          <span className="text-sm text-gray-500">
            Move inventory between locations
          </span>
        </div>
        <form className="space-y-5 overflow-auto px-1 flex-1">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Product <sup className="text-red-500">*</sup>
            </label>
            <Listbox value={productId} onChange={setProductId}>
              <div className="relative mt-1">
                <Listbox.Button className={`cursor-pointer w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${!productId && (touched.productId || validateOnSave) ? "border-red-500" : "border-gray-100"}`}>
                  <span className="truncate">
                    {products.find((p) => p._id === productId)?.name || "Select product"}
                  </span>
                  <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                  {products.map((p) => (
                    <Listbox.Option
                      key={p._id}
                      value={p._id}
                      className={({ selected }) => `px-3 py-2 text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] cursor-pointer rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}
                    >
                      {({ selected }) => (
                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                          {p.name} (Stock: {p.stock - (p.reserved_stock || 0)})
                        </span>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Quantity <sup className="text-red-500">*</sup>
              </label>
              <input
                type="number"
                className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 mt-1 ${!quantity && (touched.quantity || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                value={quantity}
                min={1}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, quantity: true }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Reason (Optional)
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 mt-1 border-gray-100"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Replenishment"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Source Location <sup className="text-red-500">*</sup>
              </label>
              <Listbox value={sourceLocation} onChange={setSourceLocation}>
                <div className="relative mt-1">
                  <Listbox.Button className={`cursor-pointer w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${!sourceLocation && (touched.sourceLocation || validateOnSave) ? "border-red-500" : "border-gray-100"}`}>
                    <span className="truncate">
                      {locations.find(l => l._id === sourceLocation)?.name || "Select Source"}
                    </span>
                    <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                    {locations.map((loc) => (
                      <Listbox.Option key={loc._id} value={loc._id} className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
                        {loc.name}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            <div className="flex flex-col justify-center items-center pt-6">
              <HiOutlineSwitchHorizontal className="text-gray-400 text-xl" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Destination Location <sup className="text-red-500">*</sup>
              </label>
              <Listbox value={destinationLocation} onChange={setDestinationLocation}>
                <div className="relative mt-1">
                  <Listbox.Button className={`cursor-pointer w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${!destinationLocation && (touched.destinationLocation || validateOnSave) ? "border-red-500" : "border-gray-100"}`}>
                    <span className="truncate">
                      {locations.find(l => l._id === destinationLocation)?.name || "Select Destination"}
                    </span>
                    <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                    {locations.map((loc) => (
                      <Listbox.Option key={loc._id} value={loc._id} className={({ selected }) => `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`}>
                        {loc.name}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          </div>
        </form>
        <div className="w-full flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-[#1e3a5f] px-6 py-2 rounded-xl focus:outline-none border border-gray-100 flex items-center gap-2 cursor-pointer text-sm"
            onClick={onClose}
          >
            <HiXCircle className="inline-block text-xl" /> Cancel
          </button>
          <button
            type="button"
            className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer"
            disabled={loading}
            onClick={() => {
              setValidateOnSave(true);
              setTouched({
                productId: true,
                quantity: true,
                sourceLocation: true,
                destinationLocation: true,
              });
              handleSubmit();
            }}
          >
            <HiOutlineDocumentText className="inline-block text-xl" /> Transfer Stock
          </button>
        </div>
      </div>
    </div>
  );
};

StockTransferModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  products: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  onTransferSuccess: PropTypes.func,
};

export default StockTransferModal;

