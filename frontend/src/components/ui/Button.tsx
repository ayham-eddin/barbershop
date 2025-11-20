import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "subtle";
  size?: "sm" | "md";
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition";

  const variantStyles = {
    primary:
      "bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50",
    secondary:
      "border border-neutral-300 text-neutral-800 hover:bg-neutral-100 disabled:opacity-50",
    danger:
      "border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50",
    subtle: "text-neutral-700 hover:text-neutral-900 disabled:opacity-40",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      className={clsx(base, variantStyles[variant], sizeStyles[size], className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? "Loading…" : children}
    </button>
  );
};

export default Button;
