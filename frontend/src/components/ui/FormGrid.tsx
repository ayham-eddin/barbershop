import React from "react";
import clsx from "clsx";

const FormGrid = ({
  columns = 4,
  className,
  children,
}: {
  columns?: number;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={clsx(
        `grid gap-3 sm:grid-cols-${columns} bg-white border border-neutral-200 rounded-xl p-4`,
        className
      )}
    >
      {children}
    </div>
  );
};

export default FormGrid;
