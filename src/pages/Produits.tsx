import { useState } from 'react';
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
import { Plus, Pencil, Trash2, Search, Loader2, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csv';
import { formatDZD } from '@/lib/format';
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

const empty: Omit<Produit, 'id' | 'createdAt'> = {
  nom: '',
  marque: '',
  modele: '',
  categorie: 'MONTURE',
  description: '',
  prix: 0,
  stock: 0,
};

const catLabel: Record<ProduitCategorie, string> = {
  MONTURE: 'Monture',
  VERRE: 'Verre',
  ACCESSOIRE: 'Accessoire',
};

export default function Produits() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const debouncedSearch = useDebounce(q, 300);

  const { data, isLoading } = usePaginatedProduits({
    page,
    size: pageSize,
    q: debouncedSearch,
  });

  const createMut = useCreateProduit();
  const updateMut = useUpdateProduit();
  const deleteMut = useDeleteProduit();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);
  const [form, setForm] = useState(empty);

  const produits = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

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
    });

    setOpen(true);
  };

  const save = async () => {
    if (!form.nom.trim()) return toast.error('Le nom est requis');
    try {
      if (editing) {
        const payload = {
          nom: form.nom,
          marque: form.marque,
          modele: form.modele,
          categorie: form.categorie,
          description: form.description,
          prix: form.prix,
          stock: form.stock,
        };

        await updateMut.mutateAsync({
          id: editing.id,
          patch: payload,
        });
        toast.success('Produit mis à jour');
      } else {
        await createMut.mutateAsync(form);
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
        nom: 'Nom',
        marque: 'Marque',
        modele: 'Modèle',
        categorie: 'Catégorie',
        prix: 'Prix (DZD)',
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
        <div className="flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Rechercher..."
              className="pl-9"
            />
          </div>
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
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Marque / Modèle</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : produits.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun produit
                    </TableCell>
                  </TableRow>
                ) : (
                  produits.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nom}</TableCell>
                      <TableCell>
                        {p.marque} {p.modele}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {catLabel[p.categorie]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDZD(p.prix)}
                      </TableCell>
                      <TableCell className="text-right">{p.stock}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Modifier le produit' : 'Nouveau produit'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nom *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div>
              <Label>Marque</Label>
              <Input
                value={form.marque}
                onChange={(e) => setForm({ ...form, marque: e.target.value })}
              />
            </div>
            <div>
              <Label>Modèle</Label>
              <Input
                value={form.modele}
                onChange={(e) => setForm({ ...form, modele: e.target.value })}
              />
            </div>
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
            <div>
              <Label>Prix (DZD)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.prix}
                onChange={(e) =>
                  setForm({ ...form, prix: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: Number(e.target.value) })
                }
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
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
