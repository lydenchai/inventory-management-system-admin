import React from "react";
import PropTypes from "prop-types";
import { MdOutlineSmsFailed } from "react-icons/md";

export default function DataTable({
  columns,
  data,
  loading,
  error,
  keyExtractor,
  onRowClick,
  rowClassName,
}) {
  return (
    <div className="overflow-auto min-h-0 max-h-full bg-white rounded-xl border border-gray-100 w-full relative">
      {loading && data?.length > 0 && (
        <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <table className="w-full text-left text-sm text-gray-700 min-w-max">
        <thead className="bg-white text-gray-500 border-b border-gray-100 uppercase text-xs sticky top-0 z-10">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 font-medium ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading && (!data || data.length === 0) ? (
            [...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-6 bg-gray-100 rounded w-full animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="p-8">
                <div className="flex flex-col items-center justify-center text-red-500">
                  <MdOutlineSmsFailed className="text-6xl mb-4" />
                  <div className="text-center">{error}</div>
                </div>
              </td>
            </tr>
          ) : !data || data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-gray-500">
                No data found
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={keyExtractor ? keyExtractor(row) : i}
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? "cursor-pointer" : ""} ${rowClassName ? rowClassName(row) : ""}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col, j) => (
                  <td key={j} className={`px-4 py-3 ${col.className || ""}`}>
                    {col.render ? col.render(row, i) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.node.isRequired,
      accessor: PropTypes.string,
      render: PropTypes.func,
      className: PropTypes.string,
    }),
  ).isRequired,
  data: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  keyExtractor: PropTypes.func,
  onRowClick: PropTypes.func,
  rowClassName: PropTypes.func,
};
