interface FieldSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function FieldSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  placeholder,
}: FieldSelectProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <select
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-gray-50"
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
