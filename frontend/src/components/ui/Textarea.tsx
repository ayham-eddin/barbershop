import clsx from "clsx";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  helper,
  className,
  ...props
}) => {
  const field = (
    <textarea
      className={clsx(
        "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900/40",
        className
      )}
      {...props}
    />
  );

  return label ? (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      <div className="mt-1">{field}</div>
      {helper && (
        <p className="mt-1 text-xs text-neutral-500">
          {helper}
        </p>
      )}
    </label>
  ) : (
    field
  );
};

export default Textarea;
