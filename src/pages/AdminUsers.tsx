import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, ShieldOff, RefreshCw } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

type Role = 'ADMIN' | 'OPTICIEN';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  roles: Role[];
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/users');
      setUsers(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (u: AdminUser, role: Role) => {
    const has = u.roles.includes(role);
    setBusyId(`${u.id}:${role}`);
    try {
      if (has) {
        await apiClient.delete('/users/roles/revoke', {
          data: { userId: u.id, role },
        });
        toast.success(`Rôle ${role} retiré`);
      } else {
        await apiClient.post('/users/roles/assign', { userId: u.id, role });
        toast.success(`Rôle ${role} attribué`);
      }
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Assignez ou révoquez les rôles ADMIN et OPTICIEN"
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{' '}
            Actualiser
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 grid place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Aucun utilisateur
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.displayName || '—'}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (vous)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            aucun
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r) => (
                              <Badge
                                key={r}
                                variant={
                                  r === 'ADMIN' ? 'default' : 'secondary'
                                }
                              >
                                {r}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {(['ADMIN', 'OPTICIEN'] as Role[]).map((r) => {
                          const has = u.roles.includes(r);
                          const key = `${u.id}:${r}`;
                          if (isSelf) return null; // Prevent self-modification
                          return (
                            <Button
                              key={r}
                              size="sm"
                              variant={has ? 'outline' : 'secondary'}
                              disabled={busyId === key}
                              onClick={() => toggleRole(u, r)}
                            >
                              {busyId === key ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : has ? (
                                <ShieldOff className="h-3.5 w-3.5" />
                              ) : (
                                <Shield className="h-3.5 w-3.5" />
                              )}
                              {has ? `Retirer ${r}` : `Attribuer ${r}`}
                            </Button>
                          );
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
