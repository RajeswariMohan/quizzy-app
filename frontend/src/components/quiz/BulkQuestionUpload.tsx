import { useRef, useState } from 'react';
import { Download, FileUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FileUploadCancelButton, SelectedFileRow } from '@/components/ui/FileUploadCancel';
import { bulkImportQuestions } from '@/api/questions.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import {
  downloadQuestionImportTemplate,
  parseQuestionsCsv,
  type CsvParseError,
} from '@/utils/questionCsvImport';
import type { ManualQuestionPayload } from '@/types/quiz';

interface BulkQuestionUploadProps {
  disabled?: boolean;
  ensureQuiz: () => Promise<string>;
  onImported: (count: number, quizId: string) => void;
}

export function BulkQuestionUpload({
  disabled,
  ensureQuiz,
  onImported,
}: BulkQuestionUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ManualQuestionPayload[]>([]);
  const [parseErrors, setParseErrors] = useState<CsvParseError[]>([]);
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
    const file = event.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    setFileName(file.name);
    try {
      const text = await file.text();
      const result = parseQuestionsCsv(text);
      setPreview(result.questions);
      setParseErrors(result.errors);
    } catch (err) {
      logApiError('CSV parse failed', err);
      setPreview([]);
      setParseErrors([{ row: 0, message: 'Could not read file.' }]);
    }
    event.target.value = '';
  };

  const showPreviewActions = preview.length > 0;

  const handleImport = async () => {
    if (preview.length === 0) return;
    setIsImporting(true);
    setUploadError(null);
    try {
      const id = await ensureQuiz();
      const result = await bulkImportQuestions(id, preview);
      resetUpload();
      onImported(result.importedCount, id);
    } catch (err) {
      logApiError('Bulk import failed', err);
      setUploadError(getApiErrorMessage(err, 'Import failed.'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-surface p-4">
      <p className="text-sm font-medium text-ink">Bulk CSV / Excel upload</p>
      <p className="mt-1 text-xs text-muted">
        Download the template, fill in rows in Excel or Sheets, save as CSV UTF-8, then
        upload. Questions appear in your quiz and analytics after students answer.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadQuestionImportTemplate}
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

      <SelectedFileRow
        fileName={fileName}
        onCancel={resetUpload}
        disabled={disabled || isImporting}
        showCancel={!showPreviewActions && parseErrors.length === 0}
      />

      {parseErrors.length > 0 && (
        <div className="mt-3 space-y-2">
          <ul className="space-y-1 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
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
              disabled={disabled || isImporting}
            />
          )}
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-ink">
            Ready to import {preview.length} question{preview.length === 1 ? '' : 's'}
          </p>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-white text-xs">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50 text-muted">
                <tr>
                  <th className="px-2 py-1">#</th>
                  <th className="px-2 py-1">Question</th>
                  <th className="px-2 py-1">Correct</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 8).map((q, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-2 py-1">{i + 1}</td>
                    <td className="max-w-[200px] truncate px-2 py-1">{q.questionText}</td>
                    <td className="px-2 py-1">
                      {String.fromCharCode(65 + q.correctOptionIndex)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 8 && (
              <p className="px-2 py-1 text-muted">…and {preview.length - 8} more</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleImport}
              disabled={disabled || isImporting || parseErrors.length > 0}
            >
              <Upload className="h-4 w-4" />
              {isImporting ? 'Importing…' : `Import ${preview.length} questions`}
            </Button>
            <FileUploadCancelButton
              onCancel={resetUpload}
              disabled={disabled || isImporting}
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
              disabled={disabled || isImporting}
            />
          )}
        </div>
      )}
    </div>
  );
}
