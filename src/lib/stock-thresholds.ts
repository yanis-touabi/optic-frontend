/**
 * Shared stock threshold constants and utilities.
 * Single source of truth for all stock health conditions across:
 * - Dashboard KPI cards
 * - Produits page stock filter
 * - KPI click-through URL params
 */

import { CheckCircle2, AlertTriangle, Ban, PackageX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type StockStatus = 'normal' | 'limite' | 'critique' | 'epuise';

export interface StockThresholdConfig {
  status: StockStatus;
  label: string;
  queryValue: string;
  icon: LucideIcon;
  color: string; // Tailwind text/bg color class
  indicatorColor: string; // Tailwind border/accent color
  bgColor: string; // Tailwind background
  lightBg: string; // Tailwind light background
  severity: 'success' | 'warning' | 'danger' | 'critical';
  thresholdDescription: string; // Human-readable condition (e.g. "Stock > 10")
}

/** Returns the stock status for a given quantity. */
export function getStockStatus(qty: number): StockStatus {
  if (qty > 10) return 'normal';
  if (qty > 2) return 'limite'; // 2 < qty <= 10
  if (qty >= 1) return 'critique'; // 1 <= qty <= 2
  return 'epuise'; // qty === 0
}

/** Threshold definitions used for both filtering and mapping results. */
export const STOCK_THRESHOLDS: StockThresholdConfig[] = [
  {
    status: 'normal',
    label: 'Stock normal',
    queryValue: 'normal',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    indicatorColor: 'border-l-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    lightBg: 'bg-green-50/50 dark:bg-green-950/10',
    severity: 'success',
    thresholdDescription: 'Stock > 10 unités',
  },
  {
    status: 'limite',
    label: 'Stock limité',
    queryValue: 'limite',
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    indicatorColor: 'border-l-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    lightBg: 'bg-amber-50/50 dark:bg-amber-950/10',
    severity: 'warning',
    thresholdDescription: ' 3 =< Stock <= 10',
  },
  {
    status: 'critique',
    label: 'Stock critique',
    queryValue: 'critique',
    icon: Ban,
    color: 'text-red-600 dark:text-red-400',
    indicatorColor: 'border-l-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    lightBg: 'bg-red-50/50 dark:bg-red-950/10',
    severity: 'danger',
    thresholdDescription: '1 =< Stock <= 2',
  },
  {
    status: 'epuise',
    label: 'Stock épuisé',
    queryValue: 'epuise',
    icon: PackageX,
    color: 'text-red-700 dark:text-red-300',
    indicatorColor: 'border-l-red-700',
    bgColor: 'bg-red-200 dark:bg-red-900/50',
    lightBg: 'bg-red-50/80 dark:bg-red-950/20',
    severity: 'critical',
    thresholdDescription: 'Stock = 0 unité',
  },
] as const;

/** Builds the stock filter predicate for client-side filtering. */
export function stockFilterPredicate(
  status: StockStatus | null,
): (qty: number) => boolean {
  switch (status) {
    case 'normal':
      return (qty) => qty > 10;
    case 'limite':
      return (qty) => qty > 2 && qty <= 10;
    case 'critique':
      return (qty) => qty >= 1 && qty <= 2;
    case 'epuise':
      return (qty) => qty === 0;
    default:
      return () => true;
  }
}

/** Resolve a StockStatus from a URL query parameter value. */
export function stockStatusFromQuery(value: string | null): StockStatus | null {
  if (!value) return null;
  const match = STOCK_THRESHOLDS.find((t) => t.queryValue === value);
  return match?.status ?? null;
}

/** Resolve the config for a given StockStatus. */
export function getStockConfig(status: StockStatus): StockThresholdConfig {
  return STOCK_THRESHOLDS.find((t) => t.status === status)!;
}
