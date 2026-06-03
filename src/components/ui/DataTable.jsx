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
  if (loading) {
    return (
      <div className="animate-pulse space-y-4 w-full">
        <div className="h-10 bg-gray-100 rounded-lg w-full mb-2"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded-lg w-full"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500">
        <MdOutlineSmsFailed className="text-6xl mb-4" />
        <div className="text-center">{error}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
        No data found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 w-full">
      <table className="w-full text-left text-sm text-gray-700 min-w-max">
        <thead className="bg-white text-gray-600 border-b border-gray-100 uppercase text-xs sticky top-0 z-10">
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
          {data.map((row, i) => (
            <tr
              key={keyExtractor ? keyExtractor(row) : i}
              className={`hover:bg-gray-50 transition-colors ${onRowClick ? "cursor-pointer" : ""} ${rowClassName ? rowClassName(row) : ""}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, j) => (
                <td key={j} className={`px-4 py-3 ${col.className || ""}`}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
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
