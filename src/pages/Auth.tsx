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
import logo from '/nedhra!bg.svg';

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
  const [suStoreName, setSuStoreName] = useState('');

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
      z.string().min(1, 'Nom du magasin requis').max(255).parse(suStoreName);
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
        storeName: suStoreName,
      });
      toast.success(
        "Inscription soumise ! Votre compte est en attente d'approbation par un administrateur.",
      );
      // Reset form
      setSuName('');
      setSuEmail('');
      setSuPwd('');
      setSuStoreName('');
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
        <div className="flex items-center justify-center gap-1 mb-6">
          <div className="h-10 w-10 grid place-items-center overflow-hidden">
            <img
              src="./logo!bg.png"
              alt=" "
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="flex flex-col justify-center">
            <svg
              viewBox="430 440 1220 260"
              className="h-6 w-auto mt-2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                transform="translate(442,448)"
                d="m0 0h36l7 5 11 16 13 18 12 17 14 20 13 18 13 19 12 16 11 16 13 18 7 10 2 5h2v-173l5-5h33l4 4 1 3v231l-2 5-4 4h-36l-7-5-11-16-26-36-14-20-12-17-13-18-13-19-11-15-12-17-11-16-1 2v168l-2 6-3 3h-33l-5-5v-235l4-5z"
                fill="#0A3D69"
              />
              <path
                transform="translate(1034,445)"
                d="m0 0h30l5 5 1 4v234l-2 5-2 2h-31l-4-3-1-3-1-16-10 11-14 9-11 4-10 2h-24l-18-4-17-9-13-11-9-11-9-16-5-16-2-12v-26l4-19 7-16 7-11 9-10 9-8 14-8 16-5 14-2h10l17 3 13 5 9 6 10 9 3 3-1-3v-86l3-5zm-65 108-13 4-9 6-5 4-8 12-5 16-1 16 3 16 4 9 5 8 5 5 8 7 12 5 4 1h20l11-4 10-6 8-8 5-8 5-14 1-7v-15l-3-14-6-12-11-12-10-6-12-3z"
                fill="#0B3E69"
              />
              <path
                transform="translate(1114,445)"
                d="m0 0h31l5 5v91l13-13 14-8 14-4 9-1h9l14 2 16 5 13 8 8 7 7 10 5 11 4 13 2 16v103l-5 5h-32l-4-3-1-3-1-100-5-16-8-11-10-6-9-2h-16l-11 3-10 6-6 7-6 12-3 13-1 95-4 5h-33l-4-5v-240z"
                fill="#0A3D69"
              />
              <path
                transform="translate(1512,515)"
                d="m0 0h9l14 2 15 5 11 7 7 6 5 7 1-16 3-5 2-1h30l4 4v167l-4 4h-30l-4-3-1-3-1-16-9 10-14 9-9 4-13 3h-23l-15-3-14-6-13-9-13-13-7-11-6-12-4-14-2-12v-23l4-20 7-16 6-10 7-9 8-7 11-8 14-6 15-4zm1 38-13 4-9 6-8 8-8 16-2 8-1 15 2 13 5 13 6 9 9 9 12 6 7 2h20l12-4 9-6 5-4 7-10 5-12 2-8v-20l-3-12-7-14-6-7-8-6-8-4-9-2z"
                fill="#0B3E69"
              />
              <path
                transform="translate(771,515)"
                d="m0 0 19 1 19 5 16 8 9 7 11 11 8 13 6 15 3 12 1 9v18l-5 5h-131v7l5 13 8 11 9 7 8 4 15 3h9l13-2 14-7 6-5 9-12h9l23 7 4 4-1 5-7 11-7 9-11 9-10 6-10 5-15 4-7 1h-26l-20-4-13-6-12-7-12-11-8-9-6-10-7-19-2-9-1-10v-13l2-15 5-16 8-16 9-11 7-7 10-7 16-8 19-5zm3 34-15 2-14 7-7 6-7 10-5 13v2h95l-1-8-7-14-6-7-11-7-10-3z"
                fill="#0D3F6B"
              />
              <path
                transform="translate(1400,516)"
                d="m0 0h12l5 2 3 3v29l-4 6-21 1-11 3-9 5-5 5-6 9-4 10-2 9-1 90-3 5-2 2h-32l-4-3-1-3v-163l3-5 2-1h30l3 2 1 3 1 22 6-9 9-10 14-8z"
                fill="#0B3E6A"
              />
            </svg>
          </div>
        </div>
        <Card className="shadow-[var(--shadow-elegant)]">
          <CardHeader className="text-center">
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
                      <Label>Nom du magasin</Label>
                      <Input
                        value={suStoreName}
                        onChange={(e) => setSuStoreName(e.target.value)}
                        placeholder="Entrez le nom du magasin"
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
