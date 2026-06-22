// @ts-nocheck
import React from "react";

const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex flex-col animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-gray-200"></div>

      {/* Content Skeleton */}
      <div className="p-4 flex-1 flex flex-col space-y-3">
        {/* Title and Status */}
        <div className="flex justify-between items-start">
          <div className="space-y-2 w-2/3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
        </div>

        {/* Details */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>

        {/* Price and Stock */}
        <div className="pt-3 border-t border-gray-100 flex justify-between items-end mt-auto">
          <div>
            <div className="h-3 bg-gray-200 rounded w-10 mb-1"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex flex-col items-end">
             <div className="h-3 bg-gray-200 rounded w-10 mb-1"></div>
             <div className="h-5 bg-gray-200 rounded w-8"></div>
          </div>
        </div>
        
        {/* Button Skeleton */}
        <div className="h-9 bg-gray-200 rounded-lg mt-2"></div>
      </div>
    </div>
  );
};

export default CardSkeleton;

