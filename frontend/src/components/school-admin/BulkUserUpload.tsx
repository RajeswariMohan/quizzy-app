import { useRef, useState } from 'react';
import { Download, FileUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
  type UserCsvParseError,
} from '@/utils/userCsvImport';

interface BulkUserUploadProps {
  academics: SchoolAcademicConfig | null;
  disabled?: boolean;
  onImported: (count: number) => void;
}

export function BulkUserUpload({ academics, disabled, onImported }: BulkUserUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<CreateSchoolUserPayload[]>([]);
  const [parseErrors, setParseErrors] = useState<UserCsvParseError[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setPreview([]);
      setFileName(null);
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

  return (
    <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-surface p-4">
      <p className="text-sm font-medium text-ink">Bulk CSV upload</p>
      <p className="mt-1 text-xs text-muted">
        Download the template, add one row per user in Excel or Sheets, save as CSV UTF-8, then
        upload to create accounts in one go.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadUserImportTemplate(academics)}
          disabled={disabled || isImporting}
        >
          <Download className="h-4 w-4" />
          Download template
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isImporting}
        >
          <FileUp className="h-4 w-4" />
          Choose CSV file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {fileName && (
        <p className="mt-2 text-xs text-muted">
          Selected: <span className="font-medium text-ink">{fileName}</span>
        </p>
      )}

      {parseErrors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          {parseErrors.map((e, i) => (
            <li key={`${e.row}-${i}`}>
              {e.row > 0 ? `Row ${e.row}: ` : ''}
              {e.message}
            </li>
          ))}
        </ul>
      )}

      {preview.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-ink">
            Ready to import {preview.length} user{preview.length === 1 ? '' : 's'}
          </p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white text-xs">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50 text-muted">
                <tr>
                  <th className="px-2 py-1">#</th>
                  <th className="px-2 py-1">Name</th>
                  <th className="px-2 py-1">Email</th>
                  <th className="px-2 py-1">Role</th>
                  <th className="px-2 py-1">Grade</th>
                  <th className="px-2 py-1">Section</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((u, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-2 py-1">{i + 1}</td>
                    <td className="px-2 py-1">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="max-w-[140px] truncate px-2 py-1">{u.email}</td>
                    <td className="px-2 py-1">{u.role}</td>
                    <td className="px-2 py-1">{u.grade ?? '—'}</td>
                    <td className="px-2 py-1">{u.section ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <p className="px-2 py-1 text-muted">…and {preview.length - 10} more</p>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleImport}
            disabled={disabled || isImporting}
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing…' : `Import ${preview.length} users`}
          </Button>
        </div>
      )}

      {uploadError && <p className="mt-2 text-xs text-danger">{uploadError}</p>}
    </div>
  );
}
