// @ts-nocheck
import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { HiOutlineUpload, HiXCircle, HiOutlineDocumentDownload } from "react-icons/hi";
import { useDialog } from "../contexts/dialog/useDialog";

const BulkImportModal = ({ open, onClose, onImport, title, templateLink }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const dialog = useDialog();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.type === "text/csv" || selected.name.endsWith(".csv"))) {
      setFile(selected);
    } else {
      dialog.error("Please select a valid CSV file.");
      setFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.type === "text/csv" || dropped.name.endsWith(".csv"))) {
      setFile(dropped);
    } else {
      dialog.error("Please drop a valid CSV file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      dialog.error("Please select a file to import.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await onImport(formData);
      dialog.success("Import successful.");
      setFile(null);
      onClose();
    } catch (error) {
      dialog.error("Import failed: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative">
        <div className="mb-6 border-b border-gray-100 pb-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
          <p className="text-sm text-gray-500">Upload a CSV file to bulk import records.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer mb-4"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <HiOutlineUpload className="mx-auto text-4xl text-[#1e3a5f] mb-3" />
            {file ? (
              <p className="text-sm font-semibold text-gray-800">{file.name}</p>
            ) : (
              <div>
                <p className="text-sm font-semibold text-gray-700">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">CSV files only (Max 5MB)</p>
              </div>
            )}
          </div>

          {templateLink && (
            <div className="mb-6 flex justify-center">
              <a href={templateLink} download className="flex items-center text-sm font-medium text-[#1e3a5f] hover:underline">
                <HiOutlineDocumentDownload className="mr-1 text-lg" /> Download Sample CSV Template
              </a>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl text-sm font-medium transition"
              onClick={() => { setFile(null); onClose(); }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="bg-[#1e3a5f] hover:bg-[#16375b] disabled:bg-[#1e3a5f]/50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Importing...
                </span>
              ) : (
                "Import"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

BulkImportModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  templateLink: PropTypes.string
};

export default BulkImportModal;

