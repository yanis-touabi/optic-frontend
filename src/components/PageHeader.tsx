import { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className=" top-0 z-20 no-print">
      {/* Layered background: card base + subtle gradient overlay */}
      <div className="relative bg-card/95 backdrop-blur-sm">
        {/* Primary-coloured left accent bar */}
        <div
          className="absolute inset-y-0 left-0 w-[3px] rounded-r-full"
          style={{ background: 'var(--gradient-primary)' }}
          aria-hidden="true"
        />

        {/* Bottom shadow rendered as a gradient fade for depth */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, hsl(var(--primary)/0.35) 0%, hsl(var(--border)) 30%, hsl(var(--border)) 100%)',
          }}
          aria-hidden="true"
        />

        <div
          className="px-8 py-5 flex items-center justify-between gap-6 page-header-shadow"
          style={{
            boxShadow:
              '0 4px 24px -4px hsl(var(--primary)/0.08), 0 1px 4px 0 hsl(215 30% 15%/0.06)',
          }}
        >
          {/* Title + description */}
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-snug truncate">
              {title}
            </h1>
            {description && (
              <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed truncate">
                {description}
              </p>
            )}
          </div>

          {/* Actions slot */}
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      </div>
    </header>
  );
}
