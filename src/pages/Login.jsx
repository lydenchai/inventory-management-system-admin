import React, { useState } from "react";
import loginImage from "../assets/images/image.png";
import { HiEye, HiEyeOff, HiCube, HiOutlineDownload } from "react-icons/hi";
import { useAuth } from "../contexts/auth/useAuth";
import { login as loginApi } from "../api/auth-services";
import { getProfile } from "../api";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Call login API
      const res = await loginApi(email, password);
      if (!res.data.success) {
        setError(res.data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Successful login
      const { access_token, refresh_token } = res.data.data || {};
      if (!access_token || !refresh_token) {
        setError("No token returned");
        setLoading(false);
        return;
      }
      localStorage.setItem("_t", access_token);
      localStorage.setItem("_r", refresh_token);

      // Fetch user profile from backend
      const profileRes = await getProfile();
      if (!profileRes.data.success) {
        setError(profileRes.data.error || "Failed to fetch profile");
        setLoading(false);
        return;
      }

      // Store user in context
      const user = profileRes.data.data;
      localStorage.setItem("_u", JSON.stringify(user));
      login(user, () => navigate("/")); // Store user in context, then navigate
    } catch (error) {
      setError(error?.response?.data?.error || "Invalid credentials");
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
            Welcome Back
          </h2>
          <span className="block mb-6 text-sm text-center text-gray-400">
            Sign in to access your inventory management dashboard
          </span>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-600 mb-1 text-sm font-medium">
                Email Address <sup className="text-red-500">*</sup>
              </label>
              <input
                type="email"
                className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-800 placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
              />
            </div>
            <div className="relative">
              <label className="block text-gray-600 mb-1 text-sm font-medium">
                Password <sup className="text-red-500">*</sup>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-800 placeholder-gray-400 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />

              <button
                type="button"
                className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none z-0"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <HiEyeOff className="w-5 h-5 cursor-pointer" />
                ) : (
                  <HiEye className="w-5 h-5 cursor-pointer" />
                )}
              </button>
            </div>
            {error && (
              <div className="my-2 text-red-500 text-center text-sm font-medium">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-[#1e3a5f] text-white hover:bg-[#1e3a5f] py-2.5 rounded-xl transition disabled:opacity-50 mt-2 cursor-pointer mb-2"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
              {!loading && (
                <HiOutlineDownload className="inline-block ml-1 text-lg -rotate-90" />
              )}
            </button>
            <span
              className="block text-sm text-[#1e3a5f] hover:underline text-center cursor-pointer mb-2"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </span>
            <span className="block text-sm text-[#1e3a5f] text-center">
              Don't have an account?
              <span
                className="font-medium hover:underline ml-1 cursor-pointer"
                onClick={() => navigate("/register")}
              >
                Register
              </span>
            </span>
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

export default Login;
