import React from "react";
import clsx from "clsx";

const AdminPageLayout = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className={clsx("p-6 space-y-6", className)}>
      {children}
    </div>
  );
};

export default AdminPageLayout;
