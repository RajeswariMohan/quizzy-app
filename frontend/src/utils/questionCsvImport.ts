import type { ManualQuestionPayload } from '@/types/quiz';

export const QUESTION_IMPORT_TEMPLATE_CSV = `# Quizzy MCQ import template (open in Excel or Google Sheets, then Save As CSV UTF-8)
# Columns: question_text | option_a-d | correct_option (A/B/C/D) | explanation (optional) | points (optional)
question_text,option_a,option_b,option_c,option_d,correct_option,explanation,points
"What is 2+2?",3,4,5,6,B,Two plus two equals four,10
"What is the capital of France?",London,Berlin,Paris,Rome,C,Paris is the capital,10
`;

export interface CsvParseError {
  row: number;
  message: string;
}

export interface CsvParseResult {
  questions: ManualQuestionPayload[];
  errors: CsvParseError[];
}

const REQUIRED_HEADERS = [
  'question_text',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_option',
] as const;

export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function normalizeCsvHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function parseCorrectOptionIndex(value: string): number | null {
  const v = value.trim().toUpperCase();
  if (v === 'A' || v === '1') return 0;
  if (v === 'B' || v === '2') return 1;
  if (v === 'C' || v === '3') return 2;
  if (v === 'D' || v === '4') return 3;
  return null;
}

export function downloadQuestionImportTemplate(): void {
  const blob = new Blob([QUESTION_IMPORT_TEMPLATE_CSV], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quizzy-questions-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function parseQuestionsCsv(text: string): CsvParseResult {
  const questions: ManualQuestionPayload[] = [];
  const errors: CsvParseError[] = [];

  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    errors.push({ row: 0, message: 'File is empty.' });
    return { questions, errors };
  }

  const headerCells = parseCsvLine(lines[0]).map(normalizeCsvHeader);
  const headerIndex = new Map<string, number>();
  headerCells.forEach((h, i) => headerIndex.set(h, i));

  for (const required of REQUIRED_HEADERS) {
    if (!headerIndex.has(required)) {
      errors.push({
        row: 1,
        message: `Missing column "${required}". Download the template for the correct format.`,
      });
      return { questions, errors };
    }
  }

  const explanationIdx = headerIndex.get('explanation');
  const pointsIdx = headerIndex.get('points');

  for (let i = 1; i < lines.length; i += 1) {
    const rowNum = i + 1;
    const cells = parseCsvLine(lines[i]);
    if (cells.every((c) => !c.trim())) continue;

    const get = (key: string) => cells[headerIndex.get(key)!] ?? '';

    const questionText = get('question_text').trim();
    const options = [
      get('option_a').trim(),
      get('option_b').trim(),
      get('option_c').trim(),
      get('option_d').trim(),
    ] as [string, string, string, string];

    const correctRaw = get('correct_option');
    const correctOptionIndex = parseCorrectOptionIndex(correctRaw);

    if (!questionText) {
      errors.push({ row: rowNum, message: 'question_text is required.' });
      continue;
    }

    if (options.some((o) => !o)) {
      errors.push({ row: rowNum, message: 'All four options (A–D) are required.' });
      continue;
    }

    if (correctOptionIndex === null) {
      errors.push({
        row: rowNum,
        message: `correct_option must be A, B, C, or D (got "${correctRaw}").`,
      });
      continue;
    }

    const explanation =
      explanationIdx !== undefined ? cells[explanationIdx]?.trim() : undefined;
    const pointsRaw = pointsIdx !== undefined ? cells[pointsIdx]?.trim() : '';
    const points = pointsRaw ? Number.parseInt(pointsRaw, 10) : undefined;

    if (pointsRaw && (Number.isNaN(points) || (points ?? 0) < 1)) {
      errors.push({ row: rowNum, message: 'points must be a positive number.' });
      continue;
    }

    questions.push({
      questionText,
      options,
      correctOptionIndex,
      explanation: explanation || undefined,
      ...(points !== undefined ? { points } : {}),
    });
  }

  if (questions.length === 0 && errors.length === 0) {
    errors.push({ row: 0, message: 'No question rows found in file.' });
  }

  if (questions.length > 100) {
    return {
      questions: [],
      errors: [{ row: 0, message: 'Maximum 100 questions per upload.' }],
    };
  }

  return { questions, errors };
}
