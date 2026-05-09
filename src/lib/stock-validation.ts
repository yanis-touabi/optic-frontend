import type { LigneCommande, Produit } from './types';

export interface StockIssue {
  produitId: string;
  nom: string;
  disponible: number;
  demande: number;
  manquant: number;
}

/**
 * Aggregates required quantities per product and returns issues
 * for products where demand exceeds available stock.
 */
export function checkStock(
  lignes: Pick<LigneCommande, 'produitId' | 'quantite'>[],
  produits: Produit[],
): StockIssue[] {
  const qtyByProduit = new Map<string, number>();
  for (const l of lignes) {
    if (!l.produitId) continue;
    qtyByProduit.set(
      l.produitId,
      (qtyByProduit.get(l.produitId) ?? 0) + (l.quantite || 0),
    );
  }
  const issues: StockIssue[] = [];
  for (const [pid, demande] of qtyByProduit) {
    const p = produits.find((x) => x.id === pid);
    if (!p) continue;
    if (demande > p.stock) {
      issues.push({
        produitId: pid,
        nom: p.nom,
        disponible: p.stock,
        demande,
        manquant: demande - p.stock,
      });
    }
  }
  return issues;
}
