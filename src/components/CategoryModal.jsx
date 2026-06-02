import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  HiXCircle,
  HiOutlineDocumentText,
  HiOutlinePencil,
} from "react-icons/hi";

import { useAuth } from "../contexts/auth/useAuth";

const initialCategory = {
  name: "",
  description: "",
  status: "active",
};

const CategoryModal = ({
  open,
  onClose,
  onSave,
  data,
  viewOnly = false,
  onEdit,
}) => {
  const [category, setCategory] = useState(data || initialCategory);
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  const { user } = useAuth();
  const canUpdate = user?.permission?.permissions?.includes("update_category");

  // Reset form when modal opens or closes
  React.useEffect(() => {
    if (open && !data) {
      setCategory(initialCategory);
      setTouched({});
      setValidateOnSave(false);
    } else if (open && data) {
      setCategory(data);
      setTouched({});
      setValidateOnSave(false);
    }
  }, [open, data]);

  // Reset state when modal closes
  function handleClose() {
    setCategory(initialCategory);
    setTouched({});
    setValidateOnSave(false);
    onClose();
  }

  if (!open) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setCategory((prev) => ({ ...prev, [name]: value }));
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setValidateOnSave(true);
    if (!category.name) return;
    onSave(category);
    handleClose();
  }

  let modalTitle = "";
  if (viewOnly) {
    modalTitle = "Category Details";
  } else if (data) {
    modalTitle = "Update Category";
  } else {
    modalTitle = "Add Category";
  }

  let buttonLabel = "";
  if (viewOnly) {
    buttonLabel = "Category Details";
  } else if (category._id) {
    buttonLabel = "Update Category";
  } else {
    buttonLabel = "Add Category";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[30%] max-h-[80vh] shadow-xl relative">
        <h2 className="text-xl font-bold mb-6 text-center">{modalTitle}</h2>
        <form className="space-y-5 overflow-auto max-h-[50vh] px-1">
          <div>
            <label
              htmlFor="category-name"
              className="text-sm font-medium text-gray-7 00"
            >
              Name
              {!viewOnly && <sup className="text-red-500">*</sup>}
            </label>
            <input
              id="category-name"
              name="name"
              value={category.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Category name"
              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!category.name && !data && (touched.name || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
              required
              disabled={viewOnly}
            />
          </div>
          <div>
            <label
              htmlFor="category-description"
              className="text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="category-description"
              name="description"
              value={category.description}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Description (optional)"
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-gray-800"
              rows={3}
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
              type="button"
              className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
              onClick={handleSubmit}
            >
              <HiOutlineDocumentText className="inline-block text-xl" />
              {buttonLabel}
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

CategoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  data: PropTypes.object,
  viewOnly: PropTypes.bool,
  onEdit: PropTypes.func,
};

export default CategoryModal;
