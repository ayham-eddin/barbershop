import Button from "../../ui/Button";

const ModalFooter = ({
  onCancel,
  onSubmit,
  submitLabel = "Save",
  submitting,
  cancelLabel = "Cancel",
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
}) => {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="secondary" size="sm" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={onSubmit}
        loading={submitting}
      >
        {submitLabel}
      </Button>
    </div>
  );
};

export default ModalFooter;
