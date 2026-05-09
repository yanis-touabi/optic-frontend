import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type AppRole } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogIn, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: JSX.Element;
  requireRole?: AppRole;
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { user, loading, roles, isAdmin, isManager, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background to-muted/40 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2">
              <LogIn className="h-6 w-6" />
            </div>
            <CardTitle>Authentification requise</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={`/auth?next=${encodeURIComponent(location.pathname)}`}>
                Se connecter
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireRole) {
    const allowed =
      requireRole === 'OPTICIEN'
        ? isManager
        : requireRole === 'ADMIN'
          ? isAdmin
          : hasRole(requireRole);

    if (!allowed) {
      return (
        <div className="min-h-screen grid place-items-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-destructive/10 text-destructive grid place-items-center mb-2">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <CardTitle>Accès refusé</CardTitle>
              <CardDescription>
                Vous n'avez pas les autorisations nécessaires (rôle requis :{' '}
                <strong>{requireRole}</strong>) pour accéder à cette page. Vos
                rôles actuels : {roles.length ? roles.join(', ') : 'aucun'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Retour au tableau de bord</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return children;
}
