import { Button } from '@/components/ui/Button';

interface FileUploadCancelButtonProps {
  onCancel: () => void;
  disabled?: boolean;
  label?: string;
}

/** Secondary action to discard a selected file / upload draft (use once per upload flow). */
export function FileUploadCancelButton({
  onCancel,
  disabled,
  label = 'Cancel',
}: FileUploadCancelButtonProps) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
      {label}
    </Button>
  );
}

interface SelectedFileRowProps {
  fileName: string | null;
  onCancel: () => void;
  disabled?: boolean;
  /** Set false when cancel is shown next to the primary import/apply action. */
  showCancel?: boolean;
}

export function SelectedFileRow({
  fileName,
  onCancel,
  disabled,
  showCancel = true,
}: SelectedFileRowProps) {
  if (!fileName) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <p className="text-xs text-muted">
        Selected file: <span className="font-medium text-ink">{fileName}</span>
      </p>
      {showCancel && <FileUploadCancelButton onCancel={onCancel} disabled={disabled} />}
    </div>
  );
}
