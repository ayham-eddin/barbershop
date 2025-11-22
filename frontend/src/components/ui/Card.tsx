import clsx from "clsx";

interface CardProps {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerRight,
  className,
  children,
}) => {
  const hasHeader = title || subtitle || headerRight;

  return (
    <section
      className={clsx(
        "rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur shadow-sm p-5 md:p-6",
        className
      )}
    >
      {hasHeader && (
        <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-neutral-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-neutral-600">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && (
            <div className="sm:ml-4">{headerRight}</div>
          )}
        </header>
      )}

      {children}
    </section>
  );
};

export default Card;
