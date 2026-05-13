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
import { useStore, useUpdateStore, useUpdateStoreLogo } from '@/lib/data';
import { Store as StoreIcon, Upload, Loader2, Image as ImageIcon } from 'lucide-react';

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

  // --- Store Management ---
  const { data: store, isLoading: storeLoading } = useStore();
  const updateStore = useUpdateStore();
  const updateLogo = useUpdateStoreLogo();
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');

  useEffect(() => {
    if (store) {
      setStoreName(store.name);
      setStorePhone(store.telephone || '');
      setStoreAddress(store.address || '');
    }
  }, [store]);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStore.mutateAsync({ 
        name: storeName,
        telephone: storePhone,
        address: storeAddress,
      });
      toast.success('Paramètres du magasin enregistrés');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await updateLogo.mutateAsync(file);
      toast.success('Logo mis à jour');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'upload');
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <PageHeader title="Profil" description="Vos informations de compte" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
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

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StoreIcon className="h-5 w-5" />
                  Paramètres du magasin
                </CardTitle>
                <CardDescription>
                  Gérez le nom et le logo de votre magasin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSaveStore} className="space-y-4">
                  <div>
                    <Label>Nom du magasin</Label>
                    <Input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      disabled={storeLoading || updateStore.isPending}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        disabled={storeLoading || updateStore.isPending}
                        placeholder="Ex: 021 00 00 00"
                      />
                    </div>
                    <div>
                      <Label>Adresse</Label>
                      <Input
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        disabled={storeLoading || updateStore.isPending}
                        placeholder="Ex: Alger, Algérie"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={storeLoading || updateStore.isPending}
                  >
                    {updateStore.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer les paramètres'
                    )}
                  </Button>
                </form>

                <div className="pt-4 border-t">
                  <Label className="block mb-4">Logo du magasin</Label>
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
                      {store?.logoUrl ? (
                        <img
                          src={`${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')}/${store.logoUrl}`}
                          alt="Logo actuel"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-3">
                        Format recommandé: PNG, JPG ou WEBP. Taille max: 2MB.
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          id="logo-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={updateLogo.isPending}
                        />
                        <Button
                          variant="outline"
                          asChild
                          disabled={updateLogo.isPending}
                        >
                          <label
                            htmlFor="logo-upload"
                            className="cursor-pointer flex items-center"
                          >
                            {updateLogo.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="mr-2 h-4 w-4" />
                            )}
                            {store?.logoUrl ? 'Changer le logo' : 'Uploader un logo'}
                          </label>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>Réinitialiser votre mot de passe</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={sendReset} disabled={resetBusy} className="w-full">
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
    </div>
  );
}
