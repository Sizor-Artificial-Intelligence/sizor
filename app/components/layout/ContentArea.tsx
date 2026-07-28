import React from "react";

interface ContentAreaProps {
  children?: React.ReactNode;
}

const ContentArea: React.FC<ContentAreaProps> = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 p-2">
      {children || null}
    </main>
  );
};

export default ContentArea;
