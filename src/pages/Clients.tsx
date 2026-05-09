import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import type { Client } from "@/lib/types";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "@/lib/data";
import { toast } from "sonner";

const empty: Omit<Client, "id" | "createdAt"> = {
  nom: "",
  prenom: "",
  telephone: "",
  email: "",
  adresse: "",
  notes: "",
  dateNaissance: "",
};

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const createMut = useCreateClient();
  const updateMut = useUpdateClient();
  const deleteMut = useDeleteClient();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(empty);

  const filtered = clients.filter((c) =>
    `${c.nom} ${c.prenom} ${c.telephone} ${c.email}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing(c);

    setForm({
      nom: c.nom ?? "",
      prenom: c.prenom ?? "",
      telephone: c.telephone ?? "",
      email: c.email ?? "",
      adresse: c.adresse ?? "",
      notes: c.notes ?? "",
      dateNaissance: c.dateNaissance ?? "",
    });

    setOpen(true);
  };

  const save = async () => {
    if (!form.nom.trim()) return toast.error("Le nom est requis");

    const payload = {
      nom: form.nom,
      prenom: form.prenom,
      telephone: form.telephone,
      email: form.email,
      adresse: form.adresse,
      notes: form.notes,
      dateNaissance: form.dateNaissance,
    };

    try {
      if (editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          patch: payload,
        });

        toast.success("Client mis à jour");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Client ajouté");
      }

      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Client supprimé");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <>
      <PageHeader
        title="Clients"
        description="Gérez votre fichier client"
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        }
      />
      <div className="p-8 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9"
          />
        </div>
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun client
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.prenom} {c.nom}
                      </TableCell>
                      <TableCell>{c.telephone || "—"}</TableCell>
                      <TableCell>{c.email || "—"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {c.adresse || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(c.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prénom</Label>
              <Input
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={form.telephone}
                onChange={(e) =>
                  setForm({ ...form, telephone: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={form.dateNaissance ?? ""}
                onChange={(e) =>
                  setForm({ ...form, dateNaissance: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <Label>Adresse</Label>
              <Input
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
