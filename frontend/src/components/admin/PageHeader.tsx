import Button from "../ui/Button";

const PageHeader = ({
  title,
  onRefresh,
  loading,
}: {
  title: string;
  onRefresh?: () => void;
  loading?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      {onRefresh && (
        <Button
          variant="primary"
          size="sm"
          onClick={onRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      )}
    </div>
  );
};

export default PageHeader;
