import { useState } from 'react';
import { FileDown, Printer, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent } from '@/components/ui/card';
import { useSalesExport } from '@/lib/data';
import { exportToCSV } from '@/lib/csv';
import { formatDZD, formatDate, statutLabel } from '@/lib/format';
import type { CommandeStatut, ProduitCategorie, SalesExportItem } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const categorieLabel: Record<ProduitCategorie | '', string> = {
  MONTURE: 'Monture',
  VERRE: 'Verre',
  ACCESSOIRE: 'Accessoire',
  '': '—',
};

const statutColors: Record<CommandeStatut, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-800 border-amber-200',
  EN_TRAITEMENT: 'bg-blue-100 text-blue-800 border-blue-200',
  TERMINEE: 'bg-green-100 text-green-800 border-green-200',
  ANNULEE: 'bg-red-100 text-red-800 border-red-200',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type QuickPreset = 'today' | 'week' | 'month' | 'custom';

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Rapports() {
  // Filter state
  const [preset, setPreset] = useState<QuickPreset>('month');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(todayStr);
  const [categorie, setCategorie] = useState<string>('ALL');
  const [statut, setStatut] = useState<string>('ALL');

  // Only trigger query when user explicitly searches
  const [submitted, setSubmitted] = useState(false);

  const queryParams = {
    dateFrom: preset !== 'custom' ? resolvePresetFrom(preset) : dateFrom,
    dateTo: preset !== 'custom' ? todayStr() : dateTo,
    categorie: categorie === 'ALL' ? undefined : categorie,
    statut: statut === 'ALL' ? undefined : statut,
  };

  const { data: rows = [], isLoading, isFetching } = useSalesExport(queryParams, submitted);

  const handleApply = () => setSubmitted(true);

  const handleReset = () => {
    setPreset('month');
    setDateFrom(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
    setDateTo(todayStr());
    setCategorie('ALL');
    setStatut('ALL');
    setSubmitted(false);
  };

  const handlePreset = (p: QuickPreset) => {
    setPreset(p);
    setSubmitted(false);
  };

  // Totals
  const totalQty = rows.reduce((s, r) => s + r.quantite, 0);
  const totalCA = rows.reduce((s, r) => s + r.totalLigne, 0);

  // CSV export
  const handleCSV = () => {
    if (!rows.length) return;
    exportToCSV(
      rows,
      {
        numeroBon: 'N° Bon',
        date: 'Date',
        clientNom: 'Nom client',
        clientPrenom: 'Prénom client',
        clientTelephone: 'Téléphone',
        designation: 'Désignation',
        categorie: 'Catégorie',
        // sku: 'SKU',
        quantite: 'Quantité',
        prixUnitaire: 'Prix unitaire (DZD)',
        totalLigne: 'Total ligne (DZD)',
        statut: 'Statut',
        dateLivraisonPrevue: 'Date livraison prévue',
      },
      `ventes_${queryParams.dateFrom ?? 'all'}_${queryParams.dateTo ?? 'all'}`,
    );
  };

  // Print
  const handlePrint = () => window.print();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rapports — Extraction des ventes"
        description="Filtrez et exportez les lignes de vente par période, catégorie ou statut."
        actions={
          <div className="flex gap-2 no-print">
            <Button variant="outline" size="sm" onClick={handleCSV} disabled={!rows.length}>
              <FileDown className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!rows.length}>
              <Printer className="h-4 w-4 mr-2" /> Imprimer
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="no-print">
        <CardContent className="pt-5 space-y-4">
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'today', label: "Aujourd'hui" },
              { key: 'week', label: 'Cette semaine' },
              { key: 'month', label: 'Ce mois' },
              { key: 'custom', label: 'Personnalisé' },
            ] as { key: QuickPreset; label: string }[]).map(({ key, label }) => (
              <Button
                key={key}
                variant={preset === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreset(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Date range (custom) */}
          {preset === 'custom' && (
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <Label htmlFor="dateFrom">Du</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setSubmitted(false); }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Au</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setSubmitted(false); }}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Category + Status filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>Catégorie</Label>
              <Select value={categorie} onValueChange={(v) => { setCategorie(v); setSubmitted(false); }}>
                <SelectTrigger className="w-44 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes catégories</SelectItem>
                  <SelectItem value="MONTURE">Monture</SelectItem>
                  <SelectItem value="VERRE">Verre</SelectItem>
                  <SelectItem value="ACCESSOIRE">Accessoire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={statut} onValueChange={(v) => { setStatut(v); setSubmitted(false); }}>
                <SelectTrigger className="w-44 mt-1">
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
            </div>
            <div className="flex gap-2 pb-0.5">
              <Button onClick={handleApply} size="sm">
                <Search className="h-4 w-4 mr-2" /> Extraire
              </Button>
              {submitted && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X className="h-4 w-4 mr-1" /> Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPIs (when results are available) */}
      {submitted && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Lignes extraites</p>
              <p className="text-2xl font-bold mt-1">{rows.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Quantité totale</p>
              <p className="text-2xl font-bold mt-1">{totalQty}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
              <p className="text-2xl font-bold mt-1">{formatDZD(totalCA)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results table */}
      {submitted && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Bon</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Catégorie</TableHead>
                {/* <TableHead>SKU</TableHead> */}
                <TableHead className="text-right">Qté</TableHead>
                <TableHead className="text-right">P.U.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Livraison prévue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                    Aucune vente trouvée pour ces filtres.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono font-medium">#{row.numeroBon}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(row.date)}</TableCell>
                      <TableCell>
                        {row.clientNom} {row.clientPrenom}
                        {row.clientTelephone && (
                          <span className="text-xs text-muted-foreground block">{row.clientTelephone}</span>
                        )}
                      </TableCell>
                      <TableCell>{row.designation}</TableCell>
                      <TableCell>
                        {row.categorie ? (
                          <Badge variant="outline" className="text-xs">
                            {categorieLabel[row.categorie as ProduitCategorie]}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {/* <TableCell className="font-mono text-xs text-muted-foreground">{row.sku || '—'}</TableCell> */}
                      <TableCell className="text-right font-medium">{row.quantite}</TableCell>
                      <TableCell className="text-right text-sm">{formatDZD(row.prixUnitaire)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatDZD(row.totalLigne)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statutColors[row.statut]}`}
                        >
                          {statutLabel[row.statut]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.dateLivraisonPrevue ? formatDate(row.dateLivraisonPrevue) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={6} className="text-right text-sm">Total</TableCell>
                    <TableCell className="text-right">{totalQty}</TableCell>
                    <TableCell />
                    <TableCell className="text-right">{formatDZD(totalCA)}</TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 4px 6px; }
          th { background: #f5f5f5; font-weight: 600; }
        }
      `}</style>
    </div>
  );
}

// ── Preset resolver ───────────────────────────────────────────────────────────

function resolvePresetFrom(preset: QuickPreset): string {
  const now = new Date();
  switch (preset) {
    case 'today':
      return now.toISOString().slice(0, 10);
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
      return d.toISOString().slice(0, 10);
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    default:
      return now.toISOString().slice(0, 10);
  }
}
