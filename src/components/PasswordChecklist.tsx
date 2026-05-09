import { Check, X } from 'lucide-react';
import { evaluatePassword } from '@/lib/password-policy';
import { cn } from '@/lib/utils';

export default function PasswordChecklist({ password }: { password: string }) {
  const items = evaluatePassword(password);
  return (
    <ul className="space-y-1 rounded-md border bg-muted/30 p-3 text-xs">
      {items.map((it) => (
        <li
          key={it.key}
          className={cn(
            'flex items-center gap-2',
            it.ok ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {it.ok ? (
            <Check className="h-3.5 w-3.5 text-primary" />
          ) : (
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
