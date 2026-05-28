import { useState } from 'react';
import { Play } from 'lucide-react';
import { DemoVideoModal } from '@/components/landing/DemoVideoModal';
import { cn } from '@/lib/cn';

interface WatchDemoButtonProps {
  className?: string;
  variant?: 'hero' | 'header' | 'cta';
}

export function WatchDemoButton({ className, variant = 'hero' }: WatchDemoButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          variant === 'hero' &&
            'w-full border border-gray-200 bg-white px-6 py-3 text-base text-ink shadow-sm hover:border-primary/30 hover:bg-primary/5 sm:w-auto',
          variant === 'header' &&
            'border border-gray-200 bg-white px-3 py-1.5 text-sm text-ink hover:bg-gray-50',
          variant === 'cta' &&
            'min-w-[160px] border border-white/40 bg-white/10 px-6 py-3 text-base text-white hover:bg-white/20 [&_svg]:text-white',
          className,
        )}
      >
        <Play
          className={cn('h-4 w-4', variant === 'cta' ? 'text-white' : 'text-primary')}
          aria-hidden
        />
        Watch demo
      </button>
      <DemoVideoModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
