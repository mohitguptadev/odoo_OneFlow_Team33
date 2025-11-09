import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`
          glass-card bg-white rounded-xl shadow-2xl border border-gray-200
          ${sizes[size]} w-full m-4 max-h-[90vh] overflow-y-auto
          animate-scale-in
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/90 backdrop-blur">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 text-gray-900">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
