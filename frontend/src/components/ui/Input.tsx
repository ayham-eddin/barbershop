import React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  helper,
  className,
  ...props
}) => {
  const field = (
    <input
      className={clsx(
        "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm",
        className
      )}
      {...props}
    />
  );

  return label ? (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      <div className="mt-1">{field}</div>
      {helper && <p className="text-xs text-neutral-500 mt-1">{helper}</p>}
    </label>
  ) : (
    field
  );
};

export default Input;
