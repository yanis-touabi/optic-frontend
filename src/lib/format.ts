import type { CommandeStatut } from './types';

export const formatDZD = (n: number) =>
  new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 2,
  }).format(Number.isNaN(n) ? 0 : n);

export const formatDate = (s?: string) =>
  s
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(
        new Date(s),
      )
    : '—';

/**
 * Converts any ISO date or datetime string (e.g. "2025-12-25T00:00:00.000Z")
 * into the "YYYY-MM-DD" format required by <input type="date"> value.
 */
export const toInputDate = (s?: string | null): string => {
  if (!s) return '';
  // If already YYYY-MM-DD, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Otherwise parse and extract date part in local time
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const formatDateTime = (s?: string) =>
  s
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(s))
    : '—';

export const statutLabel: Record<CommandeStatut, string> = {
  EN_ATTENTE: 'En attente',
  EN_TRAITEMENT: 'En traitement',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};
