import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Listbox } from "@headlessui/react";
import { getPermissions, uploadFile } from "../api/index";
import {
  HiXCircle,
  HiOutlineDocumentText,
  HiOutlineLocationMarker,
  HiOutlineKey,
  HiOutlineCamera,
  HiOutlineUpload,
  HiEye,
  HiEyeOff,
  HiOutlineBriefcase,
  HiOutlineIdentification,
  HiSelector,
  HiOutlinePencil,
} from "react-icons/hi";
import { locations } from "../data/locations";
import LocationPicker from "./LocationPicker";

const initial = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "",
  phone: "",
  status: "active",
  address: {
    street: "",
    house: "",
    village: "",
    commune: "",
    district: "",
    province: "",
  },
  profile: "",
  user_type: "internal",
  company_name: "",
  position: "",
  company_registration_no: "",
  request_purpose: "",
  expected_order_volume: "",
  order_frequency: "",
  product_categories: [],
  id_card_or_business_license: "",
  shop_photo: "",
  location_lat: null,
  location_lng: null,
  note_from_customer: "",
};

const UserModal = ({
  open,
  onClose,
  onSave,
  data,
  viewOnly = false,
  onEdit,
}) => {
  const computedInitialUser = React.useMemo(() => {
    if (data && !data._id) {
      return { ...initial, ...data };
    }
    return data || initial;
  }, [data]);

  const [user, setUser] = useState(() => computedInitialUser);
  const [touched, setTouched] = useState({});
  const [validateOnSave, setValidateOnSave] = useState(false);
  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const isPartner = user.user_type === "external";

  // Fetch roles when modal opens
  useEffect(() => {
    if (open) {
      getPermissions({ limit: -1 }).then((res) => {
        if (Array.isArray(res.data)) {
          setRoles(res.data);
        } else if (Array.isArray(res.data?.data)) {
          setRoles(res.data.data);
        } else {
          setRoles([]);
        }
      });
    }
  }, [open]);

  // Update local state when data changes (e.g. when opening "View" for a different user)
  useEffect(() => {
    if (data && !data._id) {
      const t = setTimeout(() => setUser({ ...initial, ...data }), 0);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setUser(data || initial), 0);
      return () => clearTimeout(t);
    }
  }, [data]);

  async function handleImageChange(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const res = await uploadFile(file);
        const url = res.data?.url || res.data?.file?.url;
        if (url) {
          setUser((prev) => ({ ...prev, profile: url }));
        }
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }
  }

  const handleProvinceChange = (provinceName) => {
    setUser((prev) => ({
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
    setUser((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        district: districtName,
        commune: "",
      },
    }));
  };

  const handleCommuneChange = (communeName) => {
    setUser((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        commune: communeName,
        village: "",
      },
    }));
  };

  const handleVillageChange = (villageName) => {
    setUser((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        village: villageName,
      },
    }));
  };

  const renderBadge = (text, key) => (
    <span
      key={key}
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#f1f5f9] text-[#1e3a5f] border border-gray-200 shadow-sm transition-all duration-300 hover:bg-[#e2e8f0]"
    >
      {text}
    </span>
  );

  const renderImagePreview = (url, label) => {
    if (!url) return null;
    return (
      <div className="flex flex-col items-center">
        <span className="text-sm text-gray-500 mb-1">{label}</span>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt={label}
            className="h-40 w-40 object-cover rounded transition-all duration-300 hover:scale-101"
          />
        </a>
      </div>
    );
  };

  // Extract modal title logic
  let modalTitle = "Add User";
  if (viewOnly) {
    modalTitle = "User Details";
  } else if (data?._id) {
    modalTitle = "Update User";
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[50vw] max-h-[90vh] shadow-xl relative flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-center shrink-0">
          {modalTitle}
        </h2>
        <form
          key={data ? data._id : "new"}
          className="space-y-6 overflow-y-auto px-4 grow custom-scrollbar"
        >
          {/* Basic Info */}
          <div className="col-span-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiOutlineDocumentText className="inline-block text-xl" />
              <span>Basic Information</span>
            </h3>
            <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="first-name"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  First Name
                  {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <input
                  id="first-name"
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!user.first_name && (touched.first_name || validateOnSave) ? "border-red-500" : "border-gray-200"}`}
                  value={user.first_name}
                  onChange={(e) =>
                    setUser({ ...user, first_name: e.target.value })
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, first_name: true }))
                  }
                  required
                  disabled={viewOnly}
                />
              </div>
              <div>
                <label
                  htmlFor="last-name"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  Last Name {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <input
                  id="last-name"
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!user.last_name && (touched.last_name || validateOnSave) ? "border-red-500" : "border-gray-200"}`}
                  value={user.last_name}
                  onChange={(e) =>
                    setUser({ ...user, last_name: e.target.value })
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, last_name: true }))
                  }
                  required
                  disabled={viewOnly}
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  Email {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <input
                  id="email"
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!user.email && (touched.email || validateOnSave) ? "border-red-500" : "border-gray-200"}`}
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, email: true }))
                  }
                  required
                  disabled={viewOnly}
                />
              </div>
              {!data && (
                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700 block mb-1"
                  >
                    Password
                    {!viewOnly && <sup className="text-red-500">*</sup>}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!user.password && !data && (touched.password || validateOnSave) ? "border-red-500" : "border-gray-200"}`}
                      type={showPassword ? "text" : "password"}
                      value={user.password || ""}
                      onChange={(e) =>
                        setUser({ ...user, password: e.target.value })
                      }
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, password: true }))
                      }
                      required
                      minLength={8}
                      disabled={viewOnly}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <HiEyeOff className="w-5 h-5" />
                      ) : (
                        <HiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact & Role */}
          <div className="col-span-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiOutlineKey className="inline-block text-xl" />
              <span>Contact & Role</span>
            </h3>
            <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="userType"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  User Type {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <Listbox
                  value={user.user_type}
                  onChange={(val) => setUser({ ...user, user_type: val })}
                  disabled={viewOnly}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="userType"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between border-gray-200 ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className="capitalize">{user.user_type}</span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {["internal", "external"].map((type) => (
                        <Listbox.Option
                          key={type}
                          value={type}
                          className={({ selected }) =>
                            `px-3 py-2 cursor-pointer text-[#64748b] text-sm capitalize hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                          }
                        >
                          {type}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label
                  htmlFor="role"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  Role {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <Listbox
                  value={roles.find((role) => role.name === user.role) || null}
                  onChange={(role) =>
                    setUser({
                      ...user,
                      role: role ? role.name : "",
                      permission_id: role ? role._id : "",
                    })
                  }
                  disabled={viewOnly}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="role"
                      className={`${viewOnly ? "cursor-default" : "cursor-pointer"} w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between ${!user.role && (touched.role || validateOnSave) ? "border-red-500" : "border-gray-100"}`}
                    >
                      <span>
                        {roles.find((role) => role.name === user.role)?.name ||
                          "Select role"}
                      </span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {roles.map((role) => (
                        <Listbox.Option
                          key={role._id || role.id}
                          value={role}
                          className={({ selected }) =>
                            `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                          }
                        >
                          {role.name}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  Phone {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <input
                  id="phone"
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 ${!user.phone && (touched.phone || validateOnSave) ? "border-red-500" : "border-gray-200"}`}
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, phone: true }))
                  }
                  disabled={viewOnly}
                />
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  Status {!viewOnly && <sup className="text-red-500">*</sup>}
                </label>
                <Listbox
                  value={user.status}
                  onChange={(val) => setUser({ ...user, status: val })}
                  disabled={viewOnly}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="status"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between border-gray-200 ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className="capitalize">{user.status}</span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {["active", "inactive", "pending"].map((status) => (
                        <Listbox.Option
                          key={status}
                          value={status}
                          className={({ selected }) =>
                            `px-3 py-2 cursor-pointer text-[#64748b] text-sm capitalize hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
                          }
                        >
                          {status}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="col-span-2">
            <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
              <HiOutlineLocationMarker className="inline-block text-xl" />
              <span>Address</span>
            </h3>
            <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="province"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  City/Province
                </label>
                <Listbox
                  value={user.address.province}
                  onChange={handleProvinceChange}
                  disabled={viewOnly}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="province"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between border-gray-200 ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span>{user.address.province}</span>
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
                            `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
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
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  District
                </label>
                <Listbox
                  value={user.address.district}
                  onChange={handleDistrictChange}
                  disabled={viewOnly || !user.address.province}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="district"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between border-gray-200 ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span>{user.address.district}</span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {locations
                        .find((p) => p.name === user.address.province)
                        ?.districts.map((district) => (
                          <Listbox.Option
                            key={district.name}
                            value={district.name}
                            className={({ selected }) =>
                              `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
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
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  Commune
                </label>
                <Listbox
                  value={user.address.commune}
                  onChange={handleCommuneChange}
                  disabled={viewOnly || !user.address.district}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="commune"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between border-gray-200 ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span>{user.address.commune}</span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {locations
                        .find((p) => p.name === user.address.province)
                        ?.districts.find(
                          (d) => d.name === user.address.district,
                        )
                        ?.communes.map((commune) => (
                          <Listbox.Option
                            key={commune.name}
                            value={commune.name}
                            className={({ selected }) =>
                              `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
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
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  Village
                </label>
                <Listbox
                  value={user.address.village}
                  onChange={handleVillageChange}
                  disabled={viewOnly || !user.address.commune}
                >
                  <div className="relative">
                    <Listbox.Button
                      id="village"
                      className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between border-gray-200 ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span>{user.address.village}</span>
                      {!viewOnly && (
                        <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                      )}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                      {locations
                        .find((p) => p.name === user.address.province)
                        ?.districts.find(
                          (d) => d.name === user.address.district,
                        )
                        ?.communes.find((c) => c.name === user.address.commune)
                        ?.villages.map((village) => (
                          <Listbox.Option
                            key={village}
                            value={village}
                            className={({ selected }) =>
                              `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
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
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  House
                </label>
                <input
                  id="house"
                  type="text"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
                  value={user.address.house}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      address: { ...user.address, house: e.target.value },
                    })
                  }
                  disabled={viewOnly}
                />
              </div>
              <div>
                <label
                  htmlFor="street"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  Street
                </label>
                <input
                  id="street"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
                  value={user.address.street}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      address: { ...user.address, street: e.target.value },
                    })
                  }
                  disabled={viewOnly}
                />
              </div>
            </div>
          </div>

          {/* Partner Information Section */}
          {isPartner && (
            <div className="col-span-2">
              <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
                <HiOutlineBriefcase className="inline-block text-xl" />
                <span>Partner Information</span>
              </h3>
              <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-4">
                <div>
                  <label
                    htmlFor="companyName"
                    className="text-sm font-medium text-gray-700 block mb-1"
                  >
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none"
                    value={user.company_name || ""}
                    onChange={(e) => setUser({ ...user, company_name: e.target.value })}
                    disabled={viewOnly}
                  />
                </div>
                <div>
                  <label
                    htmlFor="regNo"
                    className="text-sm font-medium text-gray-700 block mb-1"
                  >
                    Reg No.
                  </label>
                  <input
                    id="regNo"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none"
                    value={user.company_registration_no || ""}
                    onChange={(e) => setUser({ ...user, company_registration_no: e.target.value })}
                    disabled={viewOnly}
                  />
                </div>
                <div>
                  <label
                    htmlFor="requestPurpose"
                    className="text-sm font-medium text-gray-700 block mb-1"
                  >
                    Request Purpose
                  </label>
                  <input
                    id="requestPurpose"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none"
                    value={user.request_purpose || ""}
                    onChange={(e) => setUser({ ...user, request_purpose: e.target.value })}
                    disabled={viewOnly}
                  />
                </div>
                <div>
                  <label
                    htmlFor="expectedVolume"
                    className="text-sm font-medium text-gray-700 block mb-1"
                  >
                    Expected Volume
                  </label>
                  <input
                    id="expectedVolume"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none"
                    value={user.expected_order_volume || ""}
                    onChange={(e) => setUser({ ...user, expected_order_volume: e.target.value })}
                    disabled={viewOnly}
                  />
                </div>
                <div>
                  <label
                    htmlFor="orderFrequency"
                    className="text-sm font-medium text-gray-700 block mb-1"
                  >
                    Order Frequency
                  </label>
                  <input
                    id="orderFrequency"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none"
                    value={user.order_frequency || ""}
                    onChange={(e) => setUser({ ...user, order_frequency: e.target.value })}
                    disabled={viewOnly}
                  />
                </div>
                <div>
                  <label
                    htmlFor="productCategories"
                    className="text-sm font-medium text-gray-700 block mb-2"
                  >
                    Product Categories
                  </label>
                  <div className="w-full flex flex-wrap gap-2">
                    {Array.isArray(user.product_categories) &&
                    user.product_categories.length > 0 ? (
                      user.product_categories.map((cat, index) =>
                        renderBadge(cat, index),
                      )
                    ) : (
                      <span className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-full text-center italic">
                        No categories assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="customerNote"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  Customer Note
                </label>
                <p
                  id="customerNote"
                  className="text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-200"
                >
                  {user.note_from_customer || "-"}
                </p>
              </div>
            </div>
          )}

          {/* Verification Documents Section */}
          {isPartner &&
            (user.id_card_or_business_license ||
              user.shop_photo ||
              (user.location_lat && user.location_lng)) && (
              <>
                <div className="col-span-2">
                  <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
                    <HiOutlineIdentification className="inline-block text-xl" />
                    <span>Verification Documents</span>
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    {renderImagePreview(
                      user.id_card_or_business_license,
                      "ID/License",
                    )}
                    {renderImagePreview(user.shop_photo, "Shop Photo")}
                  </div>
                </div>
                <div className="col-span-2">
                  <h3 className="flex items-center gap-2 text-base mb-3 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
                    <HiOutlineLocationMarker className="inline-block text-xl" />
                    <span>Location</span>
                  </h3>
                  {user.location_lat && user.location_lng && (
                    <div className="flex flex-col w-full mt-4">
                      <LocationPicker
                        initialPosition={{
                          lat: user.location_lat,
                          lng: user.location_lng,
                        }}
                        readOnly={true}
                        onLocationSelect={() => {}}
                      />
                      <div className="mt-2 text-sm text-gray-500">
                        Coordinates: {user.location_lat}, {user.location_lng}
                        <a
                          href={`https://www.google.com/maps?q=${user.location_lat},${user.location_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 underline text-[#1e3a5f] hover:text-[#1e3a5f]"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          {/* Profile Image (Existing) */}
          {(!viewOnly || user.profile || user.user_type === "internal") && (
            <div className="col-span-2 mb-2">
              <h3 className="flex items-center gap-2 text-base mb-2 text-[#1e3a5f] font-semibold border-b border-gray-100 pb-2">
                <HiOutlineCamera className="inline-block text-xl" />
                <span>Profile Image</span>
              </h3>
              <div className="mb-3">
                {viewOnly ? (
                  <div className="mt-2 flex items-center justify-center border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <a
                      href={user.profile}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={user.profile}
                        alt="Profile"
                        className="h-40 w-40 object-cover rounded transition-all duration-300 hover:scale-101"
                      />
                    </a>
                  </div>
                ) : (
                  <label
                    htmlFor="profile"
                    className="cursor-pointer relative group h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-lg p-6 hover:bg-gray-50 transition w-full"
                  >
                    {user.profile ? (
                      <div className="relative w-40 h-40">
                        <a
                          href={user.profile}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={user.profile}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-md transition-all duration-300 hover:scale-101"
                          />
                        </a>
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                          <span className="text-xs font-medium">
                            Click to Change
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <HiOutlineUpload className="text-4xl text-gray-400 mb-2" />
                        <span className="text-gray-500">
                          Drag and drop your image here, or{" "}
                          <span className="text-[#1e3a5f] underline ml-1">
                            browse files
                          </span>
                        </span>
                        <span className="text-sm text-gray-400 mt-1">
                          Supported formats: JPG, PNG, GIF (Max 5MB)
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      id="profile"
                      accept="image/jpeg,image/png,image/gif"
                      className="hidden"
                      onChange={handleImageChange}
                      disabled={viewOnly}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </form>
        <div className="col-span-2 w-full flex items-center justify-end gap-3 mt-4 shrink-0 pt-4 border-t border-gray-100">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-[#1e3a5f] px-6 py-2 rounded-xl focus:outline-none border border-gray-100 flex items-center gap-2 cursor-pointer text-sm font-medium"
            onClick={onClose}
          >
            <HiXCircle className="inline-block text-xl" />
            {viewOnly ? "Close" : "Cancel"}
          </button>
          {!viewOnly &&
            (() => {
              let saveButtonLabel;
              if (data && data._id) {
                saveButtonLabel = "Update User";
              } else if (user.isCustomerCreate) {
                saveButtonLabel = "Add Customer";
              } else if (user.isStaffCreate) {
                saveButtonLabel = "Add Staff";
              } else {
                saveButtonLabel = "Add User";
              }
              return (
                <button
                  type="button"
                  className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm font-medium"
                  onClick={() => {
                    setValidateOnSave(true);
                    setTouched({
                      first_name: true,
                      last_name: true,
                      email: true,
                      password: true,
                      role: true,
                      phone: true,
                      village: true,
                      commune: true,
                      district: true,
                      province: true,
                    });
                    if (
                      !user.first_name ||
                      user.first_name.trim() === "" ||
                      !user.last_name ||
                      user.last_name.trim() === "" ||
                      !user.email ||
                      user.email.trim() === "" ||
                      ((!data || !data._id) && !user.password) ||
                      user.password.trim() === "" ||
                      !user.role ||
                      user.role.trim() === "" ||
                      !user.phone ||
                      user.phone.trim() === "" ||
                      !user.address.province ||
                      user.address.province.trim() === "" ||
                      !user.address.district ||
                      user.address.district.trim() === "" ||
                      !user.address.commune ||
                      user.address.commune.trim() === "" ||
                      !user.address.village ||
                      user.address.village.trim() === ""
                    ) {
                      return;
                    }
                    onSave(user);
                  }}
                >
                  <HiOutlineDocumentText className="inline-block text-xl" />
                  {saveButtonLabel}
                </button>
              );
            })()}
          {viewOnly && onEdit && (
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

UserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  data: PropTypes.object,
  viewOnly: PropTypes.bool,
  onEdit: PropTypes.func,
};

export default UserModal;
