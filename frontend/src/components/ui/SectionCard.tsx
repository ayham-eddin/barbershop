import React from "react";
import clsx from "clsx";

const SectionCard = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={clsx(
        "rounded-xl bg-white border border-neutral-200 p-4 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
};

export default SectionCard;
