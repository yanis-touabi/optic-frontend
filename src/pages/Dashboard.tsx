import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  Users,
  Glasses,
  FileText,
  Plus,
  Loader2,
} from 'lucide-react';
import { formatDZD, formatDateTime, statutLabel } from '@/lib/format';
import {
  useClients,
  useCommandes,
  useOrdonnances,
  useProduits,
} from '@/lib/data';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { data: clients = [] } = useClients();
  const { data: produits = [] } = useProduits();
  const { data: ordonnances = [] } = useOrdonnances();
  const { data: commandes = [], isLoading } = useCommandes();

  const totalCA = commandes
    .filter((c) => c.statut !== 'ANNULEE')
    .reduce((s, c) => s + (Number(c.montantTotal) || 0), 0);
  const enCours = commandes.filter(
    (c) => c.statut === 'EN_ATTENTE' || c.statut === 'EN_TRAITEMENT',
  ).length;
  const recents = commandes.slice(0, 5);

  const stats = [
    {
      label: 'Bons de commande',
      value: commandes.length,
      icon: ShoppingBag,
      color: 'text-primary bg-accent',
    },
    {
      label: 'Clients',
      value: clients.length,
      icon: Users,
      color: 'text-success bg-success/10',
    },
    {
      label: 'Produits',
      value: produits.length,
      icon: Glasses,
      color: 'text-warning bg-warning/10',
    },
    {
      label: 'Ordonnances',
      value: ordonnances.length,
      icon: FileText,
      color: 'text-primary bg-primary/10',
    },
  ];

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="shadow-[var(--shadow-card)]">
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className={`h-12 w-12 rounded-lg grid place-items-center ${s.color}`}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-[var(--shadow-card)]">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">
                Bons de commande récents
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/commandes">Voir tout</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </div>
              ) : recents.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  Aucun bon pour le moment.
                </div>
              ) : (
                <div className="divide-y">
                  {recents.map((c) => {
                    const client = clients.find((x) => x.id === c.clientId);
                    return (
                      <Link
                        key={c.id}
                        to={`/commandes/${c.id}/imprimer`}
                        className="flex items-center justify-between py-3 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
                      >
                        <div>
                          <div className="font-medium">
                            N° {c.numero} —{' '}
                            {client
                              ? `${client.prenom} ${client.nom}`
                              : 'Client supprimé'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(c.createdAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatDZD(c.montantTotal)}
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {statutLabel[c.statut]}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Synthèse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Chiffre d'affaires total
                </div>
                <div className="text-2xl font-semibold text-primary">
                  {formatDZD(totalCA)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Commandes en cours
                </div>
                <div className="text-2xl font-semibold">{enCours}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
