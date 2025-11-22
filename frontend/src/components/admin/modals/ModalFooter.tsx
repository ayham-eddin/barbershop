import Button from "../../ui/Button";

const ModalFooter = ({
  onCancel,
  submitLabel = "Save",
  submitting,
  cancelLabel = "Cancel",
  formId = "edit-barber-form",
}: {
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  formId?: string;
}) => {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="secondary" size="sm" onClick={onCancel}>
        {cancelLabel}
      </Button>

      <Button
        variant="primary"
        size="sm"
        loading={submitting}
        onClick={() => {
          const form = document.getElementById(formId) as HTMLFormElement | null;
          if (form) form.requestSubmit();
        }}
      >
        {submitLabel}
      </Button>
    </div>
  );
};

export default ModalFooter;
