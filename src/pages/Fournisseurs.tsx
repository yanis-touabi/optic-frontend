import { useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  PackageSearch,
  X,
  Link2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { PaginationControls } from '@/components/PaginationControls';
import { SortableTableHead } from '@/components/SortableTableHead';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { useDebounce } from '@/hooks/use-debounce';
import {
  usePaginatedFournisseurs,
  useFournisseur,
  useSupplierProducts,
  useProductSuppliersSearch,
  useCreateFournisseur,
  useUpdateFournisseur,
  useDeleteFournisseur,
  useLinkProduitFournisseur,
  useUnlinkProduitFournisseur,
  usePaginatedProduits,
} from '@/lib/data';
import type { Fournisseur, SearchSupplierByProductItem } from '@/lib/types';
import { exportToCSV } from '@/lib/csv';
import { formatDate } from '@/lib/format';

// ── Form schema ───────────────────────────────────────────────────────────────

const fournisseurSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
  contactPerson: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Email invalide',
    ),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  notes: z.string().optional(),
});
type FournisseurForm = z.infer<typeof fournisseurSchema>;

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Fournisseurs() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { sort, order, onSort, directionFor } = useSortableTable('nom', 'asc');
  const [searchMode, setSearchMode] = useState<'supplier' | 'product'>(
    'supplier',
  );
  const [productSearch, setProductSearch] = useState('');
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const [productType, setProductType] = useState<
    'ALL' | 'MONTURE' | 'VERRE' | 'ACCESSOIRE'
  >('ALL');
  const [productPage, setProductPage] = useState(0);
  const [productPageSize, setProductPageSize] = useState(10);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Fournisseur | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Fournisseur | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    null,
  );

  const { data, isLoading } = usePaginatedFournisseurs({
    page,
    size: pageSize,
    q: debouncedSearch || undefined,
    sort,
    order,
  });

  const createMutation = useCreateFournisseur();
  const updateMutation = useUpdateFournisseur();
  const deleteMutation = useDeleteFournisseur();
  const selectedSupplier =
    data?.content.find((f) => f.id === selectedSupplierId) ?? null;

  const normalizedProductQuery = debouncedProductSearch.trim();

  const { data: productSuppliersData } = useProductSuppliersSearch({
    query: normalizedProductQuery || undefined,
    type: productType === 'ALL' ? undefined : productType,
    page: productPage,
    limit: productPageSize,
  });

  const productSuggestions = useProductSuppliersSearch({
    query: normalizedProductQuery || undefined,
    type: productType === 'ALL' ? undefined : productType,
    page: 0,
    limit: 5,
  });

  const handleModeSwitch = (nextMode: 'supplier' | 'product') => {
    setSearchMode(nextMode);
    if (nextMode === 'supplier') {
      setProductSearch('');
      setProductType('ALL');
      setProductPage(0);
    } else {
      setSearch('');
      setPage(0);
    }
  };

  const handleExport = () => {
    if (!data?.content.length) return;
    exportToCSV(
      data.content,
      {
        nom: 'Nom',
        contactPerson: 'Contact',
        email: 'Email',
        telephone: 'Téléphone',
        adresse: 'Adresse',
        produitCount: 'Produits',
        createdAt: 'Créé le',
      },
      'fournisseurs',
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Fournisseurs"
        description="Gérez vos fournisseurs et les produits qu'ils proposent."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              Exporter CSV
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nouveau fournisseur
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-md border bg-muted/30 p-1">
          <Button
            variant={searchMode === 'supplier' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleModeSwitch('supplier')}
          >
            Rechercher un fournisseur
          </Button>
          <Button
            variant={searchMode === 'product' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleModeSwitch('product')}
          >
            Rechercher par produit
          </Button>
        </div>

        {searchMode === 'supplier' ? (
          <div className="relative max-w-sm w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un fournisseur…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
        ) : (
          <div className="relative max-w-sm w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom du produit ou marque…"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setProductPage(0);
              }}
              className="pl-9"
            />
            {productSearch.trim() && productSuggestions.data?.content.length ? (
              <div className="absolute z-20 mt-2 w-full rounded-md border bg-popover p-2 shadow-lg">
                <div className="flex flex-col gap-1">
                  {productSuggestions.data.content.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setProductSearch(item.nom);
                        setProductPage(0);
                      }}
                    >
                      <span className="font-medium">{item.nom}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        {item.categorie}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {searchMode === 'product' ? (
        <div className="rounded-xl border bg-background p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'MONTURE', 'VERRE', 'ACCESSOIRE'] as const).map(
              (option) => (
                <Button
                  key={option}
                  variant={productType === option ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setProductType(option);
                    setProductPage(0);
                  }}
                >
                  {option === 'ALL' ? 'Tous' : option}
                </Button>
              ),
            )}
          </div>

          {productSearch.trim() === '' ? (
            <div className="text-sm text-muted-foreground">
              Saisissez un nom de produit pour rechercher les fournisseurs.
            </div>
          ) : !productSuppliersData?.content.length ? (
            <div className="text-sm text-muted-foreground">
              Aucun fournisseur ne propose ce produit
            </div>
          ) : (
            <div className="space-y-4">
              {productSuppliersData.content.map((item) => (
                <ProductSupplierGroup
                  key={item.id}
                  item={item}
                  onOpenSupplier={(supplierId) =>
                    setSelectedSupplierId(supplierId)
                  }
                />
              ))}

              <PaginationControls
                page={productPage}
                size={productPageSize}
                totalPages={productSuppliersData.totalPages}
                totalElements={productSuppliersData.totalElements}
                onPageChange={setProductPage}
                onSizeChange={(nextSize) => {
                  setProductPageSize(nextSize);
                  setProductPage(0);
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  field="nom"
                  type="text"
                  direction={directionFor('nom')}
                  onSort={onSort}
                >
                  Nom
                </SortableTableHead>
                <SortableTableHead
                  field="contactPerson"
                  type="text"
                  direction={directionFor('contactPerson')}
                  onSort={onSort}
                >
                  Contact
                </SortableTableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Produits</TableHead>
                <SortableTableHead
                  field="createdAt"
                  type="date"
                  direction={directionFor('createdAt')}
                  onSort={onSort}
                >
                  Créé le
                </SortableTableHead>
                <TableHead className="w-[110px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : !data?.content.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Aucun fournisseur trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                data.content.map((f) => (
                  <TableRow
                    key={f.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setSelectedSupplierId(f.id)}
                  >
                    <TableCell className="font-medium">{f.nom}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.contactPerson || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.telephone || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.email || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{f.produitCount ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(f.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Voir détails"
                          onClick={() => setSelectedSupplierId(f.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Modifier"
                          onClick={() => setEditTarget(f)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Supprimer"
                          onClick={() => setDeleteTarget(f)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {searchMode === 'supplier' && data && (
        <PaginationControls
          page={page}
          size={pageSize}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onPageChange={setPage}
          onSizeChange={(s) => {
            setPageSize(s);
            setPage(0);
          }}
        />
      )}

      {selectedSupplier && (
        <SupplierProductsModal
          open={!!selectedSupplier}
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplierId(null)}
          onEdit={(supplier) => {
            setEditTarget(supplier);
            setSelectedSupplierId(null);
          }}
          onDelete={(supplier) => {
            setDeleteTarget(supplier);
            setSelectedSupplierId(null);
          }}
        />
      )}

      {/* Create dialog */}
      <FournisseurDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) =>
          createMutation
            .mutateAsync(values as any)
            .then(() => {
              toast.success('Fournisseur créé avec succès');
              setCreateOpen(false);
            })
            .catch((e: Error) => toast.error(e.message))
        }
        isPending={createMutation.isPending}
      />

      {/* Edit dialog */}
      {editTarget && (
        <FournisseurDialog
          open={!!editTarget}
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(values) =>
            updateMutation
              .mutateAsync({ id: editTarget.id, patch: values })
              .then(() => {
                toast.success('Fournisseur modifié');
                setEditTarget(null);
              })
              .catch((e: Error) => toast.error(e.message))
          }
          isPending={updateMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le fournisseur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le fournisseur{' '}
              <strong>{deleteTarget?.nom}</strong> et toutes ses associations
              produits seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget &&
                deleteMutation
                  .mutateAsync(deleteTarget.id)
                  .then(() => {
                    toast.success('Fournisseur supprimé');
                    setDeleteTarget(null);
                  })
                  .catch((e: Error) => toast.error(e.message))
              }
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductSupplierGroup({
  item,
  onOpenSupplier,
}: {
  item: SearchSupplierByProductItem;
  onOpenSupplier: (supplierId: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.nom}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
              {item.categorie}
            </Badge>
          </div>
          {item.marque && (
            <p className="text-sm text-muted-foreground">{item.marque}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {item.suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="flex flex-col gap-2 rounded-md border bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium">{supplier.nom}</p>
              <p className="text-xs text-muted-foreground">
                {supplier.contactPerson || '—'} · {supplier.telephone || '—'}
              </p>
              <p className="text-xs text-muted-foreground break-all">
                {supplier.email || '—'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenSupplier(supplier.id)}
            >
              Voir le fournisseur
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Supplier details modal ───────────────────────────────────────────────────

function SupplierProductsModal({
  open,
  supplier,
  onClose,
  onEdit,
  onDelete,
}: {
  open: boolean;
  supplier: Fournisseur | null;
  onClose: () => void;
  onEdit: (supplier: Fournisseur) => void;
  onDelete: (supplier: Fournisseur) => void;
}) {
  const { data: detail, isLoading: isDetailLoading } = useFournisseur(
    supplier?.id ?? undefined,
  );
  const linkMutation = useLinkProduitFournisseur();
  const unlinkMutation = useUnlinkProduitFournisseur();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [type, setType] = useState<'ALL' | 'MONTURE' | 'VERRE' | 'ACCESSOIRE'>(
    'ALL',
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [produitSearch, setProduitSearch] = useState('');
  const debouncedProduitSearch = useDebounce(produitSearch, 250);

  const { data: productsData, isLoading: isProductsLoading } =
    useSupplierProducts(supplier?.id, {
      page,
      limit: pageSize,
      search: debouncedSearch || undefined,
      type: type === 'ALL' ? undefined : type,
      sort: 'createdAt',
      order: 'desc',
    });

  const { data: availableProducts } = usePaginatedProduits({
    page: 0,
    size: 20,
    q: debouncedProduitSearch || undefined,
  });

  const linkedProductIds = new Set((detail?.produits ?? []).map((p) => p.id));

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fournisseur
                </p>
                <DialogTitle className="text-2xl font-semibold mt-1">
                  {supplier?.nom ?? 'Fournisseur'}
                </DialogTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (supplier) {
                      onEdit(supplier);
                      onClose();
                    }
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (supplier) {
                      onDelete(supplier);
                      onClose();
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Supprimer
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                  Contact
                </p>
                <p className="font-medium">{supplier?.contactPerson || '—'}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                  Téléphone
                </p>
                <p>{supplier?.telephone || '—'}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                  Email
                </p>
                <p className="break-all">{supplier?.email || '—'}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                  Créé le
                </p>
                <p>{supplier ? formatDate(supplier.createdAt) : '—'}</p>
              </div>
              {supplier?.adresse && (
                <div className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                    Adresse
                  </p>
                  <p>{supplier.adresse}</p>
                </div>
              )}
              {supplier?.notes && (
                <div className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                    Notes
                  </p>
                  <p className="whitespace-pre-wrap">{supplier.notes}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-background p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-base font-semibold">Produits associés</h3>
                  <p className="text-sm text-muted-foreground">
                    {productsData?.totalElements ?? 0} produit(s) référencé(s)
                  </p>
                </div>

                <Popover open={addOpen} onOpenChange={setAddOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Link2 className="h-3.5 w-3.5 mr-1.5" /> Associer un
                      produit
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[360px] p-0" align="end">
                    <Command>
                      <CommandInput
                        placeholder="Rechercher un produit…"
                        value={produitSearch}
                        onValueChange={setProduitSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Aucun produit disponible.</CommandEmpty>
                        <CommandGroup heading="Produits">
                          {availableProducts?.content
                            .filter((p) => !linkedProductIds.has(p.id))
                            .map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.id}
                                onSelect={() => {
                                  if (!supplier) return;
                                  linkMutation
                                    .mutateAsync({
                                      fournisseurId: supplier.id,
                                      produitId: p.id,
                                    })
                                    .then(() => {
                                      toast.success('Produit associé');
                                      setAddOpen(false);
                                    })
                                    .catch((e: Error) =>
                                      toast.error(e.message),
                                    );
                                }}
                              >
                                <PackageSearch className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                                <span className="font-medium">{p.nom}</span>
                                {p.marque && (
                                  <span className="ml-1 text-muted-foreground">
                                    · {p.marque}
                                  </span>
                                )}
                                <Badge
                                  variant="outline"
                                  className="ml-auto text-[10px] px-1"
                                >
                                  {p.categorie}
                                </Badge>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                      }}
                      placeholder="Rechercher un produit ou une marque…"
                      className="pl-9"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(['ALL', 'MONTURE', 'VERRE', 'ACCESSOIRE'] as const).map(
                      (option) => (
                        <Button
                          key={option}
                          type="button"
                          variant={type === option ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setType(option);
                            setPage(0);
                          }}
                        >
                          {option === 'ALL' ? 'Tous' : option}
                        </Button>
                      ),
                    )}
                  </div>
                </div>

                {isDetailLoading || isProductsLoading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Chargement des produits…
                  </div>
                ) : !productsData?.content.length ? (
                  <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    Aucun produit trouvé pour ce fournisseur.
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {productsData.content.map((p) => (
                        <div
                          key={p.linkId ?? p.id}
                          className="flex items-center justify-between gap-2 rounded-lg border bg-muted/10 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium truncate">
                                {p.nom}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0.5"
                              >
                                {p.categorie}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground truncate">
                              {p.marque || '—'}
                              {p.modele ? ` · ${p.modele}` : ''}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            title="Désassocier ce produit"
                            onClick={() => {
                              if (!supplier) return;
                              unlinkMutation
                                .mutateAsync({
                                  fournisseurId: supplier.id,
                                  produitId: p.id,
                                })
                                .then(() => toast.success('Produit désassocié'))
                                .catch((e: Error) => toast.error(e.message));
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <PaginationControls
                        page={page}
                        size={pageSize}
                        totalPages={productsData.totalPages}
                        totalElements={productsData.totalElements}
                        onPageChange={setPage}
                        onSizeChange={(nextSize) => {
                          setPageSize(nextSize);
                          setPage(0);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Create / Edit dialog ──────────────────────────────────────────────────────

interface FournisseurDialogProps {
  open: boolean;
  initial?: Fournisseur;
  onClose: () => void;
  onSubmit: (values: FournisseurForm) => void;
  isPending: boolean;
}

function FournisseurDialog({
  open,
  initial,
  onClose,
  onSubmit,
  isPending,
}: FournisseurDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FournisseurForm>({
    resolver: zodResolver(fournisseurSchema),
    defaultValues: {
      nom: initial?.nom ?? '',
      contactPerson: initial?.contactPerson ?? '',
      email: initial?.email ?? '',
      telephone: initial?.telephone ?? '',
      adresse: initial?.adresse ?? '',
      notes: initial?.notes ?? '',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom */}
          <div>
            <Label htmlFor="f-nom">Nom *</Label>
            <Input id="f-nom" {...register('nom')} className="mt-1" />
            {errors.nom && (
              <p className="text-destructive text-xs mt-1">
                {errors.nom.message}
              </p>
            )}
          </div>

          {/* Contact + Tel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="f-contact">Personne de contact</Label>
              <Input
                id="f-contact"
                {...register('contactPerson')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="f-tel">Téléphone</Label>
              <Input id="f-tel" {...register('telephone')} className="mt-1" />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="f-email">Email</Label>
            <Input
              id="f-email"
              type="email"
              {...register('email')}
              className="mt-1"
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Adresse */}
          <div>
            <Label htmlFor="f-adresse">Adresse</Label>
            <Input id="f-adresse" {...register('adresse')} className="mt-1" />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="f-notes">Notes</Label>
            <Textarea
              id="f-notes"
              {...register('notes')}
              className="mt-1"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement…' : initial ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
