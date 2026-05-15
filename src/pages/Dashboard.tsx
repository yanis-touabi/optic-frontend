import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Users,
  Glasses,
  FileText,
  Plus,
  Loader2,
  ArrowRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Medal,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatDZD, formatDateTime, statutLabel } from '@/lib/format';
import {
  useClients,
  useCommandes,
  useOrdonnances,
  useProduits,
} from '@/lib/data';
import { PageHeader } from '@/components/PageHeader';
import { useState, useMemo } from 'react';

// ── Period filter ──
type Period = '7d' | '30d' | '90d' | 'all';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
  { value: 'all', label: 'Tout' },
];

function getPeriodStart(period: Period): Date | null {
  if (period === 'all') return null;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return new Date(Date.now() - days * 86400_000);
}

function getPrevPeriodStart(period: Period): Date | null {
  if (period === 'all') return null;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return new Date(Date.now() - days * 2 * 86400_000);
}

// ── Simulated monthly CA ──
const CA_MONTHS = [
  { mois: 'Déc', ca: 120000 },
  { mois: 'Jan', ca: 95000 },
  { mois: 'Fév', ca: 140000 },
  { mois: 'Mar', ca: 175000 },
  { mois: 'Avr', ca: 155000 },
];

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: '#0284c7',
  EN_TRAITEMENT: '#d97706',
  TERMINEE: '#16a34a',
  ANNULEE: '#dc2626',
};

const STATUT_BADGE: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  EN_ATTENTE: 'secondary',
  EN_TRAITEMENT: 'outline',
  LIVREE: 'default',
  ANNULEE: 'destructive',
};

// ── Medal colors for top-5 podium ranks ──
const RANK_META = [
  {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    bar: '#f59e0b',
  },
  {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-600',
    bar: '#94a3b8',
  },
  {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    bar: '#f97316',
  },
  {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
    bar: '#cbd5e1',
  },
  {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
    bar: '#cbd5e1',
  },
];

// ── Trend badge ──
function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
        <TrendingUp className="h-3 w-3" /> Nouveau
      </span>
    );
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  const up = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        up ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
      }`}
    >
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {up ? '+' : ''}
      {pct}%
    </span>
  );
}

export default function Dashboard() {
  const { data: clients = [] } = useClients();
  const { data: produits = [] } = useProduits();
  const { data: ordonnances = [] } = useOrdonnances();
  const { data: commandes = [], isLoading } = useCommandes();

  const [period, setPeriod] = useState<Period>('30d');

  const periodStart = useMemo(() => getPeriodStart(period), [period]);
  const prevPeriodStart = useMemo(() => getPrevPeriodStart(period), [period]);

  // Current period commandes
  const filteredCommandes = useMemo(() => {
    if (!periodStart) return commandes;
    return commandes.filter((c) => new Date(c.createdAt) >= periodStart);
  }, [commandes, periodStart]);

  // Previous period commandes (for trend comparison)
  const prevCommandes = useMemo(() => {
    if (!periodStart || !prevPeriodStart) return commandes; // 'all' → no comparison
    return commandes.filter((c) => {
      const d = new Date(c.createdAt);
      return d >= prevPeriodStart && d < periodStart;
    });
  }, [commandes, periodStart, prevPeriodStart]);

  const showTrend = period !== 'all';

  // ── Derived stats ──
  const totalCA = filteredCommandes
    .filter((c) => c.statut !== 'ANNULEE')
    .reduce((s, c) => s + (Number(c.montantTotal) || 0), 0);
  const prevTotalCA = prevCommandes
    .filter((c) => c.statut !== 'ANNULEE')
    .reduce((s, c) => s + (Number(c.montantTotal) || 0), 0);

  const enCours = filteredCommandes.filter(
    (c) => c.statut === 'EN_ATTENTE' || c.statut === 'EN_TRAITEMENT',
  ).length;
  const prevEnCours = prevCommandes.filter(
    (c) => c.statut === 'EN_ATTENTE' || c.statut === 'EN_TRAITEMENT',
  ).length;

  const recents = filteredCommandes.slice(0, 5);

  // ── Status donut ──
  const statusCounts = Object.entries(
    filteredCommandes.reduce<Record<string, number>>((acc, c) => {
      acc[c.statut] = (acc[c.statut] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  // ── Monthly CA chart ──
  const caData = [...CA_MONTHS, { mois: 'Mai', ca: totalCA }];

  // ── Top 5 best-selling products ──
  // Derived from commandes: each commande has a `lignes` array of { produitId, quantite, prixUnitaire }
  // We aggregate by produitId across filteredCommandes.
  const top5Produits = useMemo(() => {
    const map: Record<string, { qte: number; ca: number }> = {};
    for (const cmd of filteredCommandes) {
      if (!Array.isArray((cmd as any).lignes)) continue;
      for (const ligne of (cmd as any).lignes) {
        if (!ligne.produitId) continue;
        if (!map[ligne.produitId]) map[ligne.produitId] = { qte: 0, ca: 0 };
        map[ligne.produitId].qte += Number(ligne.quantite) || 0;
        map[ligne.produitId].ca +=
          (Number(ligne.quantite) || 0) * (Number(ligne.prixUnitaire) || 0);
      }
    }
    return Object.entries(map)
      .map(([produitId, stats]) => {
        const prod = produits.find(
          (p) => p.id === produitId || String(p.id) === produitId,
        );
        return {
          id: produitId,
          nom: prod?.nom ?? prod?.designation ?? `Produit #${produitId}`,
          ref: prod?.reference ?? prod?.ref ?? '—',
          qte: stats.qte,
          ca: stats.ca,
        };
      })
      .sort((a, b) => b.qte - a.qte)
      .slice(0, 5);
  }, [filteredCommandes, produits]);

  const maxQte = top5Produits[0]?.qte ?? 1;

  // ── KPI cards ──
  const stats = [
    {
      label: 'Bons de commande',
      value: filteredCommandes.length,
      prev: prevCommandes.length,
      icon: ShoppingBag,
      iconBg: 'bg-accent',
      iconColor: 'text-primary',
    },
    {
      label: 'Clients',
      value: clients.length,
      prev: clients.length,
      icon: Users,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      label: 'Produits',
      value: produits.length,
      prev: produits.length,
      icon: Glasses,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: 'Ordonnances',
      value: ordonnances.length,
      prev: ordonnances.length,
      icon: FileText,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
  ].map((item) => {
    const diff = item.value - item.prev;

    const percentage = item.prev > 0 ? Math.round((diff / item.prev) * 100) : 0;

    return {
      ...item,
      trend: `${Math.abs(percentage)}%`,
      trendPositive: diff >= 0,
    };
  });

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Aperçu de l'activité de votre magasin d'optique"
        actions={
          <Button asChild>
            <Link to="/commandes/nouveau">
              <Plus className="h-4 w-4" />
              Nouveau bon
            </Link>
          </Button>
        }
      />

      <div className="p-8 space-y-6">
        {/* ── PERIOD FILTER ── */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground font-medium mr-1">
            Période :
          </span>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === opt.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card
              key={s.label}
              className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow"
            >
              <CardContent className="p-5 flex items-center justify-between gap-4">
                {/* Left Content */}
                <div className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl grid place-items-center flex-shrink-0 ${s.iconBg}`}
                  >
                    <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                  </div>

                  <div>
                    <div className="text-2xl font-bold tracking-tight">
                      {s.value}
                    </div>

                    <div className="text-xs text-muted-foreground font-medium mt-0.5">
                      {s.label}
                    </div>
                  </div>
                </div>

                {/* Trend */}
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                    s.trendPositive
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  <span>{s.trendPositive ? '↑' : '↓'}</span>
                  <span>{s.trend}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Bar chart — CA mensuel */}
          <Card className="lg:col-span-2 shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Chiffre d'affaires mensuel
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  6 derniers mois
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={caData}
                  barSize={36}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="mois"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatDZD(v), 'CA']}
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 12,
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Bar dataKey="ca" radius={[6, 6, 0, 0]}>
                    {caData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === caData.length - 1
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--accent))'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Donut — statut commandes */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Statut des commandes</CardTitle>
            </CardHeader>
            <CardContent>
              {statusCounts.length === 0 ? (
                <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                  Aucune commande sur cette période.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusCounts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {statusCounts.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUT_COLORS[entry.name] ?? '#888'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [
                        v,
                        statutLabel[name as string] ?? name,
                      ]}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="mt-3 grid grid-cols-2 gap-y-1.5 gap-x-3">
                {Object.entries(STATUT_COLORS).map(([k, color]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-[11px] text-muted-foreground truncate">
                      {statutLabel[k]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Recent orders */}
          <Card className="lg:col-span-2 shadow-[var(--shadow-card)]">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">
                Bons de commande récents
              </CardTitle>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-primary h-7 px-2"
              >
                <Link to="/commandes" className="flex items-center gap-1">
                  Voir tout <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </div>
              ) : recents.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  Aucun bon sur cette période.
                </div>
              ) : (
                <div className="divide-y">
                  {recents.map((c) => {
                    const client = clients.find((x) => x.id === c.clientId);
                    return (
                      <Link
                        key={c.id}
                        to={`/commandes/${c.id}/imprimer`}
                        className="flex items-center justify-between py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            N° {c.numero} —{' '}
                            {client
                              ? `${client.prenom} ${client.nom}`
                              : 'Client supprimé'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatDateTime(c.createdAt)}
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="font-bold text-sm">
                            {formatDZD(c.montantTotal)}
                          </div>
                          <Badge
                            variant={STATUT_BADGE[c.statut]}
                            className="text-[10px] mt-1"
                          >
                            {statutLabel[c.statut]}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right column: Synthèse + Top 5 */}
          <div className="flex flex-col gap-4">
            {/* Synthèse — Taux de livraison removed */}
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Synthèse</CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0 px-6 pb-4">
                <div className="py-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
                    Chiffre d'affaires total
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-bold text-primary">
                      {formatDZD(totalCA)}
                    </div>
                    {showTrend && (
                      <div className="mb-0.5">
                        <Trend current={totalCA} previous={prevTotalCA} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="py-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
                    Commandes en cours
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-bold text-warning">
                      {enCours}
                    </div>
                    {showTrend && (
                      <div className="mb-0.5">
                        <Trend current={enCours} previous={prevEnCours} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── TOP 5 BEST-SELLING PRODUCTS ── */}
            <Card className="shadow-[var(--shadow-card)] flex-1">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Medal className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">
                    Top 5 produits vendus
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {top5Produits.length === 0 ? (
                  <div className="py-6 text-sm text-muted-foreground text-center">
                    Aucune donnée sur cette période.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {top5Produits.map((p, i) => {
                      const meta = RANK_META[i] ?? RANK_META[4];
                      const barPct =
                        maxQte > 0 ? Math.round((p.qte / maxQte) * 100) : 0;
                      return (
                        <div key={p.id} className="flex items-center gap-3">
                          {/* Rank badge */}
                          <div
                            className={`h-7 w-7 rounded-lg border flex-shrink-0 grid place-items-center text-xs font-bold ${meta.bg} ${meta.border} ${meta.text}`}
                          >
                            {i + 1}
                          </div>
                          {/* Name + bar */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className="text-xs font-semibold truncate max-w-[130px]"
                                title={p.nom}
                              >
                                {p.nom}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                {p.qte} unité{p.qte > 1 ? 's' : ''}
                              </span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${barPct}%`,
                                  background: meta.bar,
                                }}
                              />
                            </div>
                          </div>
                          {/* CA */}
                          <div className="text-xs font-semibold text-right flex-shrink-0 w-20 tabular-nums">
                            {formatDZD(p.ca)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
