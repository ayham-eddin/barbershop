import clsx from "clsx";
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "subtle";
  size?: "sm" | "md";
  loading?: boolean;
  asChild?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  asChild = false,
  className,
  ...props
}) => {
  const Comp = asChild ? Slot : "button";

  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition focus:outline-none";

  const variantStyles = {
    primary:
      "bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50",
    secondary:
      "border border-neutral-300 text-neutral-800 hover:bg-neutral-100 disabled:opacity-50",
    danger:
      "border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50",
    subtle: 
      "text-neutral-700 hover:text-neutral-900 disabled:opacity-40",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  return (
    <Comp
      className={clsx(
        className,
        base,
        variantStyles[variant],
        sizeStyles[size],
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? "Loading…" : children}
    </Comp>
  );
};

export default Button;
