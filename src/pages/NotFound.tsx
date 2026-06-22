import React from "react";
import { Link } from "react-router-dom";
import { HiOutlineExclamationCircle } from "react-icons/hi";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-white rounded-2xl p-8">
      <HiOutlineExclamationCircle className="text-6xl text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        The page you are looking for doesn't exist or has been moved. Please
        check the URL or return to the dashboard.
      </p>
      <Link
        to="/"
        className="bg-[#1e3a5f] hover:bg-[#16375b] text-white px-6 py-2.5 rounded-xl transition font-medium flex items-center"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
