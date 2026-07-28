import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import useEscapeKey from "~/hooks/useEscapeKey";

interface ModalSmallProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  disabledClose?: boolean;
}

const ModalSmall: React.FC<ModalSmallProps> = ({
  isOpen,
  onClose,
  title,
  children,
  disabledClose = false,
}) => {
  const [showModal, setShowModal] = useState(isOpen);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleClose = () => {
    if (!disabledClose) {
      setShowModal(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }
  };

  const handleEscape = () => {
    if (isOpen && !disabledClose) handleClose();
  };

  useEscapeKey(handleEscape);

  if (!hasMounted) return null;

  const rootElement = document.getElementById("root");
  if (!rootElement) return null;

  return createPortal(
    <div
      style={{ zIndex: 100 }}
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center sm:p-4 transition-opacity duration-300 ${
        showModal ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        className={`dark:bg-gray-700 dark:text-white bg-white z-[100] rounded-lg shadow-lg w-full transform transition-all duration-300 ${
          showModal ? "scale-100" : "scale-75"
        } sm:max-w-lg max-w-[96%] flex flex-col`}
        style={{ maxHeight: "70vh", zIndex: 101 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-4 ${
            title ? "border-b" : ""
          } border-gray-200 dark:border-gray-600 flex justify-between items-center`}
        >
          {title && (
            <h2 className="text-lg font-semibold dark:text-white text-gray-800">
              {title}
            </h2>
          )}
          {!disabledClose && (
            <button
              className="cursor-pointer text-gray-500 dark:text-white dark:hover:text-gray-300 hover:text-gray-700 transition"
              onClick={handleClose}
            >
              &#x2715;
            </button>
          )}
        </div>
        <div className="p-4 overflow-y-auto custom-scroll flex-grow">
          <div className="text-gray-700 dark:text-white">{children}</div>
        </div>
      </div>
    </div>,
    rootElement
  );
};

export default ModalSmall;
