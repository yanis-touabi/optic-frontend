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
  AlertCircle,
  SlidersHorizontal,
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
import { useDashboard, type CaChartOptions } from '@/lib/data';
import { PageHeader } from '@/components/PageHeader';
import { useState, useMemo } from 'react';
import type { DashboardStatistics, MonthlyCaItem, RecentOrderItem } from '@/lib/types';

// ── Period filter ──
type Period = '7d' | '30d' | '90d' | 'all';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
  { value: 'all', label: 'Tout' },
];

// ── CA chart types ──
type CaPreset = 'semaine' | 'mois6' | 'trimestre' | 'annee' | 'custom';
type CaGranularity = 'day' | 'week' | 'month';

const CA_PRESETS: { value: CaPreset; label: string }[] = [
  { value: 'semaine', label: 'Semaine' },
  { value: 'mois6', label: '6 mois' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'annee', label: 'Année' },
  { value: 'custom', label: 'Personnalisé' },
];

const CA_GRANULARITIES: { value: CaGranularity; label: string }[] = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
];

/** Returns today as YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns a date N days before today as YYYY-MM-DD */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Returns first day of month N months ago as YYYY-MM-DD */
function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n, 1);
  return d.toISOString().slice(0, 10);
}

// ── CaChartCard ──────────────────────────────────────────────────────────────
interface CaChartCardProps {
  caMensuel: MonthlyCaItem[];
  preset: CaPreset;
  granularity: CaGranularity;
  dateFrom: string;
  dateTo: string;
  onPresetChange: (p: CaPreset) => void;
  onGranularityChange: (g: CaGranularity) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
}

function CaChartCard({
  caMensuel,
  preset,
  granularity,
  dateFrom,
  dateTo,
  onPresetChange,
  onGranularityChange,
  onDateFromChange,
  onDateToChange,
}: CaChartCardProps) {
  // Threshold: beyond 8 bars we enable horizontal scroll
  const needsScroll = caMensuel.length > 8;
  const BAR_MIN_WIDTH = 52; // px per bar when scrolling
  const chartMinWidth = needsScroll ? caMensuel.length * BAR_MIN_WIDTH : undefined;

  const pillBase =
    'px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer border';
  const pillActive = 'bg-primary text-primary-foreground border-primary shadow-sm';
  const pillInactive =
    'bg-background text-muted-foreground border-transparent hover:border-border hover:text-foreground';

  return (
    <Card className="lg:col-span-2 shadow-[var(--shadow-card)]">
      <CardHeader className="pb-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Chiffre d'affaires</CardTitle>
          {/* Preset pills */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-wrap">
            {CA_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => onPresetChange(p.value)}
                className={`${pillBase} ${
                  preset === p.value ? pillActive : pillInactive
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 flex-wrap mt-2">
          {/* Granularity */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">Granularité :</span>
            <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
              {CA_GRANULARITIES.map((g) => (
                <button
                  key={g.value}
                  onClick={() => onGranularityChange(g.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    granularity === g.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range */}
          {preset === 'custom' && (
            <div className="flex items-center gap-2 ml-auto">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="h-7 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="h-7 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {/* Data point count badge */}
          {caMensuel.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {caMensuel.length} période{caMensuel.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {caMensuel.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Aucune donnée sur cette période.
          </div>
        ) : (
          <div
            style={{
              overflowX: needsScroll ? 'auto' : 'visible',
              WebkitOverflowScrolling: 'touch',
            }}
            className="rounded-md"
          >
            <div style={{ minWidth: chartMinWidth }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={caMensuel}
                  barSize={needsScroll ? 36 : Math.max(18, Math.floor(560 / caMensuel.length) - 8)}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="mois"
                    tick={{ fontSize: needsScroll ? 11 : 12 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={38}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatDZD(v), 'CA']}
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 12,
                      border: '1px solid hsl(var(--border))',
                    }}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.6 }}
                  />
                  <Bar dataKey="ca" radius={[6, 6, 0, 0]}>
                    {caMensuel.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === caMensuel.length - 1
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--accent))'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
  TERMINEE: 'default',
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

// ── Trend from KpiValue ──
function KpiTrend({ kpi }: { kpi: { value: number; previousValue: number } }) {
  return <Trend current={kpi.value} previous={kpi.previousValue} />;
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('30d');

  // ── CA chart state ──
  const [caPreset, setCaPreset] = useState<CaPreset>('mois6');
  const [caGranularity, setCaGranularity] = useState<CaGranularity>('month');
  const [caDateFrom, setCaDateFrom] = useState<string>(() => daysAgo(6));
  const [caDateTo, setCaDateTo] = useState<string>(() => today());

  // Derive caOptions from the preset (or use raw dates in custom mode)
  const caOptions = useMemo<CaChartOptions>(() => {
    if (caPreset === 'semaine') return { dateFrom: daysAgo(6), dateTo: today(), granularity: caGranularity };
    if (caPreset === 'trimestre') return { dateFrom: daysAgo(89), dateTo: today(), granularity: caGranularity };
    if (caPreset === 'annee') return { dateFrom: monthsAgo(11), dateTo: today(), granularity: caGranularity };
    if (caPreset === 'custom') return { dateFrom: caDateFrom || undefined, dateTo: caDateTo || undefined, granularity: caGranularity };
    // mois6 (default) — let the backend use its own default
    return { granularity: caGranularity };
  }, [caPreset, caGranularity, caDateFrom, caDateTo]);

  const handlePresetChange = (p: CaPreset) => {
    setCaPreset(p);
    // Auto-select sensible granularity per preset
    if (p === 'semaine') setCaGranularity('day');
    else if (p === 'trimestre') setCaGranularity('week');
    else setCaGranularity('month');
  };

  const { data: stats, isLoading } = useDashboard(period, caOptions);

  const showTrend = period !== 'all';

  // ── KPI cards ──
  const kpiCards = useMemo(() => {
    if (!stats) return [];

    return [
      {
        label: 'Bons de commande',
        kpi: stats.commandes,
        icon: ShoppingBag,
        iconBg: 'bg-accent',
        iconColor: 'text-primary',
      },
      {
        label: 'Clients',
        kpi: stats.clients,
        icon: Users,
        // iconBg: 'bg-success/10',
        iconBg: 'bg-accent',
        // iconColor: 'text-success',
        iconColor: 'text-primary',
      },
      {
        label: 'Produits',
        kpi: stats.produits,
        icon: Glasses,
        iconBg: 'bg-accent',
        iconColor: 'text-primary',
      },
      {
        label: 'Ordonnances',
        kpi: stats.ordonnances,
        icon: FileText,
        iconBg: 'bg-accent',
        iconColor: 'text-primary',
      },
    ];
  }, [stats]);

  const totalCA = stats?.totalCA.value ?? 0;
  const prevTotalCA = stats?.totalCA.previousValue ?? 0;
  const enCours = stats?.commandesEnCours.value ?? 0;
  const prevEnCours = stats?.commandesEnCours.previousValue ?? 0;
  const caMensuel = stats?.caMensuel ?? [];
  const statusBreakdown = stats?.statusBreakdown ?? [];
  const top5Produits = stats?.top5Produits ?? [];
  const dernieresCommandes: RecentOrderItem[] = stats?.dernieresCommandes ?? [];

  const maxQte = top5Produits[0]?.qte ?? 1;

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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !stats ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">Impossible de charger les statistiques.</p>
          </div>
        ) : (
          <>
            {/* ── KPI CARDS ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpiCards.map((s) => {
                const diff = s.kpi.value - s.kpi.previousValue;
                const trendPositive = diff >= 0;
                return (
                  <Card
                    key={s.label}
                    className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow"
                  >
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-12 w-12 rounded-xl grid place-items-center flex-shrink-0 ${s.iconBg}`}
                        >
                          <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold tracking-tight">
                            {s.kpi.value}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium mt-0.5">
                            {s.label}
                          </div>
                        </div>
                      </div>
                      {showTrend && (
                        <div
                          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                            trendPositive
                              ? 'bg-success/10 text-success'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          <span>{trendPositive ? '↑' : '↓'}</span>
                          <span>
                            {s.kpi.variationPercent !== null
                              ? `${Math.abs(s.kpi.variationPercent)}%`
                              : 'Nouveau'}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* ── CHARTS ROW ── */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Bar chart — CA (dynamic) */}
              <CaChartCard
                caMensuel={caMensuel}
                preset={caPreset}
                granularity={caGranularity}
                dateFrom={caDateFrom}
                dateTo={caDateTo}
                onPresetChange={handlePresetChange}
                onGranularityChange={setCaGranularity}
                onDateFromChange={setCaDateFrom}
                onDateToChange={setCaDateTo}
              />

              {/* Donut — statut commandes */}
              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Statut des commandes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusBreakdown.length === 0 ? (
                    <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                      Aucune commande sur cette période.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={statusBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {statusBreakdown.map((entry) => (
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
                  {dernieresCommandes.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-8 text-center">
                      Aucun bon sur cette période.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {dernieresCommandes.map((c) => (
                        <Link
                          key={c.id}
                          to={`/commandes/${c.id}/imprimer`}
                          className="flex items-center justify-between py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                              N° {c.numero} —{' '}
                              {c.clientNom
                                ? `${c.clientPrenom} ${c.clientNom}`
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
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right column: Synthèse + Top 5 */}
              <div className="flex flex-col gap-4">
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
          </>
        )}
      </div>
    </>
  );
}
