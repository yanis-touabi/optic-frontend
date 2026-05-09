import type { CommandeStatut } from "./types";

export const formatDZD = (n: number) =>
  new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 2 }).format(n);

export const formatDate = (s?: string) =>
  s ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(s)) : "—";

export const formatDateTime = (s?: string) =>
  s ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(s)) : "—";

export const statutLabel: Record<CommandeStatut, string> = {
  EN_ATTENTE: "En attente",
  EN_TRAITEMENT: "En traitement",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};
