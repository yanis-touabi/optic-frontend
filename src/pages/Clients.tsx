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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Plus, Pencil, Trash2, Search, Loader2, Download, Eye } from 'lucide-react';
import { ClientDetailDrawer } from '@/components/views/ClientDetailDrawer';
import { exportToCSV } from '@/lib/csv';
import type { Client } from '@/lib/types';
import {
  usePaginatedClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  DEFAULT_PAGE_SIZE,
} from '@/lib/data';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { SortableTableHead } from '@/components/SortableTableHead';

const empty: Omit<Client, 'id' | 'createdAt'> = {
  nom: '',
  prenom: '',
  telephone: '',
  email: '',
  adresse: '',
  notes: '',
  dateNaissance: '',
};

export default function Clients() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const debouncedSearch = useDebounce(q, 300);

  const { sort, order, onSort, directionFor } = useSortableTable('createdAt', 'desc');

  const { data, isLoading } = usePaginatedClients({
    page,
    size: pageSize,
    q: debouncedSearch,
    sort,
    order,
  });

  const createMut = useCreateClient();
  const updateMut = useUpdateClient();
  const deleteMut = useDeleteClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(empty);

  // ── View (read-only) state ──
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const openView = (c: Client) => {
    setViewingClient(c);
    setViewOpen(true);
  };

  const clients = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing(c);

    setForm({
      nom: c.nom ?? '',
      prenom: c.prenom ?? '',
      telephone: c.telephone ?? '',
      email: c.email ?? '',
      adresse: c.adresse ?? '',
      notes: c.notes ?? '',
      dateNaissance: c.dateNaissance ?? '',
    });

    setOpen(true);
  };

  const save = async () => {
    if (!form.nom.trim()) return toast.error('Le nom est requis');

    const payload = {
      nom: form.nom,
      prenom: form.prenom,
      telephone: form.telephone,
      email: form.email,
      adresse: form.adresse,
      notes: form.notes,
      dateNaissance: form.dateNaissance,
    };

    try {
      if (editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          patch: payload,
        });

        toast.success('Client mis à jour');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Client ajouté');
      }

      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Client supprimé');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur');
    }
  };

  const handleExport = () => {
    exportToCSV(
      clients,
      {
        prenom: 'Prénom',
        nom: 'Nom',
        telephone: 'Téléphone',
        email: 'Email',
        adresse: 'Adresse',
        dateNaissance: 'Date de Naissance',
      },
      'clients',
    );
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <>
      <PageHeader
        title="Clients"
        description="Gérez votre fichier client"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Nouveau client
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
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <SortableTableHead field="nom" type="text" direction={directionFor('nom')} onSort={onSort} className="w-[25%]">Nom</SortableTableHead>
                  <TableHead className="w-[20%]">Téléphone</TableHead>
                  <SortableTableHead field="email" type="text" direction={directionFor('email')} onSort={onSort} className="w-[25%]">Email</SortableTableHead>
                  <TableHead className="w-[20%]">Adresse</TableHead>
                  <TableHead className="w-[10%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun client
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.prenom} {c.nom}
                      </TableCell>
                      <TableCell>{c.telephone || '—'}</TableCell>
                      <TableCell>{c.email || '—'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {c.adresse || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* View button — read-only drawer */}
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Voir le client"
                            title="Voir les détails"
                            onClick={() => openView(c)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(c.id)}
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
              {editing ? 'Modifier le client' : 'Nouveau client'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prénom</Label>
              <Input
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={form.telephone}
                onChange={(e) =>
                  setForm({ ...form, telephone: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={form.dateNaissance ?? ''}
                onChange={(e) =>
                  setForm({ ...form, dateNaissance: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <Label>Adresse</Label>
              <Input
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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

      {/* ── View / Detail Drawer ── */}
      <ClientDetailDrawer
        open={viewOpen}
        onOpenChange={setViewOpen}
        client={viewingClient}
      />
    </>
  );
}
