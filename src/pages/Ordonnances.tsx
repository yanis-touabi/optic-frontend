import { useState, useMemo } from 'react';
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
import { Plus, Pencil, Trash2, Printer, Loader2, Search } from 'lucide-react';
import { formatDate } from '@/lib/format';
import {
  usePaginatedOrdonnances,
  useCreateOrdonnance,
  useUpdateOrdonnance,
  useDeleteOrdonnance,
  useClients,
  DEFAULT_PAGE_SIZE,
} from '@/lib/data';
import { useDebounce } from '@/hooks/use-debounce';
import type { Ordonnance } from '@/lib/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type Form = Omit<Ordonnance, 'id' | 'createdAt' | 'client'>;

const empty: Form = {
  clientId: '',
  nomMedecin: '',
  notes: '',
};

const numOrU = (v: string) => (v === '' ? undefined : Number(v));

export default function Ordonnances() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0); // ✅ was 1
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const debouncedSearch = useDebounce(q, 300);

  const { data, isLoading } = usePaginatedOrdonnances({
    page,
    size: pageSize,
    q: debouncedSearch, 
  });

  // Fetch clients for the Select dropdown in the "New/Edit" dialog.
  const { data: clientOptions = [] } = useClients();

  const createMut = useCreateOrdonnance();
  const updateMut = useUpdateOrdonnance();
  const deleteMut = useDeleteOrdonnance();

  const ordonnances = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ordonnance | null>(null);
  const [form, setForm] = useState<Form>(empty);

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, clientId: clientOptions[0]?.id ?? '' });
    setOpen(true);
  };
  const openEdit = (o: Ordonnance) => {
    setEditing(o);
    setForm({
      clientId: o.clientId ?? '',
      datePrescription: o.datePrescription ?? '',
      dateExpiration: o.dateExpiration ?? '',
      nomMedecin: o.nomMedecin ?? '',
      notes: o.notes ?? '',
      odSphere: o.odSphere,
      odCylindre: o.odCylindre,
      odAxe: o.odAxe,
      odAddition: o.odAddition,
      odPrisme: o.odPrisme,
      odBase: o.odBase,
      ogSphere: o.ogSphere,
      ogCylindre: o.ogCylindre,
      ogAxe: o.ogAxe,
      ogAddition: o.ogAddition,
      ogPrisme: o.ogPrisme,
      ogBase: o.ogBase,
      ecartOd: o.ecartOd,
      ecartOg: o.ecartOg,
      hauteurOd: o.hauteurOd,
      hauteurOg: o.hauteurOg,
      distancePupillaire: o.distancePupillaire,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.clientId) return toast.error('Sélectionnez un client');
    try {
      if (editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          patch: {
            clientId: form.clientId,
            datePrescription: form.datePrescription,
            dateExpiration: form.dateExpiration,
            nomMedecin: form.nomMedecin,
            notes: form.notes,
            odSphere: form.odSphere,
            odCylindre: form.odCylindre,
            odAxe: form.odAxe,
            odAddition: form.odAddition,
            odPrisme: form.odPrisme,
            odBase: form.odBase,
            ogSphere: form.ogSphere,
            ogCylindre: form.ogCylindre,
            ogAxe: form.ogAxe,
            ogAddition: form.ogAddition,
            ogPrisme: form.ogPrisme,
            ogBase: form.ogBase,
            ecartOd: form.ecartOd,
            ecartOg: form.ecartOg,
            hauteurOd: form.hauteurOd,
            hauteurOg: form.hauteurOg,
            distancePupillaire: form.distancePupillaire,
          },
        });
        toast.success('Ordonnance mise à jour');
      } else {
        await createMut.mutateAsync(form);
        toast.success('Ordonnance ajoutée');
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette ordonnance ?')) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Supprimée');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur');
    }
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <>
      <PageHeader
        title="Ordonnances"
        description="Prescriptions optiques (OD / OG)"
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nouvelle ordonnance
          </Button>
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
                setPage(0); // ✅ was setPage(1)
              }}
              placeholder="Rechercher (client, médecin)..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Afficher</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(0); // ✅ was setPage(1)
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
                  <TableHead>Client</TableHead>
                  <TableHead>Médecin</TableHead>
                  <TableHead>Date prescription</TableHead>
                  <TableHead>OD (Sph/Cyl/Axe)</TableHead>
                  <TableHead>OG (Sph/Cyl/Axe)</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : ordonnances.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucune ordonnance
                    </TableCell>
                  </TableRow>
                ) : (
                  ordonnances.map((o) => {
                    // Client data is already included in the API response via include: { client }
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">
                          {o.client ? `${o.client.prenom} ${o.client.nom}` : '—'}
                        </TableCell>
                        <TableCell>{o.nomMedecin || '—'}</TableCell>
                        <TableCell>{formatDate(o.datePrescription)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {o.odSphere ?? '—'} / {o.odCylindre ?? '—'} /{' '}
                          {o.odAxe ?? '—'}°
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {o.ogSphere ?? '—'} / {o.ogCylindre ?? '—'} /{' '}
                          {o.ogAxe ?? '—'}°
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                nav(`/ordonnances/${o.id}/imprimer`)
                              }
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(o)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => remove(o.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
                  onClick={() => setPage((p) => Math.max(0, p - 1))} // ✅ was Math.max(1, ...)
                  className={
                    page === 0 // ✅ was page === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page + 1} sur {totalPages} {/* ✅ was {page} */}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  } // ✅ was totalPages
                  className={
                    page === totalPages - 1 // ✅ was page === totalPages
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l'ordonnance" : 'Nouvelle ordonnance'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Client *</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => set('clientId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.prenom} {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nom du médecin</Label>
                <Input
                  value={form.nomMedecin}
                  onChange={(e) => set('nomMedecin', e.target.value)}
                />
              </div>
              <div>
                <Label>Date prescription</Label>
                <Input
                  type="date"
                  value={form.datePrescription ?? ''}
                  onChange={(e) => set('datePrescription', e.target.value)}
                />
              </div>
              <div>
                <Label>Date expiration</Label>
                <Input
                  type="date"
                  value={form.dateExpiration ?? ''}
                  onChange={(e) => set('dateExpiration', e.target.value)}
                />
              </div>
              <div>
                <Label>Distance pupillaire</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={form.distancePupillaire ?? ''}
                  onChange={(e) =>
                    set('distancePupillaire', numOrU(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-accent/30">
              <div className="font-semibold text-sm mb-3 text-accent-foreground">
                Œil Droit (OD)
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Sphère</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={form.odSphere ?? ''}
                    onChange={(e) => set('odSphere', numOrU(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Cylindre</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={form.odCylindre ?? ''}
                    onChange={(e) => set('odCylindre', numOrU(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Axe</Label>
                  <Input
                    type="number"
                    value={form.odAxe ?? ''}
                    onChange={(e) =>
                      set('odAxe', numOrU(e.target.value) as number)
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Addition</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={form.odAddition ?? ''}
                    onChange={(e) => set('odAddition', numOrU(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Prisme</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.odPrisme ?? ''}
                    onChange={(e) => set('odPrisme', numOrU(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Base</Label>
                  <Input
                    value={form.odBase ?? ''}
                    onChange={(e) => set('odBase', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Écart</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.ecartOd ?? ''}
                    onChange={(e) => set('ecartOd', numOrU(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Hauteur</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.hauteurOd ?? ''}
                    onChange={(e) => set('hauteurOd', numOrU(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-accent/30">
              <div className="font-semibold text-sm mb-3 text-accent-foreground">
                Œil Gauche (OG)
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Sphère</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={form.ogSphere ?? ''}
                    onChange={(e) => set('ogSphere', numOrU(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Cylindre</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={form.ogCylindre ?? ''}
                    onChange={(e) => set('ogCylindre', numOrU(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Axe</Label>
                  <Input
                    type="number"
                    value={form.ogAxe ?? ''}
                    onChange={(e) =>
                      set('ogAxe', numOrU(e.target.value) as number)
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Addition</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={form.ogAddition ?? ''}
                    onChange={(e) => set('ogAddition', numOrU(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Prisme</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.ogPrisme ?? ''}
                    onChange={(e) => set('ogPrisme', numOrU(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Base</Label>
                  <Input
                    value={form.ogBase ?? ''}
                    onChange={(e) => set('ogBase', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Écart</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.ecartOg ?? ''}
                    onChange={(e) => set('ecartOg', numOrU(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Hauteur</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.hauteurOg ?? ''}
                    onChange={(e) => set('hauteurOg', numOrU(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
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
