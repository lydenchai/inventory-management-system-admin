import React, { useState } from "react";
import PropTypes from "prop-types";
import { Listbox } from "@headlessui/react";
import { HiSelector } from "react-icons/hi";
import {
  HiXCircle,
  HiOutlineDocumentText,
  HiOutlineOfficeBuilding,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlinePencil,
} from "react-icons/hi";
import { locations } from "../data/locations";
import { useAuth } from "../contexts/auth/useAuth";

const statuses = [
  { _id: 1, name: "Active" },
  { _id: 2, name: "Inactive" },
  { _id: 3, name: "Pending" },
];

const initialSupplier = {
  company_name: "",
  location: "",
  contact_person: "",
  contact_position: "",
  contact_email: "",
  contact_phone: "",
  address: {
    street: "",
    house: "",
    village: "",
    commune: "",
    district: "",
    province: "",
  },
  status: statuses[0].name,
};

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const SupplierModal = ({
  open,
  onClose,
  onSave,
  data,
  viewOnly = false,
  onEdit,
}) => {
  const [supplier, setSupplier] = useState(data || initialSupplier);
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  const { user } = useAuth();
  const canUpdate = getPermission(user, "update_supplier");

  // Reset form when modal opens or closes
  React.useEffect(() => {
    let t;
    if (open && !data) {
      t = setTimeout(() => {
        setSupplier(initialSupplier);
        setTouched({});
        setValidateOnSave(false);
      }, 0);
    } else if (open && data) {
      t = setTimeout(() => {
        setSupplier(data);
        setTouched({});
        setValidateOnSave(false);
      }, 0);
    }
    return () => clearTimeout(t);
  }, [open, data]);

  const handleProvinceChange = (provinceName) => {
    setSupplier((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        province: provinceName,
        district: "",
        commune: "",
      },
    }));
  };

  const handleDistrictChange = (districtName) => {
    setSupplier((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        district: districtName,
        commune: "",
      },
    }));
  };

  const handleCommuneChange = (communeName) => {
    setSupplier((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        commune: communeName,
        village: "",
      },
    }));
  };

  const handleVillageChange = (villageName) => {
    setSupplier((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        village: villageName,
      },
    }));
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[40%] max-h-[80vh] shadow-xl relative">
        <h2 className="text-xl font-bold mb-6 text-center">
          {viewOnly
            ? "Supplier Details"
            : data
              ? "Update Supplier"
              : "Add Supplier"}
        </h2>
        <form className="space-y-5 overflow-auto max-h-[50vh] px-1">
          <div className="col-span-2 mb-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiOutlineOfficeBuilding className="inline-block text-xl text-black" />
              <span>Company Info</span>
            </h3>
            <div className="mb-3 grid lg:grid-cols-2 md:grid-cols-1 gap-3">
              <div>
                <label
                  htmlFor="company_name"
                  className="text-sm font-medium text-gray-700"
                >
                  Company Name
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <input
                  id="company_name"
                  name="company_name"
                  value={supplier.company_name}
                  onChange={(e) =>
                    setSupplier({ ...supplier, company_name: e.target.value })
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, company_name: true }))
                  }
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!supplier.company_name && !data && (touched.company_name || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                  disabled={viewOnly}
                />
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="text-sm font-medium text-gray-700"
                >
                  Location
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <input
                  id="location"
                  name="location"
                  value={supplier.location}
                  onChange={(e) =>
                    setSupplier({ ...supplier, location: e.target.value })
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, location: true }))
                  }
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!supplier.location && !data && (touched.location || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                  disabled={viewOnly}
                />
              </div>
            </div>
          </div>
          {canUpdate && (
            <div className="col-span-2 mb-2">
              <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
                <HiOutlineUser className="inline-block text-xl text-black" />
                <span>Primary Contact Details</span>
              </h3>
              <div className="mb-3 grid lg:grid-cols-2 md:grid-cols-1 gap-3">
                <div>
                  <label
                    htmlFor="contact_person"
                    className="text-sm font-medium text-gray-700"
                  >
                    Contact Person
                    {!viewOnly && <sup className="text-red-500">*</sup>}
                  </label>
                  <input
                    id="contact_person"
                    name="contact_person"
                    value={supplier.contact_person}
                    onChange={(e) =>
                      setSupplier({
                        ...supplier,
                        contact_person: e.target.value,
                      })
                    }
                    onBlur={() =>
                      setTouched((prev) => ({
                        ...prev,
                        contact_person: true,
                      }))
                    }
                    className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!supplier.contact_person && !data && (touched.contact_person || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    disabled={viewOnly}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact_position"
                    className="text-sm font-medium text-gray-700"
                  >
                    Role/Position
                    {!viewOnly && <sup className="text-red-500">*</sup>}
                  </label>
                  <input
                    id="contact_position"
                    name="contact_position"
                    value={supplier.contact_position}
                    onChange={(e) =>
                      setSupplier({
                        ...supplier,
                        contact_position: e.target.value,
                      })
                    }
                    onBlur={() =>
                      setTouched((prev) => ({
                        ...prev,
                        contact_position: true,
                      }))
                    }
                    className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!supplier.contact_position && !data && (touched.contact_position || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    disabled={viewOnly}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact_email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                    {!viewOnly && <sup className="text-red-500">*</sup>}
                  </label>
                  <input
                    id="contact_email"
                    name="contact_email"
                    value={supplier.contact_email}
                    onChange={(e) =>
                      setSupplier({
                        ...supplier,
                        contact_email: e.target.value,
                      })
                    }
                    onBlur={() =>
                      setTouched((prev) => ({
                        ...prev,
                        contact_email: true,
                      }))
                    }
                    className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!supplier.contact_email && !data && (touched.contact_email || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    disabled={viewOnly}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact_phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Phone Number
                    {!viewOnly && <sup className="text-red-500">*</sup>}
                  </label>
                  <input
                    id="contact_phone"
                    name="contact_phone"
                    value={supplier.contact_phone}
                    onChange={(e) =>
                      setSupplier({
                        ...supplier,
                        contact_phone: e.target.value,
                      })
                    }
                    onBlur={() =>
                      setTouched((prev) => ({
                        ...prev,
                        contact_phone: true,
                      }))
                    }
                    className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!supplier.contact_phone && !data && (touched.contact_phone || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    disabled={viewOnly}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="col-span-2 mb-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiOutlineLocationMarker className="inline-block text-xl text-black" />
              <span>Address</span>
            </h3>
            <div className="mb-3 grid lg:grid-cols-2 md:grid-cols-1 gap-3">
              <div>
                <label
                  htmlFor="province"
                  className="text-sm font-medium text-gray-700"
                >
                  City/Province
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <Listbox
                  value={supplier.address.province}
                  onChange={handleProvinceChange}
                  disabled={viewOnly}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="province"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-black flex items-center justify-between ${viewOnly ? "cursor-default" : "cursor-pointer"} ${!supplier.address.province && !data && (touched.province || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    >
                      <span>{supplier.address.province}</span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {locations.map((province) => (
                        <Listbox.Option
                          key={province.name}
                          value={province.name}
                          className={({ selected }) =>
                            `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                          }
                        >
                          {province.name}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label
                  htmlFor="district"
                  className="text-sm font-medium text-gray-700"
                >
                  District
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <Listbox
                  value={supplier.address.district}
                  onChange={handleDistrictChange}
                  disabled={viewOnly || !supplier.address.province}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="district"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-black flex items-center justify-between ${viewOnly ? "cursor-default" : "cursor-pointer"} ${!supplier.address.district && !data && (touched.district || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    >
                      <span>{supplier.address.district}</span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {locations
                        .find((p) => p.name === supplier.address.province)
                        ?.districts.map((district) => (
                          <Listbox.Option
                            key={district.name}
                            value={district.name}
                            className={({ selected }) =>
                              `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                            }
                          >
                            {district.name}
                          </Listbox.Option>
                        ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label
                  htmlFor="commune"
                  className="text-sm font-medium text-gray-700"
                >
                  Commune
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <Listbox
                  value={supplier.address.commune}
                  onChange={handleCommuneChange}
                  disabled={viewOnly || !supplier.address.district}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="commune"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-black flex items-center justify-between ${viewOnly ? "cursor-default" : "cursor-pointer"} ${!supplier.address.commune && !data && (touched.commune || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    >
                      <span>{supplier.address.commune}</span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {locations
                        .find((p) => p.name === supplier.address.province)
                        ?.districts.find(
                          (d) => d.name === supplier.address.district,
                        )
                        ?.communes.map((commune) => (
                          <Listbox.Option
                            key={commune.name}
                            value={commune.name}
                            className={({ selected }) =>
                              `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                            }
                          >
                            {commune.name}
                          </Listbox.Option>
                        ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label
                  htmlFor="village"
                  className="text-sm font-medium text-gray-700"
                >
                  Village
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <Listbox
                  value={supplier.address.village}
                  onChange={handleVillageChange}
                  disabled={viewOnly || !supplier.address.commune}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="village"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-black flex items-center justify-between ${viewOnly ? "cursor-default" : "cursor-pointer"} ${!supplier.address.village && !data && (touched.village || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    >
                      <span>{supplier.address.village}</span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {locations
                        .find((p) => p.name === supplier.address.province)
                        ?.districts.find(
                          (d) => d.name === supplier.address.district,
                        )
                        ?.communes.find(
                          (c) => c.name === supplier.address.commune,
                        )
                        ?.villages.map((village) => (
                          <Listbox.Option
                            key={village}
                            value={village}
                            className={({ selected }) =>
                              `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                            }
                          >
                            {village}
                          </Listbox.Option>
                        ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label
                  htmlFor="house"
                  className="text-sm font-medium text-gray-700"
                >
                  House
                </label>
                <input
                  id="house"
                  type="text"
                  className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                  value={supplier.address.house}
                  onChange={(e) =>
                    setSupplier({
                      ...supplier,
                      address: {
                        ...supplier.address,
                        house: e.target.value,
                      },
                    })
                  }
                  disabled={viewOnly}
                />
              </div>
              <div>
                <label
                  htmlFor="street"
                  className="text-sm font-medium text-gray-700"
                >
                  Street
                </label>
                <input
                  id="street"
                  className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                  value={supplier.address.street}
                  onChange={(e) =>
                    setSupplier({
                      ...supplier,
                      address: {
                        ...supplier.address,
                        street: e.target.value,
                      },
                    })
                  }
                  disabled={viewOnly}
                />
              </div>
            </div>
          </div>
          {canUpdate && (
            <div className="col-span-2 mb-2">
              <div className="mb-3 grid lg:grid-cols-2 md:grid-cols-1 gap-3">
                <div>
                  <label
                    htmlFor="supplierStatus"
                    className="text-sm font-medium text-gray-700"
                  >
                    Supplier Status
                    {!viewOnly && <sup className="text-red-500">*</sup>}
                  </label>
                  <Listbox
                    value={
                      statuses.find((st) => st.name === supplier.status) || null
                    }
                    onChange={
                      viewOnly
                        ? () => {}
                        : (st) =>
                            setSupplier({
                              ...supplier,
                              status: st ? st.name : "",
                            })
                    }
                    disabled={viewOnly}
                  >
                    <div className="relative">
                      <Listbox.Button
                        id="supplierStatus"
                        className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-black flex items-center justify-between ${viewOnly ? "cursor-default" : "cursor-pointer"} ${!supplier.status && !data && (touched.status || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                        disabled={viewOnly}
                      >
                        <span>
                          {statuses.find((st) => st.name === supplier.status)
                            ?.name || "Select status"}
                        </span>
                        {!viewOnly && (
                          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                        )}
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                        {statuses.length === 0 && (
                          <div className="px-4 py-2 text-gray-400">
                            No statuses
                          </div>
                        )}
                        {statuses.map((st) => (
                          <Listbox.Option
                            key={st._id}
                            value={st}
                            className={({ selected }) =>
                              `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-black hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                            }
                          >
                            {st.name}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
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
                setTouched({
                  company_name: true,
                  location: true,
                  contact_person: true,
                  contact_position: true,
                  contact_email: true,
                  contact_phone: true,
                  province: true,
                  district: true,
                  commune: true,
                  village: true,
                  status: true,
                });
                if (
                  !supplier.company_name ||
                  supplier.company_name.trim() === "" ||
                  !supplier.location ||
                  supplier.location.trim() === "" ||
                  !supplier.contact_person ||
                  supplier.contact_person.trim() === "" ||
                  !supplier.contact_position ||
                  supplier.contact_position.trim() === "" ||
                  !supplier.contact_email ||
                  supplier.contact_email.trim() === "" ||
                  !supplier.contact_phone ||
                  supplier.contact_phone.trim() === "" ||
                  !supplier.address.province ||
                  supplier.address.province.trim() === "" ||
                  !supplier.address.district ||
                  supplier.address.district.trim() === "" ||
                  !supplier.address.commune ||
                  supplier.address.commune.trim() === "" ||
                  !supplier.address.village ||
                  supplier.address.village.trim() === "" ||
                  !supplier.status ||
                  supplier.status.trim() === ""
                ) {
                  return;
                }
                onSave(supplier);
              }}
            >
              <HiOutlineDocumentText className="inline-block text-xl" />
              {data ? "Update Supplier" : "Add Supplier"}
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

SupplierModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  data: PropTypes.object,
  viewOnly: PropTypes.bool,
  onEdit: PropTypes.func,
};

export default SupplierModal;
