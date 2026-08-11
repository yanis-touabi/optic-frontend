import { useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
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
  useCreateFournisseur,
  useUpdateFournisseur,
  useDeleteFournisseur,
  useLinkProduitFournisseur,
  useUnlinkProduitFournisseur,
  usePaginatedProduits,
} from '@/lib/data';
import type { Fournisseur } from '@/lib/types';
import { exportToCSV } from '@/lib/csv';
import { formatDate } from '@/lib/format';

// ── Form schema ───────────────────────────────────────────────────────────────

const fournisseurSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
  contactPerson: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Email invalide'),
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

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Fournisseur | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Fournisseur | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

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

      {/* Search */}
      <div className="relative max-w-sm">
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

      {/* Table */}
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
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : !data?.content.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Aucun fournisseur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              data.content.flatMap((f) => {
                const isExpanded = detailId === f.id;
                return [
                  <TableRow
                    key={f.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setDetailId(isExpanded ? null : f.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        {f.nom}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.contactPerson || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{f.telephone || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{f.email || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{f.produitCount ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(f.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
                  </TableRow>,
                  isExpanded && (
                    <TableRow key={`detail-${f.id}`}>
                      <TableCell colSpan={7} className="bg-muted/20 p-0">
                        <FournisseurDetailPanel id={f.id} />
                      </TableCell>
                    </TableRow>
                  ),
                ].filter(Boolean);
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && (
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
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le fournisseur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le fournisseur{' '}
              <strong>{deleteTarget?.nom}</strong> et toutes ses associations produits seront
              supprimés définitivement.
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

// ── Expandable detail panel ───────────────────────────────────────────────────

function FournisseurDetailPanel({ id }: { id: string }) {
  const { data: detail, isLoading } = useFournisseur(id);
  const linkMutation = useLinkProduitFournisseur();
  const unlinkMutation = useUnlinkProduitFournisseur();
  const [produitSearch, setProduitSearch] = useState('');
  const debouncedProduitSearch = useDebounce(produitSearch, 300);
  const [addOpen, setAddOpen] = useState(false);

  const { data: produitsData } = usePaginatedProduits({
    page: 0,
    size: 50,
    q: debouncedProduitSearch || undefined,
  });

  if (isLoading)
    return <div className="p-4 text-sm text-muted-foreground">Chargement…</div>;
  if (!detail) return null;

  const linkedProductIds = new Set(detail.produits.map((p) => p.id));

  return (
    <div className="p-5 space-y-4 border-t">
      {/* Info grid */}
      {(detail.adresse || detail.notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {detail.adresse && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">
                Adresse
              </p>
              <p>{detail.adresse}</p>
            </div>
          )}
          {detail.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">
                Notes
              </p>
              <p>{detail.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">
            Produits associés{' '}
            <span className="text-muted-foreground font-normal">
              ({detail.produits.length})
            </span>
          </p>
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Link2 className="h-3.5 w-3.5 mr-1.5" /> Associer un produit
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput
                  placeholder="Rechercher un produit…"
                  value={produitSearch}
                  onValueChange={setProduitSearch}
                />
                <CommandList>
                  <CommandEmpty>Aucun produit disponible.</CommandEmpty>
                  <CommandGroup heading="Produits">
                    {produitsData?.content
                      .filter((p) => !linkedProductIds.has(p.id))
                      .map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.id}
                          onSelect={() => {
                            linkMutation
                              .mutateAsync({ fournisseurId: id, produitId: p.id })
                              .then(() => {
                                toast.success('Produit associé');
                                setAddOpen(false);
                              })
                              .catch((e: Error) => toast.error(e.message));
                          }}
                        >
                          <PackageSearch className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                          <span className="font-medium">{p.nom}</span>
                          {p.marque && (
                            <span className="ml-1 text-muted-foreground">· {p.marque}</span>
                          )}
                          <Badge variant="outline" className="ml-auto text-[10px] px-1">
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

        {detail.produits.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun produit associé.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {detail.produits.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 border rounded-md px-2.5 py-1 text-xs bg-background shadow-sm"
              >
                <span className="font-medium">{p.nom}</span>
                {p.marque && (
                  <span className="text-muted-foreground">· {p.marque}</span>
                )}
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-0.5">
                  {p.categorie}
                </Badge>
                <button
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                  title="Désassocier ce produit"
                  onClick={() =>
                    unlinkMutation
                      .mutateAsync({ fournisseurId: id, produitId: p.id })
                      .then(() => toast.success('Produit désassocié'))
                      .catch((e: Error) => toast.error(e.message))
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
              <p className="text-destructive text-xs mt-1">{errors.nom.message}</p>
            )}
          </div>

          {/* Contact + Tel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="f-contact">Personne de contact</Label>
              <Input id="f-contact" {...register('contactPerson')} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="f-tel">Téléphone</Label>
              <Input id="f-tel" {...register('telephone')} className="mt-1" />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="f-email">Email</Label>
            <Input id="f-email" type="email" {...register('email')} className="mt-1" />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
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
            <Textarea id="f-notes" {...register('notes')} className="mt-1" rows={3} />
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
