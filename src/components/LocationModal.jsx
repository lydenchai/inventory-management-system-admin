import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  HiXCircle,
  HiOutlineDocumentText,
  HiOutlinePencil,
} from "react-icons/hi";


const initialLocation = {
  name: "",
  address: "",
  status: "active",
};

const LocationModal = ({
  open,
  onClose,
  onSave,
  data,
  viewOnly = false,
  onEdit,
}) => {
  const [location, setLocation] = useState(data || initialLocation);
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  // We can just reuse category permissions for now or assume admin can edit
  const canUpdate = true; 

  React.useEffect(() => {
    if (open && !data) {
      setLocation(initialLocation);
      setTouched({});
      setValidateOnSave(false);
    } else if (open && data) {
      setLocation(data);
      setTouched({});
      setValidateOnSave(false);
    }
  }, [open, data]);

  function handleClose() {
    setLocation(initialLocation);
    setTouched({});
    setValidateOnSave(false);
    onClose();
  }

  if (!open) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setLocation((prev) => ({ ...prev, [name]: value }));
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setValidateOnSave(true);
    if (!location.name) return;
    onSave(location);
    handleClose();
  }

  let modalTitle = "";
  if (viewOnly) {
    modalTitle = "Location Details";
  } else if (data) {
    modalTitle = "Update Location";
  } else {
    modalTitle = "Add Location";
  }

  let buttonLabel = "";
  if (viewOnly) {
    buttonLabel = "Location Details";
  } else if (location._id) {
    buttonLabel = "Update Location";
  } else {
    buttonLabel = "Add Location";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[30%] max-h-[80vh] shadow-xl relative">
        <h2 className="text-xl font-bold mb-6 text-center">{modalTitle}</h2>
        <form className="space-y-5 overflow-auto max-h-[50vh] px-1">
          <div>
            <label
              htmlFor="location-name"
              className="text-sm font-medium text-gray-700"
            >
              Name
              {!viewOnly && <sup className="text-red-500">*</sup>}
            </label>
            <input
              id="location-name"
              name="name"
              value={location.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Warehouse / Store Name"
              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!location.name && !data && (touched.name || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
              required
              disabled={viewOnly}
            />
          </div>
          <div>
            <label
              htmlFor="location-address"
              className="text-sm font-medium text-gray-700"
            >
              Address
            </label>
            <textarea
              id="location-address"
              name="address"
              value={location.address}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Full Address"
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

LocationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  data: PropTypes.object,
  viewOnly: PropTypes.bool,
  onEdit: PropTypes.func,
};

export default LocationModal;
