import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { HiXCircle } from "react-icons/hi";

const BarcodeScannerModal = ({ open, onClose, onScan }) => {
  useEffect(() => {
    let scanner = null;
    if (open) {
      setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "barcode-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.UPC_A,
            ],
            rememberLastUsedCamera: true,
          },
          false
        );

        scanner.render(
          (decodedText) => {
            onScan(decodedText);
            if (scanner) {
              scanner.clear().catch(console.error);
            }
            onClose();
          },
          (err) => {
            // Ignore standard scanning errors
            if (typeof err === "string" && !err.includes("NotFoundException")) {
              console.warn(err);
            }
          }
        );
      }, 100); // small delay to ensure DOM is ready
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [open, onScan, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#f8fafc]">
          <h2 className="text-xl font-bold text-[#1e3a5f]">Scan Barcode</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
            <HiXCircle className="text-2xl" />
          </button>
        </div>
        <div className="p-6">
          <div id="barcode-reader" className="w-full min-h-[300px] bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"></div>
        </div>
        <div className="p-4 bg-gray-50 text-center text-sm text-gray-500 border-t border-gray-100">
          Position the barcode or QR code within the frame to scan.
        </div>
      </div>
    </div>
  );
};

BarcodeScannerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onScan: PropTypes.func.isRequired,
};

export default BarcodeScannerModal;
