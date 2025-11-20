import React from "react";

interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
      <input
        type="checkbox"
        className="rounded border-neutral-300"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
};

export default Checkbox;
