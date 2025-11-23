import Button from "./Button";
import clsx from "clsx";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

const Pagination = ({ page, totalPages, onChange, className }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      className={clsx(
        "flex items-center justify-center gap-2 py-3",
        className
      )}
    >
      {/* Prev */}
      <Button
        size="sm"
        variant="secondary"
        className="text-yellow-500"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <Button
            key={p}
            size="sm"
            className={p === page ? "border border-yellow-500 text-yellow-500" : "text-yellow-500"}
            variant={p === page ? "primary" : "secondary"}
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Next */}
      <Button
        className="text-yellow-500"
        size="sm"
        variant="secondary"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
