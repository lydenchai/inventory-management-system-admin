// @ts-nocheck
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Listbox } from "@headlessui/react";
import {
  HiXCircle,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiSelector,
  HiOutlineCube
} from "react-icons/hi";
import { useDialog } from "../../contexts/dialog/useDialog";
import { createReturn, getLocations } from "../../api";

const ProcessReturnModal = ({ open, onClose, data, type, onSuccess }) => {
  const [returnItems, setReturnItems] = useState([]);
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const dialog = useDialog();

  useEffect(() => {
    let t;
    if (open) {
      t = setTimeout(() => {
        getLocations({ limit: -1 }).then(res => setLocations(res.data.data || []));
        setNotes("");
        setLocationId("");
        
        // Initialize return items based on data
        let initialItems = [];
        if (data && data.items) {
          initialItems = data.items.map(item => ({
            product_id: item.product?._id || item.product_id || item.product || "",
            product_name: item.product?.name || "Unknown Product",
            max_qty: item.quantity,
            return_qty: 0,
            reason: "",
            condition: "sellable"
          }));
        }
        setReturnItems(initialItems);
      }, 0);
    }
    return () => clearTimeout(t);
  }, [open, data]);

  const handleQtyChange = (index, value) => {
    const newItems = [...returnItems];
    newItems[index].return_qty = Math.min(Math.max(0, Number(value)), newItems[index].max_qty);
    setReturnItems(newItems);
  };

  const handleConditionChange = (index, value) => {
    const newItems = [...returnItems];
    newItems[index].condition = value;
    setReturnItems(newItems);
  };

  const handleReasonChange = (index, value) => {
    const newItems = [...returnItems];
    newItems[index].reason = value;
    setReturnItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const itemsToReturn = returnItems
      .filter(i => i.return_qty > 0)
      .map(i => ({
        product_id: i.product_id._id || i.product_id,
        quantity: i.return_qty,
        reason: i.reason,
        condition: i.condition
      }));

    if (itemsToReturn.length === 0) {
      dialog.error("Please specify at least one item to return with quantity > 0");
      setLoading(false);
      return;
    }

    if (!locationId) {
      dialog.error("Please select a location for the return.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        type,
        sale_id: type === 'customer_return' ? data._id : null,
        supplier_id: type === 'supplier_return' ? data.supplier_id : null,
        location_id: locationId,
        items: itemsToReturn,
        notes
      };

      await createReturn(payload);
      dialog.success("Return processed successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      dialog.error("Failed to process return: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!open || !data) return null;

  const title = type === 'customer_return' ? `Process Customer Return (Sale #${data._id.slice(-8)})` : `Process Supplier Return`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-4xl max-h-[90vh] shadow-xl relative flex flex-col">
        <div className="mb-6 text-center border-b border-gray-100 pb-4">
          <HiOutlineRefresh className="text-3xl text-[#1e3a5f] mx-auto mb-2" />
          <h2 className="text-xl font-bold mb-2 text-center text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">
            Select the items and quantities to return
          </span>
        </div>
        
        <div className="flex-1 overflow-auto px-2 space-y-4">
          {/* Location Selection */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Select Location <sup className="text-red-500">*</sup>
            </label>
            <Listbox value={locationId} onChange={setLocationId}>
              <div className="relative">
                <Listbox.Button className="cursor-pointer w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between">
                  <span className="truncate">
                    {locations.find(l => l._id === locationId)?.name || "Select a Location"}
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
            <p className="text-xs text-gray-500 mt-1">
              {type === 'customer_return' ? "Location to restock the returned items to." : "Location to deduct the returned items from."}
            </p>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <HiOutlineCube /> Return Items
            </h3>
            {returnItems.map((item, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{item.product_name}</p>
                  <p className="text-xs text-gray-500">Max Qty: {item.max_qty}</p>
                </div>
                
                <div className="w-full md:w-24">
                  <label className="text-xs text-gray-500 block mb-1">Return Qty</label>
                  <input
                    type="number"
                    min="0"
                    max={item.max_qty}
                    value={item.return_qty}
                    onChange={(e) => handleQtyChange(idx, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>

                <div className="w-full md:w-32">
                  <label className="text-xs text-gray-500 block mb-1">Condition</label>
                  <select
                    value={item.condition}
                    onChange={(e) => handleConditionChange(idx, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                  >
                    <option value="sellable">Sellable</option>
                    <option value="damaged">Damaged</option>
                    <option value="defective">Defective</option>
                  </select>
                </div>

                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-500 block mb-1">Reason</label>
                  <input
                    type="text"
                    value={item.reason}
                    onChange={(e) => handleReasonChange(idx, e.target.value)}
                    placeholder="Optional reason"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Return Notes
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this return..."
            ></textarea>
          </div>
        </div>
        
        <div className="w-full flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-xl focus:outline-none border border-gray-100 flex items-center gap-2 cursor-pointer text-sm font-medium"
            onClick={onClose}
          >
            <HiXCircle className="text-xl" /> Cancel
          </button>
          <button
            type="button"
            className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm font-medium"
            disabled={loading}
            onClick={handleSubmit}
          >
            <HiOutlineDocumentText className="text-xl" /> Process Return
          </button>
        </div>
      </div>
    </div>
  );
};

ProcessReturnModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
  type: PropTypes.oneOf(['customer_return', 'supplier_return']).isRequired,
  onSuccess: PropTypes.func,
};

export default ProcessReturnModal;

