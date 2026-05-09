import { AlertTriangle } from "lucide-react";
import type { StockIssue } from "@/lib/stock-validation";

export function StockAlert({ issues }: { issues: StockIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
      <div className="flex items-center gap-2 font-medium text-destructive mb-2">
        <AlertTriangle className="h-4 w-4" />
        Stock insuffisant
      </div>
      <ul className="space-y-1 text-destructive/90 list-disc pl-5">
        {issues.map((i) => (
          <li key={i.produitId}>
            <span className="font-medium">{i.nom}</span> — disponible : {i.disponible}, demandé : {i.demande}{" "}
            <span className="text-xs">(manquant : {i.manquant})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
