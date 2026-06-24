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
import { uploadFile } from "../../api";
import { Listbox } from "@headlessui/react";
import DatePicker from "../ui/DatePicker";

import { useAuth } from "../../contexts/auth/useAuth";

const initialExpense = {
  description: "",
  amount: "",
  category: "Other",
  date: new Date().toISOString().split("T")[0],
  receipt_image: "",
  status: "active",
};

const categories = [
  "Rent",
  "Utilities",
  "Salary",
  "Inventory",
  "Marketing",
  "Transport",
  "Other",
];

const ExpenseModal = ({
  open,
  onClose,
  onSave,
  data,
  viewOnly = false,
  onEdit,
}) => {
  const [expense, setExpense] = useState(data || initialExpense);
  const [selectedImage, setSelectedImage] = useState(null);
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  const { user } = useAuth();
  const canUpdate = user?.permission?.permissions?.includes("update_expense");

  useEffect(() => {
    let t;
    if (open) {
      t = setTimeout(() => {
        setExpense(data || initialExpense);
        setSelectedImage(null);
        setTouched({});
        setValidateOnSave(false);
      }, 0);
    }
    return () => clearTimeout(t);
  }, [open, data]);

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      try {
        const res = await uploadFile(file);
        if (res.data?.url) {
          setExpense((prev) => ({ ...prev, receipt_image: res.data.url }));
        }
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }
  }

  let modalTitle;
  if (viewOnly) {
    modalTitle = "Expense Details";
  } else if (expense._id) {
    modalTitle = "Update Expense";
  } else {
    modalTitle = "Add Expense";
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[40%] max-h-[80vh] shadow-xl relative">
        <h2 className="text-xl font-bold mb-6 text-center">{modalTitle}</h2>
        <form className="space-y-5 overflow-auto max-h-[50vh] px-1">
          <div className="col-span-2 mb-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiOutlineDocumentText className="inline-block text-xl text-gray-900" />
              <span>Expense Details</span>
            </h3>
            <div className="mb-3 grid grid-cols-1 gap-3">
              <div>
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  Description
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <input
                  id="description"
                  name="description"
                  value={expense.description}
                  onChange={(e) =>
                    setExpense({ ...expense, description: e.target.value })
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, description: true }))
                  }
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!expense.description && !data && (touched.description || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                  disabled={viewOnly}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="amount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Amount
                    {!viewOnly && <sup className="text-red-500">*</sup>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      id="amount"
                      name="amount"
                      value={expense.amount}
                      onChange={(e) =>
                        setExpense({ ...expense, amount: e.target.value })
                      }
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, amount: true }))
                      }
                      type={viewOnly ? "text" : "number"}
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full bg-gray-50 border rounded-lg pl-7 pr-3 py-2 text-sm text-gray-800 ${(!expense.amount || Number.isNaN(Number(expense.amount))) && !data && (touched.amount || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                      disabled={viewOnly}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="category"
                    className="text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>
                  <Listbox
                    value={
                      categories.find((cat) => cat._id === expense.category) ||
                      null
                    }
                    onChange={
                      viewOnly
                        ? () => {}
                        : (cat) =>
                            setExpense({
                              ...expense,
                              category: cat,
                            })
                    }
                    disabled={viewOnly}
                  >
                    <div className="relative">
                      <Listbox.Button
                        id="category"
                        className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between ${viewOnly ? "cursor-default" : "cursor-pointer"} ${!expense.category && !data && (touched.category || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                        disabled={viewOnly}
                      >
                        <span>{expense.category || "Select category"}</span>
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
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                >
                                  {cat}
                                </span>
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>
              </div>
              <div>
                <label
                  htmlFor="date"
                  className="text-sm font-medium text-gray-700"
                >
                  Date
                </label>
                <DatePicker
                  id="date"
                  selected={expense.date}
                  onChange={(date) =>
                    setExpense((prev) => ({
                      ...prev,
                      date: date ? date.toISOString().split("T")[0] : "",
                    }))
                  }
                  viewOnly={viewOnly}
                  placeholder="Date"
                />
              </div>
            </div>
          </div>
          {(!viewOnly || expense.receipt_image) && (
            <div className="col-span-2 mb-2">
              <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
                <HiOutlineCamera className="inline-block text-xl text-gray-900" />
                <span>Receipt</span>
              </h3>
              <div className="mb-3">
                <div className="border-2 border-dashed border-gray-100 rounded-lg p-6 flex flex-col items-center justify-center transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,application/pdf"
                    className="hidden"
                    id="receipt-upload"
                    onChange={handleImageChange}
                    disabled={viewOnly}
                  />
                  <label
                    htmlFor="receipt-upload"
                    className={`flex flex-col items-center w-full h-full ${viewOnly ? "cursor-default opacity-60" : "cursor-pointer"}`}
                    style={viewOnly ? { pointerEvents: "none" } : {}}
                  >
                    <HiOutlineUpload className="text-4xl text-gray-400 mb-2" />
                    <span className="text-gray-500">Upload Receipt</span>
                  </label>
                  {(selectedImage || expense.receipt_image) && (
                    <div className="mt-2 flex items-center">
                      <img
                        src={
                          selectedImage
                            ? URL.createObjectURL(selectedImage)
                            : expense.receipt_image
                        }
                        alt="Receipt Preview"
                        className="h-40 w-auto object-contain rounded mr-2"
                      />
                    </div>
                  )}
                </div>
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
                setTouched({ description: true, amount: true });
                if (
                  !expense.description ||
                  expense.description.trim() === "" ||
                  !expense.amount ||
                  isNaN(Number(expense.amount))
                ) {
                  return;
                }
                onSave(expense);
              }}
            >
              <HiOutlineDocumentText className="inline-block text-xl" />
              {expense._id ? "Update Expense" : "Add Expense"}
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

ExpenseModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  data: PropTypes.object,
  viewOnly: PropTypes.bool,
  onEdit: PropTypes.func,
};

export default ExpenseModal;

