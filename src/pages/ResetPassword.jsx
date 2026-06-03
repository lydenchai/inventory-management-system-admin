import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import loginImage from "../assets/images/image.png";
import { HiCube, HiEye, HiEyeOff } from "react-icons/hi";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/password-reset/reset`,
        { token, password },
      );
      if (res.data.success) {
        setMessage("Password reset successful. Redirecting to login...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(res.data.error || "Failed to reset password.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Invalid Link</h2>
          <p className="text-gray-500 mt-2">
            This password reset link is invalid or missing a token.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 text-[#1e3a5f] hover:underline"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side image: only show on md+ screens */}
      <div className="hidden md:flex w-1/2 h-screen items-center justify-center bg-white/80">
        <img
          src={loginImage}
          alt="Background"
          className="object-contain h-full"
          style={{ maxHeight: "100vh" }}
        />
      </div>
      {/* Right side form */}
      <div className="flex flex-col w-full md:w-1/2 items-center justify-center">
        <div className="w-full max-w-md bg-white/90 rounded-xl p-8 border border-gray-100 shadow-xl">
          <div className="w-18 h-15 m-auto bg-linear-to-br from-[#1e3a5f] to-[#bb7c18] rounded-xl flex items-center justify-center mb-3">
            <HiCube className="w-9 h-9 mx-auto text-white" />
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-800 tracking-tight">
            Reset Password
          </h2>
          <span className="block mb-6 text-sm text-center text-gray-400">
            Enter your new password below.
          </span>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-500 mb-1 text-sm font-medium">
                New Password <sup className="text-red-500">*</sup>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-800 placeholder-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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
              <label className="block text-gray-500 mb-1 text-sm font-medium">
                Confirm Password <sup className="text-red-500">*</sup>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-800 placeholder-gray-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <HiEyeOff className="w-5 h-5" />
                  ) : (
                    <HiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="my-4 text-red-500 text-center text-sm font-medium">
                {error}
              </div>
            )}
            {message && (
              <div className="my-4 text-green-600 text-center text-sm font-medium">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#1e3a5f] text-white hover:bg-[#1e3a5f] py-2.5 rounded-xl transition disabled:opacity-50 mt-2 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
        <br />
        <span className="block text-sm text-[#1e3a5f] text-center mt-6">
          © 2026 IMS. All rights reserved.
        </span>
      </div>
    </div>
  );
};

export default ResetPassword;
