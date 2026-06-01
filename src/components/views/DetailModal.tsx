/**
 * Generic Modal (Dialog) wrapper for compact view panels (e.g. Produit).
 * - Escape key closes (native Radix behaviour)
 * - Click-outside closes
 * - Smooth fade-in/scale animation via Radix data-[state] classes
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface DetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  /** Override max-width; default is max-w-lg */
  maxWidth?: string;
  children: ReactNode;
}

export function DetailModal({
  open,
  onOpenChange,
  title,
  subtitle,
  maxWidth = 'max-w-lg',
  children,
}: DetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'overflow-y-auto max-h-[90vh]',
          maxWidth,
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {subtitle && (
            <DialogDescription className="text-sm text-muted-foreground">
              {subtitle}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-5 pt-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
