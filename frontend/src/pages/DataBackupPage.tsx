import { useState } from 'react';
import { Database, Download, Upload } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { downloadDataBackup, importDataBackup } from '@/api/dataTransfer.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';

export function DataBackupPage() {
  const isSuperAdmin = useAuthStore((s) => s.user?.role === 'SUPER_ADMIN');
  const filterLabel = useSchoolFilterStore((s) => s.getFilterLabel());
  const selectedSchoolIds = useSchoolFilterStore((s) => s.selectedSchoolIds);

  const [file, setFile] = useState<File | null>(null);
  const [confirmImport, setConfirmImport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setResult(null);
    try {
      const schoolId =
        isSuperAdmin && selectedSchoolIds.length === 1 ? selectedSchoolIds[0] : undefined;
      await downloadDataBackup(schoolId);
      setResult('Backup file downloaded.');
    } catch (err) {
      logApiError('Export failed', err);
      setError(getApiErrorMessage(err, 'Could not export data.'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    setIsValidating(true);
    setError(null);
    setResult(null);
    try {
      const res = await importDataBackup(file, true);
      setResult(
        `Validation OK — would import: ${res.imported.schools} schools, ${res.imported.users} users, ${res.imported.quizzes} quizzes, ${res.imported.questions} questions, ${res.imported.studentResponses} responses.`,
      );
    } catch (err) {
      logApiError('Validate import failed', err);
      setError(getApiErrorMessage(err, 'Backup file could not be validated.'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file || !confirmImport) return;
    setIsImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await importDataBackup(file, false);
      setResult(
        `Import complete — merged ${res.imported.schools} schools, ${res.imported.users} users, ${res.imported.quizzes} quizzes, ${res.imported.questions} questions.`,
      );
      setFile(null);
      setConfirmImport(false);
    } catch (err) {
      logApiError('Import failed', err);
      setError(getApiErrorMessage(err, 'Could not import backup.'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Data backup &amp; restore</h1>
        <p className="text-muted">
          {isSuperAdmin
            ? `Export or import school data as JSON. Use the school filter in the header (${filterLabel}) to scope exports.`
            : 'Export or import your school’s data (users, quizzes, questions, responses, and more) as JSON.'}
        </p>
      </div>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export backup
        </CardTitle>
        <p className="mt-2 text-sm text-muted">
          Downloads a JSON file you can store offline. User password hashes are included so
          accounts can be restored; keep the file secure.
        </p>
        <ul className="mt-3 list-inside list-disc text-sm text-muted">
          <li>Schools, users, classes, quizzes, questions</li>
          <li>Parent–student links, quiz responses, feedback</li>
          {isSuperAdmin && <li>Platform settings (when exporting without a single-school filter)</li>}
        </ul>
        <Button className="mt-4" onClick={handleExport} disabled={isExporting}>
          {isExporting ? 'Exporting…' : 'Download backup'}
        </Button>
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Import / restore
        </CardTitle>
        <p className="mt-2 text-sm text-muted">
          Upload a Quizzy backup JSON file. Existing rows with the same IDs are updated (merge).
          New rows are added. This does not delete data missing from the file.
        </p>
        <div className="mt-4 space-y-3">
          <input
            type="file"
            accept="application/json,.json"
            className="block w-full text-sm text-muted file:mr-4 file:rounded-xl file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setConfirmImport(false);
              setResult(null);
              setError(null);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!file || isValidating}
              onClick={handleValidate}
            >
              {isValidating ? 'Validating…' : 'Validate file'}
            </Button>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmImport}
              onChange={(e) => setConfirmImport(e.target.checked)}
              disabled={!file}
            />
            <span>
              I understand this will merge data into the live database and may overwrite
              existing records with matching IDs.
            </span>
          </label>
          <Button
            variant="outline"
            className="text-danger hover:border-danger/40"
            disabled={!file || !confirmImport || isImporting}
            onClick={handleImport}
          >
            <Database className="h-4 w-4" />
            {isImporting ? 'Importing…' : 'Import backup'}
          </Button>
        </div>
      </Card>

      {error && (
        <Card>
          <p className="text-danger">{error}</p>
        </Card>
      )}
      {result && (
        <Card>
          <p className="text-sm text-success">{result}</p>
        </Card>
      )}
    </div>
  );
}
