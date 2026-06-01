import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Download,
  Barcode,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  CheckCircle2,
  Ban,
  PackageX,
} from 'lucide-react';
import { exportToCSV } from '@/lib/csv';
import { formatDZD } from '@/lib/format';
import {
  STOCK_THRESHOLDS,
  stockFilterPredicate,
  stockStatusFromQuery,
  getStockConfig,
  type StockStatus,
} from '@/lib/stock-thresholds';
import {
  usePaginatedProduits,
  useCreateProduit,
  useUpdateProduit,
  useDeleteProduit,
  DEFAULT_PAGE_SIZE,
} from '@/lib/data';
import { useDebounce } from '@/hooks/use-debounce';
import type { Produit, ProduitCategorie } from '@/lib/types';
import { toast } from 'sonner';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { SortableTableHead } from '@/components/SortableTableHead';
import { apiClient } from '@/api/apiClient';

// ── Constants ────────────────────────────────────────────────────────────────

type FormState = Omit<
  Produit,
  'id' | 'createdAt' | 'profitAmount' | 'profitMargin' | 'prix' | 'stock'
> & {
  prix?: number;
  stock?: number;
  barcodeMode: 'none' | 'auto' | 'custom';
  skuMode: 'auto' | 'custom';
};

const empty: FormState = {
  nom: '',
  marque: '',
  modele: '',
  categorie: 'MONTURE',
  description: '',
  prix: undefined,
  stock: undefined,
  purchasePrice: undefined,
  sellingPrice: undefined,
  sku: undefined,
  barcode: undefined,
  barcodeMode: 'none',
  skuMode: 'auto',
};

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

const ALL_CATS = ['ALL', 'MONTURE', 'VERRE', 'ACCESSOIRE'] as const;
type CatFilter = (typeof ALL_CATS)[number];

// ── Helpers ──────────────────────────────────────────────────────────────────

function MarginBadge({ margin }: { margin?: number }) {
  if (margin == null) return null;
  const good = margin >= 30;
  const ok = margin >= 15;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
        good
          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
          : ok
            ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      {good ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : ok ? null : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      {margin.toFixed(1)}%
    </span>
  );
}

async function downloadBarcode(produitId: string, nom: string) {
  try {
    const response = await apiClient.get(`/products/${produitId}/barcode`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(
      new Blob([response.data as BlobPart]),
    );
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `barcode-${nom.replace(/\s+/g, '-')}.png`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Code-barres téléchargé');
  } catch {
    toast.error('Erreur lors du téléchargement du code-barres');
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Produits() {
  const [searchParams] = useSearchParams();
  const stockAlertParam = searchParams.get('stockAlert') === 'true';
  const sortParam = searchParams.get('sort') ?? undefined;
  const orderParam = (searchParams.get('order') ?? 'asc') as 'asc' | 'desc';

  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [catFilter, setCatFilter] = useState<CatFilter>('ALL');
  const [stockAlertFilter, setStockAlertFilter] = useState(stockAlertParam);
  const debouncedSearch = useDebounce(q, 300);

  // ── Stock status filter (from ?stock= query param) ──
  const stockQueryValue = searchParams.get('stock');
  const initialStockFilter = stockStatusFromQuery(stockQueryValue);
  const [stockFilter, setStockFilter] = useState<StockStatus | null>(
    initialStockFilter,
  );

  const { sort, order, onSort, directionFor } = useSortableTable(
    sortParam ?? 'nom',
    sortParam ? orderParam : 'asc',
  );

  // Sync stockAlert flag when URL param changes (e.g. back-navigation)
  useEffect(() => {
    setStockAlertFilter(stockAlertParam);
  }, [stockAlertParam]);

  // Sync stock filter from URL query param on mount/navigation
  useEffect(() => {
    const urlStatus = stockStatusFromQuery(searchParams.get('stock'));
    setStockFilter(urlStatus);
    setPage(0);
  }, [searchParams.get('stock')]);

  // When stockAlert filter is on, override the search with stock<=2 equivalent.
  // The backend sorts by stock asc so low/zero items surface first.
  const effectiveSort = stockAlertFilter ? 'stock' : sort;
  const effectiveOrder = stockAlertFilter ? 'asc' : order;

  const { data, isLoading } = usePaginatedProduits({
    page,
    size: pageSize,
    q: debouncedSearch,
    categorie: catFilter === 'ALL' ? undefined : catFilter,
    sort: effectiveSort,
    order: effectiveOrder,
    stock: stockFilter ?? undefined,
  });

  const createMut = useCreateProduit();
  const updateMut = useUpdateProduit();
  const deleteMut = useDeleteProduit();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  // Stock filter is now handled server-side via the ?stock= query param
  const produits = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p: Produit) => {
    setEditing(p);
    setForm({
      nom: p.nom ?? '',
      marque: p.marque ?? '',
      modele: p.modele ?? '',
      categorie: p.categorie ?? 'MONTURE',
      description: p.description ?? '',
      prix: p.prix ?? 0,
      stock: p.stock ?? 0,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      sku: p.sku ?? undefined,
      barcode: p.barcode ?? undefined,
      barcodeMode: p.barcode ? 'custom' : 'none',
      skuMode: p.sku ? 'custom' : 'auto',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.nom.trim()) return toast.error('Le nom est requis');
    try {
      // Build barcode value based on mode
      let barcodeVal: string | undefined | null;
      if (form.barcodeMode === 'auto') barcodeVal = 'AUTO';
      else if (form.barcodeMode === 'custom')
        barcodeVal = form.barcode?.trim() || undefined;
      else barcodeVal = null; // 'none' → clear barcode

      if (editing) {
        const patch: Record<string, unknown> = {
          nom: form.nom,
          marque: form.marque,
          modele: form.modele,
          categorie: form.categorie,
          description: form.description,
          prix: form.prix ?? 0,
          stock: form.stock ?? 0,
          purchasePrice: form.purchasePrice ?? undefined,
          sellingPrice: form.sellingPrice ?? undefined,
        };

        // SKU
        if (form.skuMode === 'custom' && form.sku?.trim()) {
          patch.sku = form.sku.trim();
        }

        // Barcode
        if (barcodeVal === 'AUTO') {
          patch.barcode = 'AUTO';
        } else if (barcodeVal === null) {
          patch.barcode = null;
        } else if (barcodeVal) {
          patch.barcode = barcodeVal;
        }

        await updateMut.mutateAsync({ id: editing.id, patch });
        toast.success('Produit mis à jour');
      } else {
        const payload: Record<string, unknown> = {
          nom: form.nom,
          marque: form.marque,
          modele: form.modele,
          categorie: form.categorie,
          description: form.description,
          prix: form.prix ?? 0,
          stock: form.stock ?? 0,
          purchasePrice: form.purchasePrice ?? undefined,
          sellingPrice: form.sellingPrice ?? undefined,
        };

        // SKU: only send if custom mode and non-empty
        if (form.skuMode === 'custom' && form.sku?.trim()) {
          payload.sku = form.sku.trim();
        }
        // else omit → backend auto-generates

        // Barcode
        if (barcodeVal === 'AUTO') {
          payload.barcode = 'AUTO';
        } else if (barcodeVal) {
          payload.barcode = barcodeVal;
        }
        // if 'none' → omit barcode entirely for creation

        await createMut.mutateAsync(payload as any);
        toast.success('Produit ajouté');
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Produit supprimé');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur');
    }
  };

  const handleExport = () => {
    exportToCSV(
      produits,
      {
        sku: 'SKU',
        nom: 'Nom',
        marque: 'Marque',
        modele: 'Modèle',
        categorie: 'Catégorie',
        purchasePrice: 'Prix achat (DZD)',
        sellingPrice: 'Prix vente (DZD)',
        prix: 'Prix public (DZD)',
        profitMargin: 'Marge (%)',
        stock: 'Stock',
      },
      'produits',
    );
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <>
      <PageHeader
        title="Produits"
        description="Catalogue de montures, verres et accessoires"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Nouveau produit
            </Button>
          </div>
        }
      />
      <div className="p-8 space-y-4">
        {/* ── Stock alert banner ── */}
        {stockAlertFilter && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/70 dark:bg-red-950/20 dark:border-red-900/50 px-4 py-2.5">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              Filtre actif : produits triés par stock croissant (stock faible en
              premier)
            </span>
            <button
              onClick={() => setStockAlertFilter(false)}
              className="ml-auto text-xs text-red-600 hover:text-red-800 dark:text-red-400 font-semibold underline underline-offset-2"
            >
              Effacer le filtre
            </button>
          </div>
        )}
        {/* ── Search + category tabs + page size ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Rechercher par nom, marque, SKU…"
              className="pl-9"
            />
          </div>
          {/* Category filter pills */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {ALL_CATS.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCatFilter(cat);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  catFilter === cat
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat === 'ALL' ? 'Tous' : catLabel[cat as ProduitCategorie]}
              </button>
            ))}
          </div>

          {/* Stock status filter dropdown */}
          <Select
            value={stockFilter ?? 'ALL'}
            onValueChange={(v) => {
              setStockFilter(v === 'ALL' ? null : (v as StockStatus));
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Filtrer par stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les stocks</SelectItem>
              {STOCK_THRESHOLDS.map((config) => (
                <SelectItem key={config.status} value={config.status}>
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${config.color.replace('text-', 'bg-').split(' ')[0]}`}
                    />
                    {config.label} ·{' '}
                    <span className="text-[10px] text-muted-foreground/70">
                      {config.thresholdDescription}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Total count */}
          <span className="text-sm text-muted-foreground ml-auto">
            {totalElements} produit{totalElements !== 1 ? 's' : ''}
          </span>
          {/* Page size */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Afficher</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Table ── */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-0">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    field="nom"
                    type="text"
                    direction={directionFor('nom')}
                    onSort={onSort}
                    className="w-[25%] md:w-[22%] lg:w-[20%]"
                  >
                    Produit
                  </SortableTableHead>
                  <TableHead className="w-[20%] md:w-[15%] lg:w-[12%]">
                    Catégorie
                  </TableHead>
                  <TableHead className="hidden md:table-cell md:w-[18%] lg:w-[15%]">
                    SKU
                  </TableHead>
                  <SortableTableHead
                    field="purchasePrice"
                    type="number"
                    direction={directionFor('purchasePrice')}
                    onSort={onSort}
                    className="text-right hidden lg:table-cell lg:w-[12%]"
                  >
                    P. Achat
                  </SortableTableHead>
                  <SortableTableHead
                    field="sellingPrice"
                    type="number"
                    direction={directionFor('sellingPrice')}
                    onSort={onSort}
                    className="text-right w-[25%] md:w-[18%] lg:w-[12%]"
                  >
                    P. Vente
                  </SortableTableHead>
                  <TableHead className="text-right hidden lg:table-cell lg:w-[10%]">
                    Marge
                  </TableHead>
                  <SortableTableHead
                    field="stock"
                    type="number"
                    direction={directionFor('stock')}
                    onSort={onSort}
                    className="text-center w-[15%] md:w-[12%] lg:w-[9%]"
                  >
                    Stock
                  </SortableTableHead>
                  <TableHead className="w-[15%] md:w-[15%] lg:w-[10%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : produits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-16">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Package className="h-10 w-10 opacity-30" />
                        <p className="text-sm">Aucun produit trouvé</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  produits.map((p) => (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <div className="font-medium leading-tight">{p.nom}</div>
                        {(p.marque || p.modele) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {[p.marque, p.modele].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            catColors[p.categorie]
                          }`}
                        >
                          {catLabel[p.categorie]}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p.sku ? (
                          <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {p.sku}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell tabular-nums text-sm">
                        {p.purchasePrice != null
                          ? formatDZD(p.purchasePrice)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-sm">
                        {p.sellingPrice != null
                          ? formatDZD(p.sellingPrice)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell">
                        <MarginBadge margin={p.profitMargin} />
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`text-sm font-medium tabular-nums ${
                            p.stock === 0
                              ? 'text-destructive'
                              : p.stock <= 3
                                ? 'text-warning'
                                : ''
                          }`}
                        >
                          {p.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {p.barcode && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Télécharger le code-barres"
                              onClick={() => downloadBarcode(p.id, p.nom)}
                            >
                              <Barcode className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(p.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className={
                    page === 0
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page + 1} sur {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  className={
                    page === totalPages - 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Modifier le produit' : 'Nouveau produit'}
            </DialogTitle>
            {editing?.sku && (
              <p className="text-xs text-muted-foreground mt-1">
                SKU :{' '}
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                  {editing.sku}
                </span>
              </p>
            )}
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Nom */}
            <div className="col-span-2">
              <Label>Nom *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex : Monture Ray-Ban RB5154"
              />
            </div>

            {/* Marque & Modèle */}
            <div>
              <Label>Marque</Label>
              <Input
                value={form.marque}
                onChange={(e) => setForm({ ...form, marque: e.target.value })}
                placeholder="Ex : Ray-Ban"
              />
            </div>
            <div>
              <Label>Modèle</Label>
              <Input
                value={form.modele}
                onChange={(e) => setForm({ ...form, modele: e.target.value })}
                placeholder="Ex : RB5154"
              />
            </div>

            {/* Catégorie */}
            <div>
              <Label>Catégorie</Label>
              <Select
                value={form.categorie}
                onValueChange={(v) =>
                  setForm({ ...form, categorie: v as ProduitCategorie })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTURE">Monture</SelectItem>
                  <SelectItem value="VERRE">Verre</SelectItem>
                  <SelectItem value="ACCESSOIRE">Accessoire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stock */}
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={form.stock ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock:
                      e.target.value === ''
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              />
            </div>

            {/* ── SKU & Code-barres ── */}
            <div className="col-span-2 border-t pt-3 mt-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                SKU & Code-barres
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <Label>SKU</Label>
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          skuMode: 'auto',
                          sku: undefined,
                        })
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                        form.skuMode === 'auto'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      Auto-généré
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          skuMode: 'custom',
                        })
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                        form.skuMode === 'custom'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      Saisir manuellement
                    </button>
                  </div>
                  {form.skuMode === 'custom' && (
                    <Input
                      value={form.sku ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, sku: e.target.value || undefined })
                      }
                      placeholder="Ex : MON-0042"
                    />
                  )}
                  {form.skuMode === 'auto' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Le SKU sera généré automatiquement selon la catégorie
                    </p>
                  )}
                </div>

                {/* Code-barres */}
                <div>
                  <Label>Code-barres</Label>
                  <div className="flex items-center gap-2 mt-1 mb-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          barcodeMode: 'none',
                          barcode: undefined,
                        })
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                        form.barcodeMode === 'none'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      Aucun
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          barcodeMode: 'auto',
                          barcode: undefined,
                        })
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                        form.barcodeMode === 'auto'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      Générer auto.
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          barcodeMode: 'custom',
                        })
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                        form.barcodeMode === 'custom'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      Saisir / Scanner
                    </button>
                  </div>
                  {form.barcodeMode === 'custom' && (
                    <Input
                      value={form.barcode ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          barcode: e.target.value || undefined,
                        })
                      }
                      placeholder="Scanner ou saisir le code-barres"
                    />
                  )}
                  {form.barcodeMode === 'auto' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Un code EAN-13 sera généré automatiquement
                    </p>
                  )}
                  {form.barcodeMode === 'none' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Aucun code-barres attribué
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Divider: Pricing */}
            <div className="col-span-2 border-t pt-3 mt-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                Tarification & Rentabilité
              </p>
              <div className="grid grid-cols-3 gap-4">
                {/* Prix d'achat */}
                <div>
                  <Label>Prix d'achat (DZD)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.purchasePrice ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        purchasePrice:
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Prix de vente recommandé */}
                <div>
                  <Label>Prix de vente (DZD)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.sellingPrice ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sellingPrice:
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Prix public (prix affiché) */}
                <div>
                  <Label>Prix public (DZD)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.prix ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        prix:
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Live margin preview */}
              {form.sellingPrice != null &&
                form.sellingPrice > 0 &&
                form.purchasePrice != null &&
                form.purchasePrice > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/60 border border-border">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Profit estimé :{' '}
                        </span>
                        <span className="font-semibold">
                          {formatDZD(form.sellingPrice - form.purchasePrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Marge :{' '}
                        </span>
                        <span
                          className={`font-semibold ${
                            ((form.sellingPrice - form.purchasePrice) /
                              form.purchasePrice) *
                              100 >=
                            30
                              ? 'text-green-600'
                              : ((form.sellingPrice - form.purchasePrice) /
                                    form.purchasePrice) *
                                    100 >=
                                  15
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }`}
                        >
                          {(
                            ((form.sellingPrice - form.purchasePrice) /
                              form.purchasePrice) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Description */}
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description optionnelle du produit…"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
