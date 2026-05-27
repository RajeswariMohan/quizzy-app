import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Applied to the outer wrapper (use for grid col-span, margins, etc.). */
  wrapperClassName?: string;
};

const inputBaseClass =
  'w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm outline-none focus:border-primary';

export function PasswordInput({
  className = '',
  wrapperClassName = '',
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      <input
        type={visible ? 'text' : 'password'}
        className={`${inputBaseClass} ${className}`.trim()}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted hover:text-ink"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
