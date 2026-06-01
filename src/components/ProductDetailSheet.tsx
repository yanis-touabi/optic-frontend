import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Barcode,
  Tag,
  Box,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Eye,
  ExternalLink,
  Hash,
  ShoppingCart,
  PackageX,
  Layers,
  Calendar,
  Store,
} from 'lucide-react';
import { formatDZD, formatDate } from '@/lib/format';
import type { Produit } from '@/lib/types';

// ── Category config (consistent with Produits.tsx) ──
const catLabel: Record<string, string> = {
  MONTURE: 'Monture',
  VERRE: 'Verre',
  ACCESSOIRE: 'Accessoire',
};

const catColors: Record<string, string> = {
  MONTURE: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300',
  VERRE: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300',
  ACCESSOIRE: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
};

// ── Stock urgency helpers ──
function stockUrgency(stock: number): {
  level: 'critical' | 'warning' | 'normal';
  label: string;
  color: string;
  bg: string;
  dot: string;
} {
  if (stock <= 0)
    return {
      level: 'critical',
      label: 'Épuisé',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
      dot: 'bg-red-500',
    };
  if (stock <= 2)
    return {
      level: 'warning',
      label: 'Critique',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-400',
    };
  if (stock <= 5)
    return {
      level: 'warning',
      label: 'Faible',
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
      dot: 'bg-orange-400',
    };
  return {
    level: 'normal',
    label: 'Suffisant',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  };
}

function MarginIndicator({ margin }: { margin?: number }) {
  if (margin == null) return null;
  const good = margin >= 30;
  const ok = margin >= 15;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        good
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : ok
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      <TrendingUp className="h-3 w-3" />
      {margin.toFixed(1)}%
    </span>
  );
}

// ── Props ──
interface ProductDetailSheetProps {
  product: Produit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: ProductDetailSheetProps) {
  const navigate = useNavigate();

  if (!product) return null;

  const urgency = stockUrgency(product.stock);

  const handleGoToProduct = () => {
    onOpenChange(false);
    navigate(`/produits?id=${product.id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          {/* Stock urgency banner */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${urgency.bg} mb-2`}
          >
            {product.stock <= 0 ? (
              <PackageX className={`h-4 w-4 ${urgency.color}`} />
            ) : (
              <AlertTriangle className={`h-4 w-4 ${urgency.color}`} />
            )}
            <span className={`text-xs font-bold uppercase tracking-wide ${urgency.color}`}>
              {urgency.label}
            </span>
            <span className={`ml-auto text-xs font-bold tabular-nums ${urgency.color}`}>
              {product.stock} unité{product.stock !== 1 ? 's' : ''}
            </span>
          </div>

          <SheetTitle className="text-lg flex items-start gap-2">
            <span className="flex-1">{product.nom}</span>
            {product.marque && (
              <span className="text-sm font-normal text-muted-foreground">
                {product.marque}
                {product.modele ? ` ${product.modele}` : ''}
              </span>
            )}
          </SheetTitle>

          <SheetDescription className="flex flex-wrap items-center gap-2 mt-1">
            {/* Category badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                catColors[product.categorie] ?? ''
              }`}
            >
              {catLabel[product.categorie] ?? product.categorie}
            </span>

            {/* SKU if available */}
            {product.sku && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                <Hash className="h-3 w-3" />
                {product.sku}
              </span>
            )}

            {/* Barcode if available */}
            {product.barcode && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                <Barcode className="h-3 w-3" />
                {product.barcode}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Product image placeholder */}
        <div className="flex items-center justify-center h-32 rounded-xl bg-gradient-to-br from-muted/50 to-muted border border-border mb-4">
          <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
            <Package className="h-8 w-8" />
            <span className="text-[10px] font-medium">Aperçu du produit</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Stock */}
          <div className="rounded-lg bg-muted/30 border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Box className="h-3.5 w-3.5" />
              Stock actuel
            </div>
            <div className={`text-lg font-bold tabular-nums ${urgency.color}`}>
              {product.stock}
            </div>
          </div>

          {/* Prix de vente */}
          <div className="rounded-lg bg-muted/30 border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Prix de vente
            </div>
            <div className="text-lg font-bold tabular-nums">
              {product.sellingPrice != null
                ? formatDZD(product.sellingPrice)
                : '—'}
            </div>
          </div>

          {/* Prix d'achat */}
          <div className="rounded-lg bg-muted/30 border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              Prix d'achat
            </div>
            <div className="text-lg font-bold tabular-nums text-muted-foreground">
              {product.purchasePrice != null
                ? formatDZD(product.purchasePrice)
                : '—'}
            </div>
          </div>

          {/* Marge */}
          <div className="rounded-lg bg-muted/30 border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Marge
            </div>
            <div className="text-lg font-bold tabular-nums flex items-center gap-2">
              {product.profitAmount != null ? (
                <>
                  {formatDZD(product.profitAmount)}
                  <MarginIndicator margin={product.profitMargin} />
                </>
              ) : product.profitMargin != null ? (
                <MarginIndicator margin={product.profitMargin} />
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>

        {/* Product details list */}
        <div className="space-y-2 mb-4">
          {/* Marque & Modèle */}
          {(product.marque || product.modele) && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Marque / Modèle
              </span>
              <span className="text-sm font-medium">
                {[product.marque, product.modele].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}

          {/* SKU */}
          {product.sku && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                SKU / Référence
              </span>
              <span className="text-sm font-mono font-medium">{product.sku}</span>
            </div>
          )}

          {/* Code-barres */}
          {product.barcode && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Barcode className="h-3.5 w-3.5" />
                Code-barres
              </span>
              <span className="text-sm font-mono font-medium">{product.barcode}</span>
            </div>
          )}

          {/* Catégorie */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Catégorie
            </span>
            <span className="text-sm font-medium">
              {catLabel[product.categorie] ?? product.categorie}
            </span>
          </div>

          {/* Date de création */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Ajouté le
            </span>
            <span className="text-sm font-medium">{formatDate(product.createdAt)}</span>
          </div>
        </div>

        {/* Description (if any) */}
        {product.description && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Description
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        <Separator className="my-4" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            className="flex-1 gap-2"
            onClick={handleGoToProduct}
          >
            <ExternalLink className="h-4 w-4" />
            Voir dans le catalogue
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate(`/produits?q=${encodeURIComponent(product.nom)}`);
            }}
          >
            <Eye className="h-4 w-4" />
            Rechercher
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}