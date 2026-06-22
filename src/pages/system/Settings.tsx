// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/auth/useAuth";
import { useDialog } from "../../contexts/dialog/useDialog";
import { updateSelfProfile, uploadFile } from "../../api";
import { Listbox } from "@headlessui/react";
import { locations } from "../../data/locations";
import {
  HiUser,
  HiOutlineCog,
  HiCamera,
  HiOutlineLocationMarker,
  HiOutlineKey,
  HiCheck,
  HiEye,
  HiEyeOff,
  HiOutlineQuestionMarkCircle,
  HiOutlineMail,
  HiOutlinePhone,
  HiSelector,
} from "react-icons/hi";
import Loading from "../../components/Loading";

export default function Settings() {
  const { user, refreshProfile } = useAuth();
  const { success, error } = useDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    profile: "",
    address: {
      street: "",
      house: "",
      village: "",
      commune: "",
      district: "",
      province: "",
    },
  });

  // Account Form State
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  const fileInputRef = useRef(null);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["profile", "account", "help"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Initial data load
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        email: user.email || "",
        profile: user.profile || "",
        address: {
          street: user.address?.street || "",
          house: user.address?.house || "",
          village: user.address?.village || "",
          commune: user.address?.commune || "",
          district: user.address?.district || "",
          province: user.address?.province || "",
        },
      });
    }
  }, [user]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setProfileData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setProfileData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProvinceChange = (provinceName) => {
    setProfileData((prev) => ({
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
    setProfileData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        district: districtName,
        commune: "",
      },
    }));
  };

  const handleCommuneChange = (communeName) => {
    setProfileData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        commune: communeName,
        village: "",
      },
    }));
  };

  const handleVillageChange = (villageName) => {
    setProfileData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        village: villageName,
      },
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.match("image.*")) {
      error("Please select an image file", "Invalid File");
      return;
    }
    try {
      setUploading(true);
      const res = await uploadFile(file);
      if (res.data && res.data.url) {
        setProfileData((prev) => ({ ...prev, profile: res.data.url }));
      }
    } catch {
      error("Failed to upload image", "Upload Error");
    } finally {
      setUploading(false);
    }
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...profileData,
        address: profileData.address,
      };
      const res = await updateSelfProfile(payload);
      if (res.data.success) {
        await refreshProfile();
        success("Profile updated successfully", "Success");
      }
    } catch (err) {
      error(err.response?.data?.error || "Failed to update profile", "Error");
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.confirmPassword) {
      error("Passwords do not match", "Validation Error");
      return;
    }
    if (passwordData.password.length < 6) {
      error("Password must be at least 6 characters", "Validation Error");
      return;
    }

    setLoading(true);
    try {
      const res = await updateSelfProfile({
        password: passwordData.password,
      });
      if (res.data.success) {
        setPasswordData({ password: "", confirmPassword: "" });
        success("Password updated successfully", "Success");
      }
    } catch (err) {
      error(err.response?.data?.error || "Failed to update password", "Error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">
            Manage your profile and account preferences
          </p>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Sidebar / Tabs */}
        <div className="w-full h-fit lg:w-64 bg-white rounded-2xl p-2 border border-gray-100">
          <button
            onClick={() => handleTabChange("profile")}
            className={`w-full flex items-center gap-3 px-2 py-3 transition text-sm rounded-xl cursor-pointer ${activeTab === "profile"
                ? "bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]"
                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-gray-900"
              }`}
          >
            <HiUser className="text-xl" />
            <span>Profile Settings</span>
          </button>
          <button
            onClick={() => handleTabChange("account")}
            className={`w-full flex items-center gap-3 px-2 py-3 transition text-sm rounded-xl cursor-pointer ${activeTab === "account"
                ? "bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]"
                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-gray-900"
              }`}
          >
            <HiOutlineCog className="text-xl" />
            <span>Account & Security</span>
          </button>
          <button
            onClick={() => handleTabChange("help")}
            className={`w-full flex items-center gap-3 px-2 py-3 transition text-sm rounded-xl cursor-pointer ${activeTab === "help"
                ? "bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]"
                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-gray-900"
              }`}
          >
            <HiOutlineQuestionMarkCircle className="text-xl" />
            <span>Help & Support</span>
          </button>
        </div>
        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {activeTab === "profile" && (
              <form
                onSubmit={submitProfile}
                className="space-y-6 animate-fade-in-up"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                        {profileData.profile ? (
                          <a
                            href={profileData.profile}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={profileData.profile}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <HiUser className="text-6xl" />
                          </div>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-[#1e3a5f] text-white p-2 rounded-full shadow-lg hover:bg-[#1e3a5f] transition transform hover:scale-105 cursor-pointer"
                      >
                        <HiCamera className="text-lg" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900">
                        Profile Photo
                      </h3>
                    </div>
                  </div>
                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={profileData.first_name}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={profileData.last_name}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                        placeholder="Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                        placeholder="+855 12 345 678"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                        placeholder="example@gmail.com"
                      />
                    </div>
                  </div>
                </div>
                <hr className="border-gray-100" />
                <div>
                  <h3 className="text-gray-900 mb-3 flex items-center gap-2">
                    <HiOutlineLocationMarker className="text-xl text-gray-400" />
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Province/City
                      </label>
                      <Listbox
                        value={profileData.address.province}
                        onChange={handleProvinceChange}
                      >
                        <div className="relative">
                          <Listbox.Button className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between cursor-pointer border-gray-100">
                            <span>{profileData.address.province}</span>
                            <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                            {locations.map((province) => (
                              <Listbox.Option
                                key={province.name}
                                value={province.name}
                                className={({ selected }) =>
                                  `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] ${selected ? "bg-[#1e3a5f] text-white" : ""}`
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
                      <label className="text-sm font-medium text-gray-700">
                        District/Khan
                      </label>
                      <Listbox
                        value={profileData.address.district}
                        onChange={handleDistrictChange}
                        disabled={!profileData.address.province}
                      >
                        <div className="relative">
                          <Listbox.Button className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between cursor-pointer border-gray-100">
                            <span>{profileData.address.district}</span>
                            <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                            {locations
                              .find(
                                (p) => p.name === profileData.address.province,
                              )
                              ?.districts.map((district) => (
                                <Listbox.Option
                                  key={district.name}
                                  value={district.name}
                                  className={({ selected }) =>
                                    `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] ${selected ? "bg-[#1e3a5f] text-white" : ""}`
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
                      <label className="text-sm font-medium text-gray-700">
                        Commune/Sangkat
                      </label>
                      <Listbox
                        value={profileData.address.commune}
                        onChange={handleCommuneChange}
                        disabled={!profileData.address.district}
                      >
                        <div className="relative">
                          <Listbox.Button className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between cursor-pointer border-gray-100">
                            <span>{profileData.address.commune}</span>
                            <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                            {locations
                              .find(
                                (p) => p.name === profileData.address.province,
                              )
                              ?.districts.find(
                                (d) => d.name === profileData.address.district,
                              )
                              ?.communes.map((commune) => (
                                <Listbox.Option
                                  key={commune.name}
                                  value={commune.name}
                                  className={({ selected }) =>
                                    `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] ${selected ? "bg-[#1e3a5f] text-white" : ""}`
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
                      <label className="text-sm font-medium text-gray-700">
                        Village
                      </label>
                      <Listbox
                        value={profileData.address.village}
                        onChange={handleVillageChange}
                        disabled={!profileData.address.commune}
                      >
                        <div className="relative">
                          <Listbox.Button className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-left text-sm text-gray-900 flex items-center justify-between cursor-pointer border-gray-100">
                            <span>{profileData.address.village}</span>
                            <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
                            {locations
                              .find(
                                (p) => p.name === profileData.address.province,
                              )
                              ?.districts.find(
                                (d) => d.name === profileData.address.district,
                              )
                              ?.communes.find(
                                (c) => c.name === profileData.address.commune,
                              )
                              ?.villages.map((village) => (
                                <Listbox.Option
                                  key={village}
                                  value={village}
                                  className={({ selected }) =>
                                    `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] ${selected ? "bg-[#1e3a5f] text-white" : ""}`
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
                      <label className="text-sm font-medium text-gray-700">
                        House No.
                      </label>
                      <input
                        type="text"
                        name="address.house"
                        value={profileData.address.house}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Street
                      </label>
                      <input
                        type="text"
                        name="address.street"
                        value={profileData.address.street}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <HiCheck className="text-lg" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
            {activeTab === "account" && (
              <form
                onSubmit={submitPassword}
                className="space-y-6 animate-fade-in-up"
              >
                <div>
                  <h3 className="text-gray-900 mb-3 flex items-center gap-2">
                    <HiOutlineKey className="text-xl text-gray-400" />
                    Change Password
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          name="password"
                          value={passwordData.password}
                          onChange={handlePasswordChange}
                          className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                          placeholder="••••••••"
                          minLength={8}
                          type={showPassword ? "text" : "password"}
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
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 border-gray-100"
                          placeholder="••••••••"
                          minLength={8}
                          type={showConfirmPassword ? "text" : "password"}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 cursor-pointer"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <HiEyeOff className="w-5 h-5" />
                          ) : (
                            <HiEye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading || !passwordData.password}
                    className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <HiCheck className="text-lg" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
            {activeTab === "help" && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Contact Support */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Contact Support
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg text-[#1e3a5f]">
                        <HiOutlineMail className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Email Us</h4>
                        <p className="text-sm text-gray-500 mb-1">
                          Our team is here to help.
                        </p>
                        <a
                          href={`mailto:${import.meta.env.VITE_SMTP_USER}`}
                          className="text-[#1e3a5f] font-medium text-sm hover:underline"
                        >
                          {import.meta.env.VITE_SMTP_USER}
                        </a>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-xl flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-lg text-green-600">
                        <HiOutlinePhone className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Call Us</h4>
                        <p className="text-sm text-gray-500 mb-1">
                          Monday - Friday from 8am to 5pm.
                        </p>
                        <a
                          href="tel:+855123456789"
                          className="text-green-600 font-medium text-sm hover:underline"
                        >
                          +855 (123) 456-789
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-3">
                    <div className="border border-gray-100 rounded-xl p-4 hover:border-gray-100 transition-colors cursor-help">
                      <h4 className="font-medium text-gray-900 mb-2">
                        How do I reset my password?
                      </h4>
                      <p className="text-sm text-gray-500">
                        You can reset your password in the "Account & Security"
                        tab on this page. If you cannot log in, please contact
                        your administrator.
                      </p>
                    </div>
                    <div className="border border-gray-100 rounded-xl p-4 hover:border-gray-100 transition-colors cursor-help">
                      <h4 className="font-medium text-gray-900 mb-2">
                        How do I update my profile picture?
                      </h4>
                      <p className="text-sm text-gray-500">
                        Go to the "Profile Settings" tab and click the camera
                        icon on your profile picture to upload a new one.
                      </p>
                    </div>
                    <div className="border border-gray-100 rounded-xl p-4 hover:border-gray-100 transition-colors cursor-help">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Can I change my role?
                      </h4>
                      <p className="text-sm text-gray-500">
                        User roles are managed by administrators. Please contact
                        an admin if you need your permissions updated.
                      </p>
                    </div>
                  </div>
                </div>

                {/* System Info */}
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-500 mb-1">
                    System Version 1.0.0
                  </p>
                  <p className="text-xs text-gray-400">
                    &copy; 2026 IMS. All rights reserved.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

