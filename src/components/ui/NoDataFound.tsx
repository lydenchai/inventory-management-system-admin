// @ts-nocheck
import React from "react";
import { PiListMagnifyingGlass } from "react-icons/pi";

const NoDataFound = ({ message = "No data found." }) => (
  <div className="w-full flex flex-col items-center justify-center py-12">
    <div className="bg-gray-50 rounded-full p-4 mb-3 flex items-center justify-center">
      <PiListMagnifyingGlass className="h-14 w-14 text-[#64748b]" />
    </div>
    <span className="text-xl font-semibold text-gray-700 mb-1">{message}</span>
    <span className="text-gray-400 text-sm">
      Try adjusting your filters or add new data to get started.
    </span>
  </div>
);

export default NoDataFound;

