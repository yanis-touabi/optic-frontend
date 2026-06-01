import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  STOCK_THRESHOLDS,
  getStockStatus,
  type StockThresholdConfig,
} from '@/lib/stock-thresholds';
import type { Produit } from '@/lib/types';
import { useMemo } from 'react';

interface StockKpiCardsProps {
  /** All products to compute KPI counts from */
  produits: Produit[];
}

/**
 * Renders a row of 4 KPI cards for stock health overview.
 * Each card is clickable and navigates to /produits?stock=<status>.
 */
export function StockKpiCards({ produits }: StockKpiCardsProps) {
  const navigate = useNavigate();

  // Compute counts per status — reacts to data changes
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      normal: 0,
      limite: 0,
      critique: 0,
      epuise: 0,
    };
    for (const p of produits) {
      const status = getStockStatus(p.stock);
      map[status]++;
    }
    return map;
  }, [produits]);

  const handleClick = (config: StockThresholdConfig) => {
    navigate(`/produits?stock=${config.queryValue}`);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STOCK_THRESHOLDS.map((config) => {
        const count = counts[config.status];
        const Icon = config.icon;

        return (
          <Card
            key={config.status}
            className={`shadow-[var(--shadow-card)] border-l-4 ${config.indicatorColor} hover:shadow-[var(--shadow-elegant)] transition-all cursor-pointer group`}
            onClick={() => handleClick(config)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(config);
              }
            }}
          >
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className={`h-12 w-12 rounded-xl grid place-items-center flex-shrink-0 ${config.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold tracking-tight tabular-nums">
                    {count}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">
                    {config.label}
                  </div>
                </div>
              </div>

              {/* Hover indicator arrow */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
