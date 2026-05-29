import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { type SortOrder } from '@/hooks/use-sortable-table';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Plus,
  Search,
  Printer,
  Trash2,
  Loader2,
  Pencil,
  X,
  Download,
  Check,
  ChevronsUpDown,
  CalendarClock,
} from 'lucide-react';
import { exportToCSV } from '@/lib/csv';
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
import { cn } from '@/lib/utils';
import {
  formatDZD,
  formatDateTime,
  formatDate,
  statutLabel,
} from '@/lib/format';
import {
  useClients,
  usePaginatedCommandes,
  useDeleteCommande,
  useUpdateCommandeStatut,
  DEFAULT_PAGE_SIZE,
} from '@/lib/data';
import { useDebounce } from '@/hooks/use-debounce';
import type { CommandeStatut } from '@/lib/types';
import { toast } from 'sonner';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { SortableTableHead } from '@/components/SortableTableHead';

const statutColors: Record<CommandeStatut, string> = {
  EN_ATTENTE:
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  EN_TRAITEMENT: 'bg-primary/10 text-primary border-primary/20',
  TERMINEE:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  ANNULEE: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Commandes() {
  const { data: clients = [] } = useClients();
  const updateStatut = useUpdateCommandeStatut();
  const deleteMut = useDeleteCommande();

  const [q, setQ] = useState(() => sessionStorage.getItem('commandes_q') ?? '');
  const [statut, setStatut] = useState<string>(
    () => sessionStorage.getItem('commandes_statut') ?? 'ALL',
  );
  const [clientId, setClientId] = useState<string>(
    () => sessionStorage.getItem('commandes_clientId') ?? 'ALL',
  );
  const [dateFrom, setDateFrom] = useState(
    () => sessionStorage.getItem('commandes_dateFrom') ?? '',
  );
  const [dateTo, setDateTo] = useState(
    () => sessionStorage.getItem('commandes_dateTo') ?? '',
  );
  const [deliveryPreset, setDeliveryPreset] = useState<string>(
    () => sessionStorage.getItem('commandes_deliveryPreset') ?? 'ALL',
  );
  const [deliveryFrom, setDeliveryFrom] = useState(
    () => sessionStorage.getItem('commandes_deliveryFrom') ?? '',
  );
  const [deliveryTo, setDeliveryTo] = useState(
    () => sessionStorage.getItem('commandes_deliveryTo') ?? '',
  );
  const [page, setPage] = useState(() => {
    const val = sessionStorage.getItem('commandes_page');
    return val ? Number(val) : 0;
  });
  const [pageSize, setPageSize] = useState(() => {
    const val = sessionStorage.getItem('commandes_pageSize');
    return val ? Number(val) : DEFAULT_PAGE_SIZE;
  });
  const [clientOpen, setClientOpen] = useState(false);

  const debouncedQ = useDebounce(q, 300);

  const initialSort = sessionStorage.getItem('commandes_sort') ?? 'createdAt';
  const initialOrder =
    (sessionStorage.getItem('commandes_order') as SortOrder) ?? 'desc';
  const { sort, order, onSort, directionFor } = useSortableTable(
    initialSort,
    initialOrder,
  );

  useEffect(() => {
    sessionStorage.setItem('commandes_q', q);
    sessionStorage.setItem('commandes_statut', statut);
    sessionStorage.setItem('commandes_clientId', clientId);
    sessionStorage.setItem('commandes_dateFrom', dateFrom);
    sessionStorage.setItem('commandes_dateTo', dateTo);
    sessionStorage.setItem('commandes_deliveryPreset', deliveryPreset);
    sessionStorage.setItem('commandes_deliveryFrom', deliveryFrom);
    sessionStorage.setItem('commandes_deliveryTo', deliveryTo);
    sessionStorage.setItem('commandes_page', page.toString());
    sessionStorage.setItem('commandes_pageSize', pageSize.toString());
  }, [
    q,
    statut,
    clientId,
    dateFrom,
    dateTo,
    deliveryPreset,
    deliveryFrom,
    deliveryTo,
    page,
    pageSize,
  ]);

  useEffect(() => {
    if (sort) sessionStorage.setItem('commandes_sort', sort);
    if (order) sessionStorage.setItem('commandes_order', order);
  }, [sort, order]);

  const { data, isLoading } = usePaginatedCommandes({
    page,
    size: pageSize,
    q: debouncedQ,
    statut: statut === 'ALL' ? undefined : statut,
    clientId: clientId === 'ALL' ? undefined : clientId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    deliveryPreset: deliveryPreset !== 'ALL' ? deliveryPreset : undefined,
    deliveryFrom:
      deliveryPreset === 'CUSTOM' ? deliveryFrom || undefined : undefined,
    deliveryTo:
      deliveryPreset === 'CUSTOM' ? deliveryTo || undefined : undefined,
    sort,
    order,
  });

  const commandes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const resetFilters = () => {
    setQ('');
    setStatut('ALL');
    setClientId('ALL');
    setDateFrom('');
    setDateTo('');
    setDeliveryPreset('ALL');
    setDeliveryFrom('');
    setDeliveryTo('');
    setPage(0);
  };
  const hasFilters =
    q ||
    statut !== 'ALL' ||
    clientId !== 'ALL' ||
    dateFrom ||
    dateTo ||
    deliveryPreset !== 'ALL';

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce bon ?')) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Supprimé');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur');
    }
  };

  const changeStatut = async (id: string, s: CommandeStatut) => {
    try {
      await updateStatut.mutateAsync({ id, statut: s });
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur');
    }
  };

  const handleExport = () => {
    exportToCSV(
      commandes.map((c) => ({
        ...c,
        clientName: c.client ? `${c.client.prenom} ${c.client.nom}` : '—',
        formattedDate: formatDateTime(c.createdAt),
        statutLabel: statutLabel[c.statut],
      })),
      {
        numero: 'N°',
        clientName: 'Client',
        formattedDate: 'Date',
        statutLabel: 'Statut',
        montantTotal: 'Montant (DZD)',
      },
      'bons_de_commande',
    );
  };

  return (
    <>
      <PageHeader
        title="Bons de commande"
        description="Historique de tous les bons"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
            <Button asChild>
              <Link to="/commandes/nouveau">
                <Plus className="h-4 w-4" />
                Nouveau bon
              </Link>
            </Button>
          </div>
        }
      />
      <div className="p-8 space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="N° ou client..."
              className="pl-9"
            />
          </div>
          <Popover open={clientOpen} onOpenChange={setClientOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={clientOpen}
                className="justify-between font-normal"
              >
                {clientId !== 'ALL'
                  ? clients.find((c) => c.id === clientId)?.prenom +
                    ' ' +
                    clients.find((c) => c.id === clientId)?.nom
                  : 'Tous les clients'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Rechercher un client..." />
                <CommandList>
                  <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="ALL"
                      onSelect={() => {
                        setClientId('ALL');
                        setPage(0);
                        setClientOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          clientId === 'ALL' ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      Tous les clients
                    </CommandItem>
                    {clients.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={`${c.prenom} ${c.nom}`}
                        onSelect={() => {
                          setClientId(c.id);
                          setPage(0);
                          setClientOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            clientId === c.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {c.prenom} {c.nom}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Select
            value={statut}
            onValueChange={(v) => {
              setStatut(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="EN_TRAITEMENT">En traitement</SelectItem>
              <SelectItem value="TERMINEE">Terminée</SelectItem>
              <SelectItem value="ANNULEE">Annulée</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            placeholder="Du"
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
              placeholder="Au"
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={resetFilters}
                title="Réinitialiser"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Delivery date filter row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Livraison prévue :
            </span>
          </div>
          <Select
            value={deliveryPreset}
            onValueChange={(v) => {
              setDeliveryPreset(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les livraisons</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
              <SelectItem value="CUSTOM">Personnalisé</SelectItem>
            </SelectContent>
          </Select>
          {deliveryPreset === 'CUSTOM' && (
            <>
              <Input
                type="date"
                value={deliveryFrom}
                onChange={(e) => {
                  setDeliveryFrom(e.target.value);
                  setPage(0);
                }}
                className="w-[160px]"
                placeholder="Du"
              />
              <Input
                type="date"
                value={deliveryTo}
                onChange={(e) => {
                  setDeliveryTo(e.target.value);
                  setPage(0);
                }}
                className="w-[160px]"
                placeholder="Au"
              />
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {totalElements} résultat(s)
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
                  <SortableTableHead
                    field="numero"
                    type="number"
                    direction={directionFor('numero')}
                    onSort={onSort}
                    className="w-[8%]"
                  >
                    N°
                  </SortableTableHead>
                  <TableHead className="w-[18%]">Client</TableHead>
                  <SortableTableHead
                    field="createdAt"
                    type="date"
                    direction={directionFor('createdAt')}
                    onSort={onSort}
                    className="text-center w-[14%]"
                  >
                    Date
                  </SortableTableHead>
                  <SortableTableHead
                    field="dateLivraisonPrevue"
                    type="date"
                    direction={directionFor('dateLivraisonPrevue')}
                    onSort={onSort}
                    className="text-center w-[13%]"
                  >
                    Livraison prévue
                  </SortableTableHead>
                  <SortableTableHead
                    field="statut"
                    type="text"
                    direction={directionFor('statut')}
                    onSort={onSort}
                    className="text-center w-[18%]"
                  >
                    Statut
                  </SortableTableHead>
                  <SortableTableHead
                    field="montantTotal"
                    type="number"
                    direction={directionFor('montantTotal')}
                    onSort={onSort}
                    className="text-center w-[14%]"
                  >
                    Montant
                  </SortableTableHead>
                  <TableHead className="w-[15%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : commandes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun bon de commande
                    </TableCell>
                  </TableRow>
                ) : (
                  commandes.map((c) => {
                    const cl = c.client;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-medium">
                          {c.numero}
                        </TableCell>
                        <TableCell>
                          {cl ? `${cl.prenom} ${cl.nom}` : '—'}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatDateTime(c.createdAt)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatDate(c.dateLivraisonPrevue)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Select
                              value={c.statut}
                              onValueChange={(v) =>
                                changeStatut(c.id, v as CommandeStatut)
                              }
                            >
                              <SelectTrigger
                                className={`h-8 w-40 border ${statutColors[c.statut]}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(
                                  [
                                    'EN_ATTENTE',
                                    'EN_TRAITEMENT',
                                    'TERMINEE',
                                    'ANNULEE',
                                  ] as CommandeStatut[]
                                ).map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {statutLabel[s]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {formatDZD(c.montantTotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              asChild
                              size="icon"
                              variant="ghost"
                              disabled={[
                                'EN_TRAITEMENT',
                                'TERMINEE',
                                'ANNULEE',
                              ].includes(c.statut)}
                            >
                              <Link to={`/commandes/${c.id}/modifier`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild size="icon" variant="ghost">
                              <Link to={`/commandes/${c.id}/imprimer`}>
                                <Printer className="h-4 w-4" />
                              </Link>
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
    </>
  );
}
