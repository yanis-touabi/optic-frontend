/**
 * UX CHOICE: Modal (Dialog)
 * Produit is a compact, scannable record — name, brand, prices, stock, margin.
 * A modal keeps the user in context of the products table while showing full
 * details. No navigation needed for a simple inventory record.
 */
import type { Produit, ProduitCategorie } from '@/lib/types';
import { formatDZD, formatDate } from '@/lib/format';
import { DetailModal } from './DetailModal';
import { DetailField } from './DetailField';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Package } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const catLabel: Record<ProduitCategorie, string> = {
  MONTURE: 'Monture',
  VERRE: 'Verre',
  ACCESSOIRE: 'Accessoire',
};

const catColors: Record<ProduitCategorie, string> = {
  MONTURE:
    'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300',
  VERRE:
    'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300',
  ACCESSOIRE:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
};

function StockBadge({ stock }: { stock?: number }) {
  if (stock == null) return <span className="text-sm text-muted-foreground">—</span>;
  const color =
    stock === 0
      ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300'
      : stock <= 3
        ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}
    >
      <Package className="h-3 w-3" />
      {stock} en stock
    </span>
  );
}

function MarginBadge({ margin }: { margin?: number }) {
  if (margin == null) return <span className="text-sm text-muted-foreground">—</span>;
  const good = margin >= 30;
  const ok = margin >= 15;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
        good
          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
          : ok
            ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      {good ? (
        <TrendingUp className="h-3 w-3" />
      ) : ok ? null : (
        <TrendingDown className="h-3 w-3" />
      )}
      {margin.toFixed(1)}%
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProduitSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ProduitDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produit: Produit | null;
  isLoading?: boolean;
}

export function ProduitDetailModal({
  open,
  onOpenChange,
  produit,
  isLoading = false,
}: ProduitDetailModalProps) {
  const subtitle = produit
    ? [produit.marque, produit.modele].filter(Boolean).join(' · ')
    : undefined;

  return (
    <DetailModal
      open={open}
      onOpenChange={onOpenChange}
      title={produit?.nom ?? 'Produit'}
      subtitle={subtitle}
    >
      {isLoading || !produit ? (
        <ProduitSkeleton />
      ) : (
        <>
          {/* Category badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${catColors[produit.categorie]}`}
            >
              {catLabel[produit.categorie]}
            </span>
            <StockBadge stock={produit.stock} />
          </div>

          {/* Separator */}
          <div className="border-t" />

          {/* Pricing section */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
              Tarification
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DetailField
                label="Prix d'achat"
                value={
                  produit.purchasePrice != null
                    ? formatDZD(produit.purchasePrice)
                    : null
                }
              />
              <DetailField
                label="Prix de vente"
                value={
                  produit.sellingPrice != null
                    ? formatDZD(produit.sellingPrice)
                    : null
                }
              />
              <DetailField
                label="Prix public"
                value={
                  produit.prix != null ? formatDZD(produit.prix) : null
                }
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Marge
                </span>
                <MarginBadge margin={produit.profitMargin} />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t" />

          {/* Description */}
          {produit.description && (
            <>
              <DetailField
                label="Description"
                value={produit.description}
                preWrap
              />
              <div className="border-t" />
            </>
          )}

          {/* Identity / meta */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
              Identification
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="SKU" value={produit.sku} mono />
              <DetailField label="Code-barres" value={produit.barcode} mono />
              <DetailField
                label="Ajouté le"
                value={formatDate(produit.createdAt)}
              />
            </div>
          </div>
        </>
      )}
    </DetailModal>
  );
}
