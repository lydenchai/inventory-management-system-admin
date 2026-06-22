// @ts-nocheck
import React, { useState } from "react";
import axios from "axios";
import loginImage from "../../assets/images/image.png";
import { HiCube } from "react-icons/hi";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/password-reset/request`,
        { email },
      );
      if (res.data.success) {
        setMessage("Password reset email sent. Please check your inbox.");
      } else {
        setError(res.data.error || "Failed to send reset email.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

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
      {/* Right side login form: full width on small screens, half on md+ */}
      <div className="flex flex-col w-full md:w-1/2 items-center justify-center">
        <div className="w-full max-w-md bg-white/90 rounded-xl p-8 border border-gray-100 shadow-xl">
          <div className="w-18 h-15 m-auto bg-linear-to-br from-[#1e3a5f] to-[#bb7c18] rounded-xl flex items-center justify-center mb-3">
            <HiCube className="w-9 h-9 mx-auto text-white" />
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-800 tracking-tight">
            Forgot Your Password?
          </h2>
          <span className="block mb-6 text-sm text-center text-gray-400">
            Enter your email address and we'll send you a link to reset your
            password.
          </span>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-500 mb-1 text-sm font-medium">
                Email Address <sup className="text-red-500">*</sup>
              </label>
              <input
                type="email"
                className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-800 placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                autoFocus
              />
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
              {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;

