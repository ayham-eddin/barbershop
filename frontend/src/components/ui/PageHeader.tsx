import clsx from "clsx";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  className,
  actions,
}) => {
  return (
    <header
      className={clsx(
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl bg-neutral-900 border border-amber-500/40 shadow-lg p-6",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-xs font-medium text-yellow-500 uppercase tracking-[0.16em]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm md:text-base text-white">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap gap-2 mt-1 md:mt-0">
          {actions}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
