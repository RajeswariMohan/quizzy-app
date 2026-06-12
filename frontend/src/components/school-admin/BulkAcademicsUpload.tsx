import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FileUploadCancelButton, SelectedFileRow } from '@/components/ui/FileUploadCancel';
import { logApiError } from '@/api/client';
import {
  ACADEMICS_STRUCTURE_HEADERS,
  downloadAcademicsStructureTemplate,
  parseAcademicsStructureCsv,
  summarizeGradeSections,
  type AcademicsCsvParseError,
} from '@/utils/academicsCsvImport';

interface BulkAcademicsUploadProps {
  gradeSections: Record<string, string[]>;
  disabled?: boolean;
  onApply: (gradeSections: Record<string, string[]>) => void;
}

export function BulkAcademicsUpload({
  gradeSections,
  disabled,
  onApply,
}: BulkAcademicsUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, string[]> | null>(null);
  const [parseErrors, setParseErrors] = useState<AcademicsCsvParseError[]>([]);

  const resetUpload = () => {
    setFileName(null);
    setPreview(null);
    setParseErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreview(null);
    setParseErrors([]);

    try {
      const text = await file.text();
      const result = parseAcademicsStructureCsv(text);
      setPreview(result.gradeSections);
      setParseErrors(result.errors);
    } catch (err) {
      logApiError('Academics CSV parse failed', err);
      setPreview(null);
      setParseErrors([{ row: 0, message: 'Could not read file.' }]);
    }
    event.target.value = '';
  };

  const handleApply = () => {
    if (!preview || parseErrors.length > 0) return;
    if (Object.keys(preview).length === 0) return;
    onApply(preview);
    resetUpload();
  };

  const showPreviewActions = Boolean(preview && parseErrors.length === 0);

  const previewSummary = preview ? summarizeGradeSections(preview) : null;
  const previewRows = preview
    ? Object.entries(preview).flatMap(([grade, groups]) =>
        groups.map((group) => ({ grade, group })),
      )
    : [];

  return (
    <div className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.03] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Import grades &amp; sections from spreadsheet</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Download the template, fill one row per grade group, then upload CSV UTF-8. This
            replaces your current grade/section structure (subjects are not changed). Click{' '}
            <strong className="text-ink">Save changes</strong> after applying to persist.
          </p>
          <p className="mt-1 text-xs text-muted">
            Columns: <span className="font-medium text-ink">{ACADEMICS_STRUCTURE_HEADERS.join(' · ')}</span>.
            For Class 11/12 use department names, or <code className="rounded bg-gray-100 px-1">Science · A</code>{' '}
            when section letters apply.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadAcademicsStructureTemplate(gradeSections)}
          disabled={disabled}
        >
          <Download className="h-4 w-4" />
          Download template
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-4 w-4" />
          Upload CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <SelectedFileRow
        fileName={fileName}
        onCancel={resetUpload}
        disabled={disabled}
        showCancel={!showPreviewActions && parseErrors.length === 0}
      />

      {parseErrors.length > 0 && (
        <div className="mt-3 space-y-2">
          <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
            {parseErrors.map((e, i) => (
              <li key={`${e.row}-${i}`}>
                {e.row > 0 ? `Row ${e.row}: ` : ''}
                {e.message}
              </li>
            ))}
          </ul>
          {!showPreviewActions && (
            <FileUploadCancelButton onCancel={resetUpload} disabled={disabled} />
          )}
        </div>
      )}

      {showPreviewActions && preview && previewSummary && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-ink">
            Preview — {previewSummary.gradeCount} grade
            {previewSummary.gradeCount === 1 ? '' : 's'}, {previewSummary.groupCount} group
            {previewSummary.groupCount === 1 ? '' : 's'}
          </p>

          <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white shadow-sm">
            <table className="min-w-[400px] w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#217346] text-white">
                  {ACADEMICS_STRUCTURE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className="border border-[#1a5c38] px-2.5 py-2 font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 20).map((row, i) => (
                  <tr key={`${row.grade}-${row.group}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                    <td className="border border-gray-200 px-2.5 py-1.5">{row.grade}</td>
                    <td className="border border-gray-200 px-2.5 py-1.5">{row.group}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 20 && (
              <p className="border-t border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-muted">
                …and {previewRows.length - 20} more rows
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleApply} disabled={disabled}>
              Apply to structure
            </Button>
            <FileUploadCancelButton onCancel={resetUpload} disabled={disabled} />
          </div>
        </div>
      )}
    </div>
  );
}
