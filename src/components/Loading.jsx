import React from "react";

const Loading = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-100 border-t-[#1e3a5f]"></div>
      </div>
      <span className="text-gray-500 text-sm font-medium animate-pulse">
        <h2>Processing, please wait...</h2>
      </span>
    </div>
  );
};

export default Loading;
