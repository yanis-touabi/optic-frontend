import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Trash2, Printer, Loader2 } from 'lucide-react';
import { formatDZD } from '@/lib/format';
import {
  useClients,
  useOrdonnances,
  useProduits,
  useCreateCommande,
} from '@/lib/data';
import type { LigneCommande } from '@/lib/types';
import { checkStock } from '@/lib/stock-validation';
import { StockAlert } from '@/components/StockAlert';
import { toast } from 'sonner';

type LocalLigne = LigneCommande;

export default function NouveauBon() {
  const { data: clients = [] } = useClients();
  const { data: produits = [] } = useProduits();
  const { data: ordonnances = [] } = useOrdonnances();
  const createMut = useCreateCommande();
  const nav = useNavigate();

  const [clientId, setClientId] = useState('');
  const [ordonnanceId, setOrdonnanceId] = useState<string>('none');
  const [lignes, setLignes] = useState<LocalLigne[]>([]);
  const [notes, setNotes] = useState('');
  const [dateLivraison, setDateLivraison] = useState('');
  const [pickProduit, setPickProduit] = useState<string>('');

  // Default to first client if not chosen yet
  const effectiveClientId = clientId || clients[0]?.id || '';
  const ordonnancesClient = ordonnances.filter(
    (o) => o.clientId === effectiveClientId,
  );

  const total = useMemo(
    () => lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0),
    [lignes],
  );

  const stockIssues = useMemo(
    () => checkStock(lignes, produits),
    [lignes, produits],
  );

  const addLigne = () => {
    if (!pickProduit) return;
    const p = produits.find((x) => x.id === pickProduit);
    if (!p) return;
    setLignes((l) => [
      ...l,
      {
        id: crypto.randomUUID(),
        produitId: p.id,
        designation: `${p.nom}${p.marque ? ` — ${p.marque}` : ''}`,
        quantite: 1,
        prixUnitaire: p.prix,
      },
    ]);
    setPickProduit('');
  };

  const updateLigne = (id: string, patch: Partial<LocalLigne>) =>
    setLignes((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeLigne = (id: string) =>
    setLignes((l) => l.filter((x) => x.id !== id));

  const save = async (printAfter: boolean) => {
    if (!effectiveClientId) return toast.error('Sélectionnez un client');
    if (lignes.length === 0) return toast.error('Ajoutez au moins un produit');
    if (stockIssues.length > 0) {
      return toast.error(
        "Stock insuffisant — corrigez les quantités avant d'enregistrer",
      );
    }

    try {
      const id = await createMut.mutateAsync({
        clientId: effectiveClientId,
        ordonnanceId: ordonnanceId === 'none' ? undefined : ordonnanceId,
        lignes: lignes.map(({ id: _id, ...rest }) => rest),
        inclutPersonnalisation: false,
        detailsPersonnalisation: '',
        montantTotal: total,
        statut: 'EN_ATTENTE',
        notes,
        dateLivraisonPrevue: dateLivraison || undefined,
      });
      toast.success('Bon de commande créé');
      nav(printAfter ? `/commandes/${id}/imprimer` : '/commandes');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur');
    }
  };

  const saving = createMut.isPending;

  return (
    <>
      <PageHeader
        title="Nouveau bon de commande"
        description="Créer un bon pour un client"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => save(false)}
              disabled={saving || stockIssues.length > 0}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
            <Button
              onClick={() => save(true)}
              disabled={saving || stockIssues.length > 0}
            >
              <Printer className="h-4 w-4" />
              Enregistrer & imprimer
            </Button>
          </>
        }
      />
      <div className="p-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Client & ordonnance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client *</Label>
                <Select value={effectiveClientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.prenom} {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordonnance</Label>
                <Select value={ordonnanceId} onValueChange={setOrdonnanceId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {ordonnancesClient.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.nomMedecin || 'Sans médecin'} — OD{' '}
                        {o.odSphere ?? '—'} / OG {o.ogSphere ?? '—'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date de livraison prévue</Label>
                <Input
                  type="date"
                  value={dateLivraison}
                  onChange={(e) => setDateLivraison(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Articles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={pickProduit} onValueChange={setPickProduit}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choisir un produit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {produits.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom} — {formatDZD(p.prix)} (stock : {p.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addLigne} disabled={!pickProduit}>
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </div>

              <StockAlert issues={stockIssues} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Désignation</TableHead>
                    <TableHead className="w-24">Qté</TableHead>
                    <TableHead className="w-32">P.U.</TableHead>
                    <TableHead className="w-32 text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-6"
                      >
                        Aucun article
                      </TableCell>
                    </TableRow>
                  ) : (
                    lignes.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <Input
                            value={l.designation}
                            onChange={(e) =>
                              updateLigne(l.id, { designation: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={l.quantite}
                            onChange={(e) =>
                              updateLigne(l.id, {
                                quantite: Number(e.target.value),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={l.prixUnitaire}
                            onChange={(e) =>
                              updateLigne(l.id, {
                                prixUnitaire: Number(e.target.value),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatDZD(l.quantite * l.prixUnitaire)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeLigne(l.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations, instructions..."
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-[var(--shadow-card)] sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Articles</span>
                <span>{lignes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantité totale</span>
                <span>{lignes.reduce((s, l) => s + l.quantite, 0)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-baseline">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatDZD(total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
