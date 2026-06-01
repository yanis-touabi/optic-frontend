/**
 * Reusable label/value pair used across all view panels.
 * Displays "—" when value is null/undefined/empty string.
 */
import { cn } from '@/lib/utils';

interface DetailFieldProps {
  label: string;
  value?: string | number | null;
  /** Optional extra className on the value element */
  valueClassName?: string;
  /** Render the value as monospace (for SKU, barcode, etc.) */
  mono?: boolean;
  /** Render the value preserving whitespace (for notes, addresses) */
  preWrap?: boolean;
}

export function DetailField({
  label,
  value,
  valueClassName,
  mono = false,
  preWrap = false,
}: DetailFieldProps) {
  const displayValue =
    value === null || value === undefined || value === '' ? '—' : value;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <span
        className={cn(
          'text-sm text-foreground',
          mono && 'font-mono',
          preWrap && 'whitespace-pre-wrap',
          valueClassName,
        )}
      >
        {displayValue}
      </span>
    </div>
  );
}
