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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { formatDZD } from "@/lib/format";
import {
  useProduits,
  useCreateProduit,
  useUpdateProduit,
  useDeleteProduit,
} from "@/lib/data";
import type { Produit, ProduitCategorie } from "@/lib/types";
import { toast } from "sonner";

const empty: Omit<Produit, "id" | "createdAt"> = {
  nom: "",
  marque: "",
  modele: "",
  categorie: "MONTURE",
  description: "",
  prix: 0,
  stock: 0,
};

const catLabel: Record<ProduitCategorie, string> = {
  MONTURE: "Monture",
  VERRE: "Verre",
  ACCESSOIRE: "Accessoire",
};

export default function Produits() {
  const { data: produits = [], isLoading } = useProduits();
  const createMut = useCreateProduit();
  const updateMut = useUpdateProduit();
  const deleteMut = useDeleteProduit();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);
  const [form, setForm] = useState(empty);

  const filtered = produits.filter((p) =>
    `${p.nom} ${p.marque} ${p.modele}`.toLowerCase().includes(q.toLowerCase()),
  );

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (p: Produit) => {
    setEditing(p);

    setForm({
      nom: p.nom ?? "",
      marque: p.marque ?? "",
      modele: p.modele ?? "",
      categorie: p.categorie ?? "MONTURE",
      description: p.description ?? "",
      prix: p.prix ?? 0,
      stock: p.stock ?? 0,
    });

    setOpen(true);
  };

  const save = async () => {
    if (!form.nom.trim()) return toast.error("Le nom est requis");
    try {
      if (editing) {
        const payload = {
          nom: form.nom,
          marque: form.marque,
          modele: form.modele,
          categorie: form.categorie,
          description: form.description,
          prix: form.prix,
          stock: form.stock,
        };

        await updateMut.mutateAsync({
          id: editing.id,
          patch: payload,
        });
        toast.success("Produit mis à jour");
      } else {
        await createMut.mutateAsync(form);
        toast.success("Produit ajouté");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Produit supprimé");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <>
      <PageHeader
        title="Produits"
        description="Catalogue de montures, verres et accessoires"
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nouveau produit
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
                  <TableHead>Marque / Modèle</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun produit
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nom}</TableCell>
                      <TableCell>
                        {p.marque} {p.modele}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {catLabel[p.categorie]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDZD(p.prix)}
                      </TableCell>
                      <TableCell className="text-right">{p.stock}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(p.id)}
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
              {editing ? "Modifier le produit" : "Nouveau produit"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nom *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div>
              <Label>Marque</Label>
              <Input
                value={form.marque}
                onChange={(e) => setForm({ ...form, marque: e.target.value })}
              />
            </div>
            <div>
              <Label>Modèle</Label>
              <Input
                value={form.modele}
                onChange={(e) => setForm({ ...form, modele: e.target.value })}
              />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select
                value={form.categorie}
                onValueChange={(v) =>
                  setForm({ ...form, categorie: v as ProduitCategorie })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTURE">Monture</SelectItem>
                  <SelectItem value="VERRE">Verre</SelectItem>
                  <SelectItem value="ACCESSOIRE">Accessoire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prix (DZD)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.prix}
                onChange={(e) =>
                  setForm({ ...form, prix: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: Number(e.target.value) })
                }
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
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
