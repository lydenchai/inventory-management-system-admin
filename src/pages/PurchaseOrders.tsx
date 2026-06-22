// @ts-nocheck
import React, { useState, useEffect } from "react";
import { HiOutlineDownload, HiOutlineRefresh } from "react-icons/hi";
import { useDialog } from "../contexts/dialog/useDialog";
import { getPurchaseOrders, downloadPurchaseOrderPdf } from "../api";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Pagination from "../components/Pagination";
import useDataFetch from "../hooks/useDataFetch";
import { formatDate } from "../utils/dateFormat";

export default function PurchaseOrders() {
  const dialog = useDialog();
  const [downloadingId, setDownloadingId] = useState(null);

  const {
    data: pos,
    loading,
    error,
    pagination,
    updatePage,
    fetchData,
  } = useDataFetch(getPurchaseOrders, {});

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit]);

  const handleDownload = async (po) => {
    try {
      setDownloadingId(po._id);
      const res = await downloadPurchaseOrderPdf(po._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${po.po_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      dialog.error("Failed to download PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    { header: "PO Number", accessor: "po_number", className: "font-semibold text-[#1e3a5f]" },
    { header: "Supplier", render: (po) => po.supplier_id?.company_name || "-" },
    { header: "Issue Date", render: (po) => formatDate(po.issue_date) },
    { header: "Total Amount", render: (po) => `$${po.total_amount.toFixed(2)}`, className: "font-semibold" },
    {
      header: "Status", render: (po) => (
        <span className="bg-[#1e3a5f] text-white px-3 py-1 rounded-full text-xs font-semibold capitalize">
          {po.status}
        </span>
      )
    },
    {
      header: "Actions", className: "text-center", render: (po) => (
        <div className="flex items-center gap-2 justify-center">
          <button
            className="bg-gray-100 hover:bg-gray-200 text-[#1e3a5f] p-2 rounded-lg transition"
            onClick={() => handleDownload(po)}
            disabled={downloadingId === po._id}
            title="Download PDF"
          >
            {downloadingId === po._id ? (
              <span className="w-5 h-5 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin inline-block"></span>
            ) : (
              <HiOutlineDownload className="text-xl" />
            )}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="h-content-available flex flex-col">
      <PageHeader
        title="Purchase Orders"
        description="View and manage generated purchase orders"
        actions={
          <button className="bg-gray-100 hover:bg-gray-200 text-[#1e3a5f] px-4 py-2 rounded-xl focus:outline-none flex items-center gap-2 cursor-pointer text-sm font-medium transition" onClick={fetchData}>
            <HiOutlineRefresh className="text-md" /> Refresh
          </button>
        }
      />

      <div className="overflow-auto min-h-0 flex flex-col">
        <DataTable columns={columns} data={pos} loading={loading} error={error} />
      </div>

      {pos.length > 0 && (
        <div className="flex justify-end mt-3 flex-shrink-0">
          <Pagination total={pagination.totalItems} page={pagination.page} limit={pagination.limit} onChange={updatePage} />
        </div>
      )}
    </div>
  );
}

