import React from "react";
import PropTypes from "prop-types";
import {
  HiXCircle,
  HiOutlineCube,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiOutlineAnnotation,
  HiArrowSmUp,
  HiArrowSmDown,
  HiOutlineChartBar,
} from "react-icons/hi";

const StockViewModal = ({ open, onClose, stock }) => {
  if (!open || !stock) return null;

  const isIn = stock.type === "in";
  const typeColor = isIn ? "text-green-600" : "text-red-500";
  const bgColor = isIn ? "bg-green-50" : "bg-red-50";

  // Format Date and Time separately
  const dateObj = new Date(stock.createdAt);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 w-full max-w-[40%] max-h-[80vh] shadow-xl relative">
        {/* Header */}
        <div className="flex items-center justify-between px-1 py-2 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${bgColor}`}>
              {isIn ? (
                <HiArrowSmDown className={`text-2xl ${typeColor} rotate-180`} />
              ) : (
                <HiArrowSmUp className={`text-2xl ${typeColor}`} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Transaction Details
              </h2>
              <p className="text-sm text-gray-500">
                Movement ID: #{stock._id?.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 space-y-5 overflow-auto max-h-[60vh] px-1">
          {/* Row 1: Product & Transaction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Info */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-4 text-black">
                <HiOutlineCube className="text-xl" />
                <h3 className="text-base">Product Information</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">
                    Product Name
                  </p>
                  <p className="text-sm text-gray-900">
                    {stock.product?.name || "Unknown Product"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">
                    Product Code
                  </p>
                  <p className="text-sm text-gray-900">
                    #{stock.product?.code || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-4 text-black">
                <HiOutlineChartBar className="text-xl" />
                <h3 className="text-base">Transaction Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Type</p>
                  <div className="flex items-center gap-2">
                    {isIn ? (
                      <HiArrowSmDown className="text-green-500 text-lg" />
                    ) : (
                      <HiArrowSmUp className="text-red-500 text-lg" />
                    )}
                    <span
                      className={`text-sm ${isIn ? "text-green-600" : "text-red-500"}`}
                    >
                      Stock {isIn ? "In" : "Out"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">
                    Quantity
                  </p>
                  <p
                    className={`text-sm ${isIn ? "text-green-600" : "text-red-500"}`}
                  >
                    {isIn ? "+" : "-"}
                    {stock.quantity} units
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">
                    Running Balance
                  </p>
                  <p className="text-sm text-gray-900">{stock.balance} units</p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: User & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Info */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-4 text-black">
                <HiOutlineUser className="text-xl" />
                <h3 className="text-base">User Information</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">
                    Performed By
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                      {stock.user?.first_name?.[0]}
                      {stock.user?.last_name?.[0]}
                    </div>
                    <span className="text-sm text-gray-900">
                      {stock.user?.first_name} {stock.user?.last_name}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Role</p>
                  <p className="text-sm text-gray-900 capitalize">
                    {stock.user?.role || "Staff"}
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-4 text-black">
                <HiOutlineCalendar className="text-xl" />
                <h3 className="text-base">Date & Time</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Date</p>
                  <p className="text-sm text-gray-900">{dateStr}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Time</p>
                  <p className="text-sm text-gray-900">{timeStr}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-black">
              <HiOutlineLocationMarker className="text-xl" />
              <h3 className="text-base">Location</h3>
            </div>
            <p className="text-sm font-medium text-gray-900 pl-7">
              {stock.location || "N/A"}
            </p>
          </div>

          {/* Reason */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-black">
              <HiOutlineDocumentText className="text-xl" />
              <h3 className="text-base">Reason</h3>
            </div>
            <p className="text-sm font-medium text-gray-900 pl-7">
              {stock.reason || "N/A"}
            </p>
          </div>

          {/* Notes */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 mb-2">
            <div className="flex items-center gap-2 mb-2 text-black">
              <HiOutlineAnnotation className="text-xl" />
              <h3 className="text-base">Notes</h3>
            </div>
            <p className="text-sm text-gray-600 pl-7">
              {stock.note || "No notes provided."}
            </p>
          </div>
        </div>
        <div className="col-span-2 w-full flex items-center justify-end gap-3 mt-4">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-black px-6 py-2 rounded-xl focus:outline-none border border-gray-100 flex items-center gap-2 cursor-pointer text-sm"
            onClick={onClose}
          >
            <HiXCircle className="inline-block text-xl" /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

StockViewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  stock: PropTypes.object,
};

export default StockViewModal;
