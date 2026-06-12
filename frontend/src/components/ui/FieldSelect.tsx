interface FieldSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  compact?: boolean;
  className?: string;
}

export function FieldSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  compact = false,
  className,
}: FieldSelectProps) {
  return (
    <div className={className}>
      <label
        className={
          compact
            ? 'mb-0.5 block text-xs font-medium text-muted'
            : 'mb-1 block text-sm font-medium text-ink'
        }
      >
        {label}
      </label>
      <select
        required={required}
        disabled={disabled}
        className={
          compact
            ? 'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-primary disabled:bg-gray-50'
            : 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-gray-50'
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
