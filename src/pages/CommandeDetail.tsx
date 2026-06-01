/**
 * UX CHOICE: Dedicated Detail Page (/commandes/:id)
 * A Commande is a relational record with line items, status lifecycle,
 * personalisation details, delivery info, and notes. This complexity cannot
 * be comfortably presented in a modal or drawer without severe scrolling.
 * A full page affords a proper 2-column layout (summary + meta sidebar) and
 * a full-width line items table — consistent with the existing pattern of
 * /commandes/:id/modifier and /commandes/:id/imprimer routes.
 */
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCommande } from '@/lib/data';
import { formatDZD, formatDate, formatDateTime, statutLabel } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  ArrowLeft,
  Printer,
  Pencil,
  Package,
  User,
  Calendar,
  CalendarClock,
  ClipboardList,
  FileText,
  Hash,
  Sparkles,
} from 'lucide-react';
import type { CommandeStatut } from '@/lib/types';

// ── Status badge ──────────────────────────────────────────────────────────────

const statutColors: Record<CommandeStatut, string> = {
  EN_ATTENTE:
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  EN_TRAITEMENT: 'bg-primary/10 text-primary border-primary/20',
  TERMINEE:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  ANNULEE: 'bg-destructive/10 text-destructive border-destructive/20',
};

function StatusBadge({ statut }: { statut: CommandeStatut }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${statutColors[statut]}`}
    >
      {statutLabel[statut]}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CommandeSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </div>
  );
}

// ── KPI chip ─────────────────────────────────────────────────────────────────

function KpiChip({
  label,
  value,
}: {
  label: string;
  value: string | number | React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value ?? '—'}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommandeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: commande, isLoading } = useCommande(id);

  if (isLoading) return <CommandeSkeleton />;

  if (!commande) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-muted-foreground">
        <Package className="h-12 w-12 opacity-20" />
        <p>Commande introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/commandes')}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>
    );
  }

  const clientName = commande.client
    ? `${commande.client.prenom ?? ''} ${commande.client.nom ?? ''}`.trim()
    : '—';

  const isEditable = commande.statut === 'EN_ATTENTE';

  const lignesTotal = commande.lignes.reduce(
    (sum, l) => sum + l.prixUnitaire * l.quantite,
    0,
  );

  return (
    <>
      {/* ── Page header ── */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/commandes')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Bons de commande
            </Button>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-semibold">
              Bon N°{commande.numero}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/commandes/${commande.id}/imprimer`}>
                <Printer className="h-4 w-4" />
                Imprimer
              </Link>
            </Button>
            {isEditable && (
              <Button asChild size="sm">
                <Link to={`/commandes/${commande.id}/modifier`}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-8 space-y-6">
        {/* Title + status */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Bon de commande N°{commande.numero}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Créé le {formatDateTime(commande.createdAt)}
            </p>
          </div>
          <StatusBadge statut={commande.statut} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column — line items + personalisation ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Line items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  Articles commandés
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Désignation</TableHead>
                      <TableHead className="text-center w-[100px]">Qté</TableHead>
                      <TableHead className="text-right w-[140px]">
                        Prix unitaire
                      </TableHead>
                      <TableHead className="text-right w-[140px] pr-6">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commande.lignes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          Aucun article
                        </TableCell>
                      </TableRow>
                    ) : (
                      commande.lignes.map((ligne) => (
                        <TableRow key={ligne.id}>
                          <TableCell className="pl-6 font-medium">
                            {ligne.designation}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {ligne.quantite}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatDZD(ligne.prixUnitaire)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium pr-6">
                            {formatDZD(ligne.prixUnitaire * ligne.quantite)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Total row */}
                <div className="border-t px-6 py-4 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Sous-total articles
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatDZD(lignesTotal)}
                  </span>
                </div>
                {commande.inclutPersonnalisation &&
                  commande.prixPersonnalisation != null && (
                    <div className="border-t px-6 py-3 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Personnalisation
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatDZD(commande.prixPersonnalisation)}
                      </span>
                    </div>
                  )}
                <div className="border-t px-6 py-4 flex justify-between items-center bg-muted/30 rounded-b-xl">
                  <span className="font-semibold">Total commande</span>
                  <span className="text-lg font-bold tabular-nums">
                    {formatDZD(commande.montantTotal)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Personalisation details */}
            {commande.inclutPersonnalisation && commande.detailsPersonnalisation && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    Détails de personnalisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {commande.detailsPersonnalisation}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {commande.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {commande.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right column — metadata sidebar ── */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Client */}
                <div>
                  <SectionHeading icon={User} label="Client" />
                  <p className="text-sm font-medium">{clientName}</p>
                </div>

                <div className="border-t" />

                {/* Dates */}
                <div>
                  <SectionHeading icon={Calendar} label="Dates" />
                  <div className="space-y-3">
                    <KpiChip
                      label="Date de création"
                      value={formatDateTime(commande.createdAt)}
                    />
                    <KpiChip
                      label="Livraison prévue"
                      value={
                        commande.dateLivraisonPrevue
                          ? formatDate(commande.dateLivraisonPrevue)
                          : '—'
                      }
                    />
                  </div>
                </div>

                <div className="border-t" />

                {/* Reference */}
                <div>
                  <SectionHeading icon={Hash} label="Référence" />
                  <div className="space-y-3">
                    <KpiChip
                      label="N° bon"
                      value={
                        <span className="font-mono">{commande.numero}</span>
                      }
                    />
                    {commande.ordonnanceId && (
                      <KpiChip
                        label="Ordonnance liée"
                        value={
                          <Link
                            to={`/ordonnances/${commande.ordonnanceId}/imprimer`}
                            className="text-primary hover:underline underline-offset-2 text-sm"
                          >
                            Voir l'ordonnance
                          </Link>
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="border-t" />

                {/* Statut */}
                <div>
                  <SectionHeading icon={ClipboardList} label="Statut" />
                  <StatusBadge statut={commande.statut} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
