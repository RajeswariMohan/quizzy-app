import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FileUploadCancelButton, SelectedFileRow } from '@/components/ui/FileUploadCancel';
import {
  bulkImportSchoolUsers,
  type CreateSchoolUserPayload,
  type SchoolAcademicConfig,
} from '@/api/schoolAdmin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import {
  downloadUserImportTemplate,
  extractBulkImportErrors,
  parseUsersCsv,
  USER_IMPORT_HEADERS,
  type UserCsvParseError,
} from '@/utils/userCsvImport';
import { bulkImportRoleRules, roleLabel } from '@/utils/schoolUserOnboarding';

interface BulkUserUploadProps {
  academics: SchoolAcademicConfig | null;
  /** Disables all controls (e.g. while saving or loading page data). */
  disabled?: boolean;
  /** When false, CSV upload/import is disabled (download template still works). */
  importEnabled?: boolean;
  onImported: (count: number) => void;
}

const EXCEL_HEADERS = [...USER_IMPORT_HEADERS];

export function BulkUserUpload({
  academics,
  disabled = false,
  importEnabled = true,
  onImported,
}: BulkUserUploadProps) {
  const uploadDisabled = disabled || !importEnabled;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<CreateSchoolUserPayload[]>([]);
  const [parseErrors, setParseErrors] = useState<UserCsvParseError[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const resetUpload = () => {
    setFileName(null);
    setPreview([]);
    setParseErrors([]);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!importEnabled) {
      event.target.value = '';
      return;
    }
    const file = event.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    setFileName(file.name);
    try {
      const text = await file.text();
      const result = parseUsersCsv(text, academics);
      setPreview(result.users);
      setParseErrors(result.errors);
    } catch (err) {
      logApiError('User CSV parse failed', err);
      setPreview([]);
      setParseErrors([{ row: 0, message: 'Could not read file.' }]);
    }
    event.target.value = '';
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setIsImporting(true);
    setUploadError(null);
    setParseErrors([]);
    try {
      const result = await bulkImportSchoolUsers(preview);
      resetUpload();
      onImported(result.importedCount);
    } catch (err) {
      logApiError('Bulk user import failed', err);
      const serverErrors = extractBulkImportErrors(err);
      if (serverErrors.length > 0) {
        setParseErrors(serverErrors);
      } else {
        setUploadError(getApiErrorMessage(err, 'Import failed.'));
      }
    } finally {
      setIsImporting(false);
    }
  };

  const showPreviewActions = preview.length > 0;

  const gradeHint = academics?.grades.length
    ? academics.grades.join(', ')
    : 'Configure grades on School academics page';
  const sectionHint = academics
    ? Object.entries(academics.gradeSections)
        .map(([g, secs]) => `${g}: ${secs.join(', ')}`)
        .join(' · ')
    : '';

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Import users from spreadsheet</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Open the template in Excel or Google Sheets. Row 1 is the header row with columns:{' '}
            <span className="font-medium text-ink">{EXCEL_HEADERS.join(' · ')}</span>.
            Add one user per row, then save as <strong>CSV UTF-8</strong> and upload. Field rules
            match the signup page and Add user form above.
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-muted">
            {bulkImportRoleRules().map(({ role, rules }) => (
              <li key={role}>
                <strong className="text-ink">{roleLabel(role)}s</strong> — {rules}
              </li>
            ))}
            {academics && (
              <>
                <li>Grades: {gradeHint}</li>
                {sectionHint && <li>Sections: {sectionHint}</li>}
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadUserImportTemplate(academics)}
          disabled={disabled || isImporting}
        >
          <Download className="h-4 w-4" />
          Download template (CSV)
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadDisabled || isImporting}
          title={
            !importEnabled
              ? 'Bulk CSV import is not included in your school subscription package'
              : undefined
          }
        >
          <Upload className="h-4 w-4" />
          Upload CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          className="hidden"
          disabled={uploadDisabled || isImporting}
          onChange={handleFileChange}
        />
      </div>
      {!importEnabled && (
        <p className="mt-2 text-xs text-muted">
          You can download the template anytime. CSV upload requires a subscription that includes
          bulk user import — contact your platform admin to upgrade.
        </p>
      )}

      <SelectedFileRow
        fileName={fileName}
        onCancel={resetUpload}
        disabled={uploadDisabled || isImporting}
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
            <FileUploadCancelButton
              onCancel={resetUpload}
              disabled={uploadDisabled || isImporting}
            />
          )}
        </div>
      )}

      {preview.length > 0 && importEnabled && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-ink">
            Preview — {preview.length} user{preview.length === 1 ? '' : 's'} ready to import
          </p>

          <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white shadow-sm">
            <table className="min-w-[880px] w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#217346] text-white">
                  {EXCEL_HEADERS.map((h) => (
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
                {preview.slice(0, 15).map((u, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}
                  >
                    <td className="border border-gray-200 px-2.5 py-1.5">{u.firstName}</td>
                    <td className="border border-gray-200 px-2.5 py-1.5">{u.lastName}</td>
                    <td className="border border-gray-200 px-2.5 py-1.5">{roleLabel(u.role)}</td>
                    <td className="border border-gray-200 px-2.5 py-1.5 font-mono text-[11px]">
                      {u.username ?? ''}
                    </td>
                    <td className="border border-gray-200 px-2.5 py-1.5">{u.email ?? ''}</td>
                    <td className="border border-gray-200 px-2.5 py-1.5">{u.parentEmail ?? ''}</td>
                    <td className="border border-gray-200 px-2.5 py-1.5 text-muted">••••••••</td>
                    <td className="border border-gray-200 px-2.5 py-1.5">{u.grade ?? ''}</td>
                    <td className="border border-gray-200 px-2.5 py-1.5">{u.section ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 15 && (
              <p className="border-t border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-muted">
                …and {preview.length - 15} more rows
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleImport}
              disabled={uploadDisabled || isImporting || parseErrors.length > 0}
            >
              {isImporting ? 'Importing…' : `Import ${preview.length} users`}
            </Button>
            <FileUploadCancelButton
              onCancel={resetUpload}
              disabled={uploadDisabled || isImporting}
            />
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-danger">{uploadError}</p>
          {!showPreviewActions && (
            <FileUploadCancelButton
              onCancel={resetUpload}
              disabled={uploadDisabled || isImporting}
            />
          )}
        </div>
      )}
    </div>
  );
}
