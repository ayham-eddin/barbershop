import React from "react";
import clsx from "clsx";

const TableContainer = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={clsx(
        "overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
};

export default TableContainer;
