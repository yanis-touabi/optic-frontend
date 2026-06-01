/**
 * UX CHOICE: Slide-over Drawer (Sheet, right side)
 * Ordonnance data is structured but complex — two eye groups (OD/OG) each
 * with 8 fields, plus dates and pupillary distance. A wider drawer (max-w-xl)
 * renders the side-by-side OD/OG table cleanly without the user losing the
 * list context. A modal would feel cramped; a full page would be overkill for
 * read-only prescription data.
 */
import type { Ordonnance } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/format';
import { DetailDrawer } from './DetailDrawer';
import { DetailField } from './DetailField';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Stethoscope, Calendar, Clock, FileText, Ruler } from 'lucide-react';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function OrdonnanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
      <div className="border-t" />
      <Skeleton className="h-36 w-full rounded-lg" />
      <div className="border-t" />
      <Skeleton className="h-36 w-full rounded-lg" />
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// ── Prescription eye block ────────────────────────────────────────────────────

interface EyeBlockProps {
  label: string;
  sphere?: number | null;
  cylindre?: number | null;
  axe?: number | null;
  addition?: number | null;
  prisme?: number | null;
  base?: string | null;
  ecart?: number | null;
  hauteur?: number | null;
  colorClass: string;
}

function fmt(v?: number | null): string {
  if (v == null) return '—';
  return v > 0 ? `+${v}` : String(v);
}

function EyeBlock({
  label,
  sphere,
  cylindre,
  axe,
  addition,
  prisme,
  base,
  ecart,
  hauteur,
  colorClass,
}: EyeBlockProps) {
  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <Eye className="h-4 w-4" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
            Sphère
          </span>
          <span className="text-sm font-mono font-medium">{fmt(sphere)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
            Cylindre
          </span>
          <span className="text-sm font-mono font-medium">{fmt(cylindre)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
            Axe
          </span>
          <span className="text-sm font-mono font-medium">
            {axe != null ? `${axe}°` : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
            Addition
          </span>
          <span className="text-sm font-mono font-medium">{fmt(addition)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
            Prisme
          </span>
          <span className="text-sm font-mono font-medium">{fmt(prisme)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
            Base
          </span>
          <span className="text-sm font-mono font-medium">{base ?? '—'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
            Écart
          </span>
          <span className="text-sm font-mono font-medium">
            {ecart != null ? `${ecart} mm` : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
            Hauteur
          </span>
          <span className="text-sm font-mono font-medium">
            {hauteur != null ? `${hauteur} mm` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface OrdonnanceDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordonnance: Ordonnance | null;
  isLoading?: boolean;
}

export function OrdonnanceDetailDrawer({
  open,
  onOpenChange,
  ordonnance,
  isLoading = false,
}: OrdonnanceDetailDrawerProps) {
  const clientName = ordonnance?.client
    ? `${ordonnance.client.prenom ?? ''} ${ordonnance.client.nom ?? ''}`.trim()
    : '—';

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Ordonnance"
      subtitle={clientName !== '—' ? `Patient : ${clientName}` : undefined}
    >
      {isLoading || !ordonnance ? (
        <OrdonnanceSkeleton />
      ) : (
        <>
          {/* General info */}
          <div>
            <SectionHeading icon={Stethoscope} label="Informations générales" />
            <div className="grid grid-cols-2 gap-4">
              <DetailField
                label="Patient"
                value={clientName}
              />
              <DetailField
                label="Médecin prescripteur"
                value={ordonnance.nomMedecin}
              />
              <DetailField
                label="Date de prescription"
                value={formatDate(ordonnance.datePrescription)}
              />
              <DetailField
                label="Date d'expiration"
                value={formatDate(ordonnance.dateExpiration)}
              />
            </div>
          </div>

          <div className="border-t" />

          {/* Pupillary distance */}
          <div>
            <SectionHeading icon={Ruler} label="Distance pupillaire" />
            <DetailField
              label="DP totale"
              value={
                ordonnance.distancePupillaire != null
                  ? `${ordonnance.distancePupillaire} mm`
                  : null
              }
            />
          </div>

          <div className="border-t" />

          {/* Prescription values — OD & OG */}
          <div>
            <SectionHeading icon={Eye} label="Valeurs de correction" />
            <div className="space-y-3">
              <EyeBlock
                label="Œil Droit (OD)"
                sphere={ordonnance.odSphere}
                cylindre={ordonnance.odCylindre}
                axe={ordonnance.odAxe}
                addition={ordonnance.odAddition}
                prisme={ordonnance.odPrisme}
                base={ordonnance.odBase}
                ecart={ordonnance.ecartOd}
                hauteur={ordonnance.hauteurOd}
                colorClass="bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100"
              />
              <EyeBlock
                label="Œil Gauche (OG)"
                sphere={ordonnance.ogSphere}
                cylindre={ordonnance.ogCylindre}
                axe={ordonnance.ogAxe}
                addition={ordonnance.ogAddition}
                prisme={ordonnance.ogPrisme}
                base={ordonnance.ogBase}
                ecart={ordonnance.ecartOg}
                hauteur={ordonnance.hauteurOg}
                colorClass="bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100"
              />
            </div>
          </div>

          {/* Notes */}
          {ordonnance.notes && (
            <>
              <div className="border-t" />
              <div>
                <SectionHeading icon={FileText} label="Notes" />
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {ordonnance.notes}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="border-t" />

          {/* Meta */}
          <div>
            <SectionHeading icon={Clock} label="Métadonnées" />
            <DetailField
              label="Créée le"
              value={formatDateTime(ordonnance.createdAt)}
            />
          </div>
        </>
      )}
    </DetailDrawer>
  );
}
