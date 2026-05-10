import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import PasswordChecklist from '@/components/PasswordChecklist';
import { strongPasswordSchema, isPasswordValid } from '@/lib/password-policy';

const emailSchema = z.string().trim().email('Email invalide').max(255);
const passwordSchema = z.string().min(1, 'Requis').max(72);
const nameSchema = z.string().trim().min(1, 'Requis').max(100);

export default function Auth() {
  const { user, loading, signIn: authSignIn } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // sign in
  const [siEmail, setSiEmail] = useState('');
  const [siPwd, setSiPwd] = useState('');
  const [signInError, setSignInError] = useState('');
  // sign up
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPwd, setSuPwd] = useState('');
  const [suStoreId, setSuStoreId] = useState('');

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Chargement…
      </div>
    );
  if (user) return <Navigate to="/" replace />;

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(siEmail);
      passwordSchema.parse(siPwd);
    } catch (err) {
      const message =
        err instanceof z.ZodError ? err.errors[0].message : 'Champs invalides';
      setSignInError(message);
      return toast.error(message);
    }
    setSignInError('');
    setBusy(true);
    try {
      const { data } = await apiClient.post('/auth/login', {
        email: siEmail,
        password: siPwd,
      });
      await authSignIn(data.access_token);
      toast.success('Connecté');
      nav('/');
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Email ou mot de passe incorrect';
      setSignInError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(suName);
      emailSchema.parse(suEmail);
      strongPasswordSchema.parse(suPwd);
      z.string().uuid('Store ID invalide').parse(suStoreId);
    } catch (err) {
      return toast.error(
        err instanceof z.ZodError ? err.errors[0].message : 'Champs invalides',
      );
    }
    setBusy(true);
    try {
      await apiClient.post('/auth/register', {
        email: suEmail,
        password: suPwd,
        fullName: suName,
        storeId: suStoreId,
      });
      toast.success(
        "Inscription soumise ! Votre compte est en attente d'approbation par un administrateur.",
      );
      // Reset form
      setSuName('');
      setSuEmail('');
      setSuPwd('');
      setSuStoreId('');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'inscription",
      );
    } finally {
      setBusy(false);
    }
  };

  const sendForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.error(
      "La réinitialisation de mot de passe n'est pas encore disponible sur le nouveau backend.",
    );
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background to-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-semibold">OptiShop</div>
            <div className="text-xs text-muted-foreground">
              Gestion opticien
            </div>
          </div>
        </div>
        <Card className="shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle>Bienvenue</CardTitle>
            <CardDescription>
              Connectez-vous ou créez un compte pour continuer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {forgot ? (
              <form onSubmit={sendForgot} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? 'Envoi...' : 'Envoyer le lien'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setForgot(false)}
                >
                  Retour
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="signin">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="signin">Connexion</TabsTrigger>
                  <TabsTrigger value="signup">Inscription</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <form onSubmit={signIn} className="space-y-4 mt-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={siEmail}
                        onChange={(e) => setSiEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Mot de passe</Label>
                      <Input
                        type="password"
                        value={siPwd}
                        onChange={(e) => setSiPwd(e.target.value)}
                        required
                      />
                    </div>
                    {signInError && (
                      <div className="text-sm text-destructive">
                        {signInError}
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy ? 'Connexion...' : 'Se connecter'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(siEmail);
                        setForgot(true);
                      }}
                      className="text-sm text-primary hover:underline w-full text-center"
                    >
                      Mot de passe oublié ?
                    </button>
                  </form>
                </TabsContent>
                <TabsContent value="signup">
                  <form onSubmit={signUp} className="space-y-4 mt-4">
                    <div>
                      <Label>Nom complet</Label>
                      <Input
                        value={suName}
                        onChange={(e) => setSuName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={suEmail}
                        onChange={(e) => setSuEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>ID du magasin</Label>
                      <Input
                        value={suStoreId}
                        onChange={(e) => setSuStoreId(e.target.value)}
                        placeholder="Entrez l'ID du magasin"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mot de passe</Label>
                      <Input
                        type="password"
                        value={suPwd}
                        onChange={(e) => setSuPwd(e.target.value)}
                        required
                      />
                      <PasswordChecklist password={suPwd} />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={busy || !isPasswordValid(suPwd)}
                    >
                      {busy ? 'Création...' : 'Créer mon compte'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
