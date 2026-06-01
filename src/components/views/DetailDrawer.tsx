/**
 * Generic Slide-over Drawer (Sheet, right side) wrapper for dense view panels
 * (Client, Ordonnance).
 * - Escape key closes (native Radix behaviour)
 * - Click-outside overlay closes
 * - Smooth slide-in-from-right animation via Radix data-[state] classes
 * - Wider than the shadcn default (max-w-xl) for complex layouts
 */
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ReactNode } from 'react';

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col"
      >
        {/* Fixed header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          {subtitle && (
            <SheetDescription className="text-sm text-muted-foreground">
              {subtitle}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 space-y-6">{children}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
