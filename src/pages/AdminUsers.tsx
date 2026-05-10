import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Edit2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  status: UserStatus;
  roles: Role[];
}

interface PendingUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  status: UserStatus;
  roles: Role[];
}

interface EditUserForm {
  role: Role;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [activeUsers, setActiveUsers] = useState<AdminUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string>('');

  // Edit user modal state
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const editForm = useForm<EditUserForm>({
    defaultValues: {
      role: 'EMPLOYEE',
    },
  });
  const [updatingUser, setUpdatingUser] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [activeRes, pendingRes] = await Promise.all([
        apiClient.get('/admin/users'),
        apiClient.get('/admin/pending-users'),
      ]);
      setActiveUsers(activeRes.data);
      setPendingUsers(pendingRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ─── Approve/Reject Pending Users ──────────────────────────────────────

  const openEditFor = (user: AdminUser) => {
    // Prevent editing SUPER_ADMIN or self
    if (user.roles.includes('SUPER_ADMIN') || user.id === currentUser?.id) {
      toast.error('Vous ne pouvez pas modifier cet utilisateur');
      return;
    }
    setEditingUser(user);
    editForm.reset({
      role: (user.roles[0] || 'EMPLOYEE') as Role,
    });
    setOpenEditModal(true);
  };

  const onEditUser = async (data: EditUserForm) => {
    if (!editingUser) return;
    setUpdatingUser(true);
    try {
      await apiClient.patch(`/admin/users/${editingUser.id}/role`, {
        role: data.role,
      });
      toast.success('Rôle mis à jour');
      editForm.reset();
      setOpenEditModal(false);
      await load();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur de mise à jour';
      toast.error(message);
    } finally {
      setUpdatingUser(false);
    }
  };

  // ─── Approve/Reject Pending Users ──────────────────────────────────────

  const onApproveUser = async (user: PendingUser, role: Role) => {
    setBusyId(user.id);
    try {
      await apiClient.patch(`/admin/users/${user.id}/approve`, { role });
      toast.success('Utilisateur approuvé');
      await load();
    } catch (error: any) {
      const message = error.response?.data?.message || "Erreur d'approbation";
      toast.error(message);
    } finally {
      setBusyId('');
    }
  };

  const onRejectUser = async (user: PendingUser) => {
    setBusyId(user.id);
    try {
      await apiClient.patch(`/admin/users/${user.id}/reject`);
      toast.success('Utilisateur rejeté');
      await load();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur de rejet';
      toast.error(message);
    } finally {
      setBusyId('');
    }
  };

  // ─── Toggle Role ───────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Approuvez les nouvelles inscriptions et gérez les rôles des utilisateurs"
        actions={
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{' '}
            Actualiser
          </Button>
        }
      />

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h3 className="font-semibold">
                Utilisateurs en attente d'approbation
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right space-x-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id}
                        onClick={() => onApproveUser(u, 'EMPLOYEE')}
                      >
                        {busyId === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Approuver (Employé)'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id}
                        onClick={() => onApproveUser(u, 'MANAGER')}
                      >
                        {busyId === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Approuver (Manager)'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === u.id}
                        onClick={() => onRejectUser(u)}
                      >
                        {busyId === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Rejeter'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active Users */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Utilisateurs actifs</h3>
          </div>
          {loading ? (
            <div className="p-12 grid place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : activeUsers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Aucun utilisateur actif
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
                {activeUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isSuperAdmin = u.roles.includes('SUPER_ADMIN');

                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.fullName}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (vous)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <Badge
                              key={r}
                              variant={
                                r === 'SUPER_ADMIN'
                                  ? 'destructive'
                                  : r === 'ADMIN'
                                    ? 'default'
                                    : 'secondary'
                              }
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isSuperAdmin && !isSelf && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditFor(u)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              {editingUser?.email && (
                <p className="text-sm text-muted-foreground">
                  Utilisateur: {editingUser.email}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditUser)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="role"
                rules={{ required: 'Rôle requis' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EMPLOYEE">Employé</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="ADMIN">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenEditModal(false)}
                  disabled={updatingUser}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={updatingUser}>
                  {updatingUser && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
