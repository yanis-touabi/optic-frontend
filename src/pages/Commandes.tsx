import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Printer, Trash2, Loader2, Pencil, X } from "lucide-react";
import { formatDZD, formatDateTime, statutLabel } from "@/lib/format";
import { useClients, useCommandes, useDeleteCommande, useUpdateCommandeStatut } from "@/lib/data";
import type { CommandeStatut } from "@/lib/types";
import { toast } from "sonner";

const statutColors: Record<CommandeStatut, string> = {
  EN_ATTENTE: "bg-warning/15 text-warning border-warning/30",
  EN_TRAITEMENT: "bg-primary/15 text-primary border-primary/30",
  TERMINEE: "bg-success/15 text-success border-success/30",
  ANNULEE: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function Commandes() {
  const { data: clients = [] } = useClients();
  const { data: commandes = [], isLoading } = useCommandes();
  const updateStatut = useUpdateCommandeStatut();
  const deleteMut = useDeleteCommande();

  const [q, setQ] = useState("");
  const [statut, setStatut] = useState<string>("ALL");
  const [clientId, setClientId] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = commandes.filter((c) => {
    const cl = clients.find((x) => x.id === c.clientId);
    const haystack = `${c.numero} ${cl ? cl.prenom + " " + cl.nom : ""}`.toLowerCase();
    if (!haystack.includes(q.toLowerCase())) return false;
    if (statut !== "ALL" && c.statut !== statut) return false;
    if (clientId !== "ALL" && c.clientId !== clientId) return false;
    if (dateFrom && new Date(c.createdAt) < new Date(dateFrom)) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(c.createdAt) > end) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setQ(""); setStatut("ALL"); setClientId("ALL"); setDateFrom(""); setDateTo("");
  };
  const hasFilters = q || statut !== "ALL" || clientId !== "ALL" || dateFrom || dateTo;

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce bon ?")) return;
    try { await deleteMut.mutateAsync(id); toast.success("Supprimé"); }
    catch (e: any) { toast.error(e.message ?? "Erreur"); }
  };

  const changeStatut = async (id: string, statut: CommandeStatut) => {
    try { await updateStatut.mutateAsync({ id, statut }); }
    catch (e: any) { toast.error(e.message ?? "Erreur"); }
  };

  return (
    <>
      <PageHeader
        title="Bons de commande"
        description="Historique de tous les bons"
        actions={<Button asChild><Link to="/commandes/nouveau"><Plus className="h-4 w-4" />Nouveau bon</Link></Button>}
      />
      <div className="p-8 space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="N° ou client..." className="pl-9" />
          </div>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="Client" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les clients</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statut} onValueChange={setStatut}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="EN_TRAITEMENT">En traitement</SelectItem>
              <SelectItem value="TERMINEE">Terminée</SelectItem>
              <SelectItem value="ANNULEE">Annulée</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Du" />
          <div className="flex gap-2">
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Au" />
            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={resetFilters} title="Réinitialiser"><X className="h-4 w-4" /></Button>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">{filtered.length} résultat(s)</div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-40"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun bon de commande</TableCell></TableRow>
                ) : filtered.map((c) => {
                  const cl = clients.find((x) => x.id === c.clientId);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-medium">{c.numero}</TableCell>
                      <TableCell>{cl ? `${cl.prenom} ${cl.nom}` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(c.createdAt)}</TableCell>
                      <TableCell>
                        <Select value={c.statut} onValueChange={(v) => changeStatut(c.id, v as CommandeStatut)}>
                          <SelectTrigger className={`h-8 w-40 border ${statutColors[c.statut]}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["EN_ATTENTE","EN_TRAITEMENT","TERMINEE","ANNULEE"] as CommandeStatut[]).map((s) => (
                              <SelectItem key={s} value={s}>{statutLabel[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatDZD(c.montantTotal)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="icon" variant="ghost"><Link to={`/commandes/${c.id}/modifier`}><Pencil className="h-4 w-4" /></Link></Button>
                        <Button asChild size="icon" variant="ghost"><Link to={`/commandes/${c.id}/imprimer`}><Printer className="h-4 w-4" /></Link></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
