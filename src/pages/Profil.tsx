import { useEffect, useState } from 'react';
import { z } from 'zod';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const nameSchema = z.string().trim().min(1, 'Requis').max(100);

export default function Profil() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user?.displayName ?? '');
      setLoading(false);
    }
  }, [user]);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      nameSchema.parse(displayName);
    } catch (err) {
      return toast.error(
        err instanceof z.ZodError ? err.errors[0].message : 'Nom invalide',
      );
    }
    setBusy(true);
    try {
      await apiClient.patch('/auth/profile', { displayName });
      toast.success('Profil mis à jour');
      window.dispatchEvent(new Event('profile:updated'));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Erreur lors de la mise à jour',
      );
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    toast.error(
      "La réinitialisation de mot de passe n'est pas encore disponible sur le nouveau backend.",
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Profil" description="Vos informations de compte" />
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>
              Mettez à jour votre nom d'affichage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveName} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={user?.email ?? ''} disabled />
              </div>
              <div>
                <Label>Nom d'affichage</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={busy || loading}>
                {busy ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
            <CardDescription>Réinitialiser votre mot de passe</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={sendReset} disabled={resetBusy}>
              {resetBusy ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rôle</CardTitle>
            <CardDescription>
              Vos autorisations dans l'application
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user?.role ? (
              <p className="text-sm text-muted-foreground">
                Aucun rôle assigné. Contactez un administrateur.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                >
                  {user.role}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
