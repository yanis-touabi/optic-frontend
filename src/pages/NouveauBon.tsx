import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  Printer,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDZD } from '@/lib/format';
import { ClientSelect } from '@/components/ClientSelect';
import { OrdonnanceSelect } from '@/components/OrdonnanceSelect';
import { ProduitSelect } from '@/components/ProduitSelect';
import { useCreateCommande } from '@/lib/data';
import type { LigneCommande, Produit } from '@/lib/types';
import { checkStock } from '@/lib/stock-validation';
import { StockAlert } from '@/components/StockAlert';
import { toast } from 'sonner';
import ScannerButton from '@/components/ScannerButton';
import ScannerDialog from '@/components/ScannerDialog';
import { useScanner } from '@/contexts/ScannerProvider';

type LocalLigne = LigneCommande;

export default function NouveauBon() {
  const createMut = useCreateCommande();
  const nav = useNavigate();

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [clientId, setClientId] = useState('');
  const [ordonnanceId, setOrdonnanceId] = useState<string>('none');
  const [lignes, setLignes] = useState<LocalLigne[]>([]);
  const [notes, setNotes] = useState('');
  const [dateLivraison, setDateLivraison] = useState('');
  const [pickProduit, setPickProduit] = useState<Produit | null>(null);
  const [selectedProduits, setSelectedProduits] = useState<Produit[]>([]);

  const [scannerOpen, setScannerOpen] = useState(false);
  const scanner = useScanner();

  useEffect(() => {
    scanner.setScanMode('ORDER');
  }, [scanner]);

  useEffect(() => {
    if (scanner.phoneConnected && scannerOpen) {
      setScannerOpen(false);
    }
  }, [scanner.phoneConnected, scannerOpen]);

  // Default to first client if not chosen yet - not needed for infinite scroll select
  const effectiveClientId = clientId || '';

  // When client changes, clear any previously selected ordonnance so it is
  // not incorrectly linked to the new client's bon de commande.
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setOrdonnanceId('none');
  };

  const total = useMemo(
    () => lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0),
    [lignes],
  );

  const stockIssues = useMemo(
    () => checkStock(lignes, selectedProduits),
    [lignes, selectedProduits],
  );

  const addLigne = () => {
    if (!pickProduit) return;
    const p = pickProduit;

    // Bug 3: block adding products with zero stock
    if (p.stock === 0) {
      toast.error('Stock insuffisant', {
        icon: <AlertCircle color="#dc2626" size={20} />,
      });
      return;
    }

    setSelectedProduits((prev) => {
      if (!prev.find((x) => x.id === p.id)) return [...prev, p];
      return prev;
    });

    setLignes((currentLignes) => {
      const existingIndex = currentLignes.findIndex(
        (ligne) => ligne.produitId === p.id,
      );

      if (existingIndex !== -1) {
        const newLignes = [...currentLignes];
        newLignes[existingIndex] = {
          ...newLignes[existingIndex],
          quantite: newLignes[existingIndex].quantite + 1,
        };
        toast.success('Quantité mise à jour');
        return newLignes;
      }

      return [
        ...currentLignes,
        {
          id: crypto.randomUUID(),
          produitId: p.id,
          designation: `${p.nom}${p.marque ? ` — ${p.marque}` : ''}`,
          quantite: 1,
          prixUnitaire: p.prix,
        },
      ];
    });

    setPickProduit(null);
  };

  // react to remote scanner product found
  useEffect(() => {
    const p = scanner.lastScannedProduct as any;
    if (!p?.id) return;
    if (scanner.scanMode !== 'ORDER') return;

    // Bug 3: block adding zero-stock products via scanner too
    if (p.stock === 0) {
      toast.error('Stock insuffisant');
      scanner.clearLastScannedState();
      return;
    }

    setSelectedProduits((prev) => {
      if (!prev.find((x) => x.id === p.id)) return [...prev, p];
      return prev;
    });

    setLignes((currentLignes) => {
      const existingIndex = currentLignes.findIndex(
        (ligne) => ligne.produitId === p.id,
      );

      if (existingIndex !== -1) {
        const newLignes = [...currentLignes];
        newLignes[existingIndex] = {
          ...newLignes[existingIndex],
          quantite: newLignes[existingIndex].quantite + 1,
        };
        toast.success('Quantité mise à jour (scan)');
        return newLignes;
      }

      return [
        ...currentLignes,
        {
          id: crypto.randomUUID(),
          produitId: p.id,
          designation: `${p.nom}${p.marque ? ` — ${p.marque}` : ''}`,
          quantite: 1,
          prixUnitaire: p.prix,
        },
      ];
    });
    scanner.clearLastScannedState();
  }, [
    scanner.lastScannedProduct,
    scanner.scanMode,
    scanner.clearLastScannedState,
  ]);

  const updateLigne = (id: string, patch: Partial<LocalLigne>) =>
    setLignes((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeLigne = (id: string) =>
    setLignes((l) => l.filter((x) => x.id !== id));

  const save = async (printAfter: boolean) => {
    if (lignes.length === 0) return toast.error('Ajoutez au moins un produit');
    if (dateLivraison && dateLivraison < todayStr) {
      return toast.error(
        "La date de livraison prévue doit être supérieure ou égale à aujourd'hui",
      );
    }
    if (stockIssues.length > 0) {
      return toast.error(
        "Stock insuffisant — corrigez les quantités avant d'enregistrer",
      );
    }

    try {
      const id = await createMut.mutateAsync({
        clientId: effectiveClientId || undefined,
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
  const quantiteTotale = lignes.reduce((s, l) => s + l.quantite, 0);

  return (
    <>
      {/* ── Original PageHeader — unchanged ── */}
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

      {/*
        ── Body ──────────────────────────────────────────────────────────
        A 2-column × 3-row CSS Grid (see `.order-grid` in index.css).
        Putting the "client/ordonnance/date" band and the "Total à payer"
        banner in the same grid row (row 1), and the "produit picker" bar
        and "récapitulatif" in the same grid row (row 2), means their
        heights are reconciled by the grid itself — whichever side has
        taller content stretches the other side to match. This replaces the
        old "eyeball the padding until it lines up" approach, which is what
        caused the misaligned borders you circled.
      */}
      <div className="order-grid flex-1 min-h-0 overflow-hidden">

        {/* Row 1 · Col 1 — Client / Ordonnance / Date */}
        <div className="order-header-section col-start-1 row-start-1 grid grid-cols-3 gap-4 px-6 py-4">
          <div className="flex flex-col justify-center gap-1.5">
            <Label className="text-blue-800/80 font-medium text-[0.625rem] uppercase tracking-wide">Client</Label>
            <ClientSelect value={clientId} onChange={handleClientChange} />
          </div>
          <div className="flex flex-col justify-center gap-1.5">
            <Label className="text-blue-800/80 font-medium text-[0.625rem] uppercase tracking-wide">Ordonnance</Label>
            <OrdonnanceSelect
              clientId={effectiveClientId}
              value={ordonnanceId}
              onChange={setOrdonnanceId}
            />
          </div>
          <div className="flex flex-col justify-center gap-1.5">
            <Label className="text-blue-800/80 font-medium text-[0.625rem] uppercase tracking-wide">Date de livraison prévue</Label>
            <Input
              type="date"
              value={dateLivraison}
              min={todayStr}
              onChange={(e) => setDateLivraison(e.target.value)}
            />
          </div>
        </div>

        {/* Row 1 · Col 2 — Total à payer */}
        <div className="order-total-banner col-start-2 row-start-1 flex items-center border-b border-l border-border px-6 py-4">
          {/* <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2"
              style={{ color: '#4ade80' }}>
              Total à payer
          </p> */}
          <p className="order-total-value text-3xl tracking-widest leading-none"
          style={{ color: '#22c55e', fontFamily: "'DSEG7 Classic', monospace" }}>
            {total} <span style={{ fontFamily: "Arial, sans-serif" }}>DA</span>
          </p>
        </div>

        {/* Row 2 · Col 1 — Produit picker bar */}
        <div className="col-start-1 row-start-2 flex items-center gap-2 border-b border-border bg-card px-6 py-2">
          <ProduitSelect value={pickProduit?.id} onChange={setPickProduit} />
          <Button onClick={addLigne} disabled={!pickProduit}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
          <ScannerButton
            onOpen={async () => {
              scanner.setScanMode('ORDER');
              try {
                await scanner.startScanSession();
                setScannerOpen(true);
              } catch {
                toast.error(
                  'Unable to start the phone scanner. Check the backend connection.',
                );
              }
            }}
          />
        </div>

        {/* Row 2 · Col 2 — Récapitulatif */}
        <div className="col-start-2 row-start-2 space-y-3 border-b border-l border-border bg-card px-6 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Récapitulatif
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Articles</span>
            <span className="font-medium">{lignes.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantité totale</span>
            <span className="font-medium">{quantiteTotale}</span>
          </div>
        </div>

        {/* Row 3 · Col 1 — Stock alert + articles table (the only scroll area) */}
        <div className="col-start-1 row-start-3 flex min-h-0 flex-col overflow-hidden">
          {stockIssues.length > 0 && (
            <div className="shrink-0 px-6 pt-2">
              <StockAlert issues={stockIssues} />
            </div>
          )}

          {/* Articles table — the ONLY scrollable area */}
          <div className="order-table-section flex-1 overflow-y-auto">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[44%] pl-6">Désignation</TableHead>
                  <TableHead className="w-[12%]">Qté</TableHead>
                  <TableHead className="w-[18%]">P.U.</TableHead>
                  <TableHead className="w-[16%] text-right">Total</TableHead>
                  <TableHead className="w-[10%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun article — ajoutez un produit ci-dessus
                    </TableCell>
                  </TableRow>
                ) : (
                  lignes.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="min-w-0 w-[52%] pl-6">
                        <Input
                          size={1}
                          value={l.designation}
                          onChange={(e) =>
                            updateLigne(l.id, { designation: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-0 w-[10%]">
                        <Input
                          size={1}
                          type="number"
                          min={1}
                          placeholder="0"
                          value={l.quantite || ''}
                          onChange={(e) =>
                            updateLigne(l.id, {
                              quantite:
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-0 w-[18%]">
                        <Input
                          size={1}
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={l.prixUnitaire || ''}
                          onChange={(e) =>
                            updateLigne(l.id, {
                              prixUnitaire:
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value),
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
          </div>
        </div>

        {/* Row 3 · Col 2 — Notes (top-aligned; the grid cell fills the
            remaining row height, the textarea itself just sits at the top) */}
        <div className="col-start-2 row-start-3 flex flex-col gap-2 border-l border-border bg-card px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Notes
          </p>
          <Textarea
            className="order-notes-textarea resize-none text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations, instructions..."
          />
        </div>
      </div>

      <ScannerDialog
        open={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          if (!scanner.phoneConnected) {
            scanner.setScanMode('NONE');
            scanner.stopScanSession().catch(() => {});
          }
        }}
      />
    </>
  );
}