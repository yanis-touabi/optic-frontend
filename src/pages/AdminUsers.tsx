import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogFooter,
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
import {
  Loader2,
  RefreshCw,
  Edit2,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import {
  usePaginatedAdminUsers,
  usePaginatedPendingAdminUsers,
} from '@/lib/data';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PaginationControls } from '@/components/PaginationControls';

type Role = 'ADMIN' | 'EMPLOYEE';
type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  status: UserStatus;
  role: Role | 'SUPER_ADMIN';
}

interface PendingUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  status: UserStatus;
}

interface EditUserForm {
  role: Role;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;

  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: unknown } } };
    if (typeof err.response?.data?.message === 'string') {
      return err.response.data.message;
    }
  }

  return fallback;
};

export default function AdminUsers() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [busyId, setBusyId] = useState<string>('');

  const [activePage, setActivePage] = useState(0);
  const [activeSize, setActiveSize] = useState(10);
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingSize, setPendingSize] = useState(10);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const activeUsersQuery = usePaginatedAdminUsers({
    page: activePage,
    size: activeSize,
    q: debouncedSearchQuery || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sort: 'createdAt',
  });

  const pendingUsersQuery = usePaginatedPendingAdminUsers({
    page: pendingPage,
    size: pendingSize,
    q: debouncedSearchQuery || undefined,
    sort: 'createdAt',
  });

  useEffect(() => {
    setActivePage(0);
    setPendingPage(0);
  }, [debouncedSearchQuery, roleFilter, statusFilter]);

  // Edit user modal state
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const editForm = useForm<EditUserForm>({
    defaultValues: {
      role: 'EMPLOYEE',
    },
  });
  const [updatingUser, setUpdatingUser] = useState(false);

  // Confirmation modals
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'change_role' | 'toggle_status';
    user: AdminUser | PendingUser;
    newRole?: Role;
  } | null>(null);

  const refreshUsers = async () => {
    await Promise.all([
      activeUsersQuery.refetch(),
      pendingUsersQuery.refetch(),
    ]);
  };

  const activeUsers = (activeUsersQuery.data?.content ?? []) as AdminUser[];
  const pendingUsers = (pendingUsersQuery.data?.content ?? []) as PendingUser[];
  const isLoading = activeUsersQuery.isLoading || pendingUsersQuery.isLoading;
  const isFetching =
    activeUsersQuery.isFetching || pendingUsersQuery.isFetching;
  const activeTotal = (activeUsersQuery.data?.totalElements ?? 0) as number;
  const pendingTotal = (pendingUsersQuery.data?.totalElements ?? 0) as number;

  // ─── Approve/Reject Pending Users ──────────────────────────────────────

  const openEditFor = (user: AdminUser) => {
    // Prevent editing SUPER_ADMIN or self
    if (user.role === 'SUPER_ADMIN' || user.id === currentUser?.id) {
      toast.error('Vous ne pouvez pas modifier cet utilisateur');
      return;
    }

    // ADMIN cannot edit other ADMINS
    if (!isSuperAdmin && user.role === 'ADMIN') {
      toast.error(
        "Les administrateurs ne peuvent pas modifier d'autres administrateurs",
      );
      return;
    }

    setEditingUser(user);
    editForm.reset({
      role: (user.role as Role) || 'EMPLOYEE',
    });
    setOpenEditModal(true);
  };

  const confirmEditUser = (data: EditUserForm) => {
    if (!editingUser) return;
    setConfirmAction({
      type: 'change_role',
      user: editingUser,
      newRole: data.role,
    });
  };

  const executeEditUser = async () => {
    if (!confirmAction || confirmAction.type !== 'change_role') return;

    const { user, newRole } = confirmAction as {
      user: AdminUser;
      newRole: Role;
    };
    setUpdatingUser(true);
    try {
      await apiClient.patch(`/admin/users/${user.id}/role`, {
        role: newRole,
      });
      toast.success('Rôle mis à jour');
      editForm.reset();
      setOpenEditModal(false);
      setConfirmAction(null);
      await refreshUsers();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Erreur de mise à jour');
      toast.error(message);
    } finally {
      setUpdatingUser(false);
    }
  };

  // ─── Approve/Reject Pending Users ──────────────────────────────────────

  const confirmApproveUser = (user: PendingUser, role: Role) => {
    setConfirmAction({
      type: 'approve',
      user,
      newRole: role,
    });
  };

  const confirmRejectUser = (user: PendingUser) => {
    setConfirmAction({
      type: 'reject',
      user,
    });
  };

  const executeApproveUser = async () => {
    if (!confirmAction || confirmAction.type !== 'approve') return;

    const { user, newRole } = confirmAction as {
      user: PendingUser;
      newRole: Role;
    };
    setBusyId(user.id);
    try {
      await apiClient.patch(`/admin/users/${user.id}/approve`, {
        role: newRole,
      });
      toast.success('Utilisateur approuvé');
      setConfirmAction(null);
      await refreshUsers();
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Erreur d'approbation");
      toast.error(message);
    } finally {
      setBusyId('');
    }
  };

  const executeRejectUser = async () => {
    if (!confirmAction || confirmAction.type !== 'reject') return;

    const { user } = confirmAction;
    setBusyId(user.id);
    try {
      await apiClient.patch(`/admin/users/${user.id}/reject`);
      toast.success('Utilisateur rejeté');
      setConfirmAction(null);
      await refreshUsers();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Erreur de rejet');
      toast.error(message);
    } finally {
      setBusyId('');
    }
  };

  // ─── Toggle Role ───────────────────────────────────────────────────────

  const confirmToggleStatus = (user: AdminUser) => {
    setConfirmAction({
      type: 'toggle_status',
      user,
    });
  };

  const executeToggleStatus = async () => {
    if (!confirmAction || confirmAction.type !== 'toggle_status') return;

    const { user } = confirmAction;
    setBusyId(user.id);
    try {
      await apiClient.patch(`/admin/users/${user.id}/toggle-status`);
      toast.success(
        user.status === 'ACTIVE'
          ? 'Utilisateur suspendu'
          : 'Utilisateur activé',
      );
      setConfirmAction(null);
      await refreshUsers();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Erreur de modification');
      toast.error(message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Approuvez les nouvelles inscriptions et gérez les rôles des utilisateurs"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={refreshUsers}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />{' '}
            Actualiser
          </Button>
        }
      />

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EMPLOYEE">Employé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="SUSPENDED">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Utilisateurs en attente d'approbation ({pendingTotal})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 grid place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Aucun utilisateur en attente d'approbation
            </div>
          ) : (
            <>
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
                      <TableCell className="font-medium">
                        {u.fullName}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-nowrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === u.id}
                            onClick={() => confirmApproveUser(u, 'EMPLOYEE')}
                          >
                            {busyId === u.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver (Employé)
                              </>
                            )}
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === u.id}
                              onClick={() => confirmApproveUser(u, 'ADMIN')}
                            >
                              {busyId === u.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Approuver (Admin)
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busyId === u.id}
                            onClick={() => confirmRejectUser(u)}
                          >
                            {busyId === u.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeter
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                page={pendingPage}
                size={pendingSize}
                totalPages={pendingUsersQuery.data?.totalPages ?? 1}
                totalElements={pendingTotal}
                disabled={pendingUsersQuery.isFetching}
                onPageChange={(page) => setPendingPage(page)}
                onSizeChange={(size) => {
                  setPendingSize(size);
                  setPendingPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Utilisateurs actifs ({activeTotal})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 grid place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : activeUsers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Aucun utilisateur actif trouvé
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isSuperAdminUser = u.role === 'SUPER_ADMIN';
                    const canEdit =
                      !isSuperAdminUser &&
                      !isSelf &&
                      (isSuperAdmin || u.role === 'EMPLOYEE');

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
                          <Badge
                            variant={
                              u.role === 'SUPER_ADMIN'
                                ? 'destructive'
                                : u.role === 'ADMIN'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {u.role === 'SUPER_ADMIN'
                              ? 'Super Admin'
                              : u.role === 'ADMIN'
                                ? 'Admin'
                                : 'Employé'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.status === 'ACTIVE' ? 'default' : 'secondary'
                            }
                            className="flex items-center gap-1 w-fit"
                          >
                            {u.status === 'ACTIVE' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {u.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-nowrap justify-end gap-2">
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditFor(u)}
                              >
                                <Edit2 className="h-3.5 w-3.5 mr-1" />
                                Modifier
                              </Button>
                            )}
                            {isSuperAdmin && u.status !== 'ACTIVE' && (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={busyId === u.id}
                                onClick={() => confirmToggleStatus(u)}
                              >
                                {busyId === u.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Activer
                                  </>
                                )}
                              </Button>
                            )}
                            {!canEdit && !isSuperAdmin && (
                              <span className="text-xs text-muted-foreground">
                                Non modifiable
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationControls
                page={activePage}
                size={activeSize}
                totalPages={activeUsersQuery.data?.totalPages ?? 1}
                totalElements={activeTotal}
                disabled={activeUsersQuery.isFetching}
                onPageChange={(page) => setActivePage(page)}
                onSizeChange={(size) => {
                  setActiveSize(size);
                  setActivePage(0);
                }}
              />
            </>
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
              onSubmit={editForm.handleSubmit(confirmEditUser)}
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

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer l'action</DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'approve' && (
                <p>
                  Êtes-vous sûr de vouloir approuver{' '}
                  <strong>{confirmAction.user.fullName}</strong>
                  en tant que{' '}
                  <strong>
                    {confirmAction.newRole === 'ADMIN'
                      ? 'Administrateur'
                      : 'Employé'}
                  </strong>{' '}
                  ?
                </p>
              )}
              {confirmAction?.type === 'reject' && (
                <p>
                  Êtes-vous sûr de vouloir rejeter la demande de{' '}
                  <strong>{confirmAction.user.fullName}</strong> ? Cette action
                  est irréversible.
                </p>
              )}
              {confirmAction?.type === 'change_role' && (
                <p>
                  Êtes-vous sûr de vouloir changer le rôle de{' '}
                  <strong>{confirmAction.user.fullName}</strong>
                  en{' '}
                  <strong>
                    {confirmAction.newRole === 'ADMIN'
                      ? 'Administrateur'
                      : 'Employé'}
                  </strong>{' '}
                  ?
                </p>
              )}
              {confirmAction?.type === 'toggle_status' && (
                <p>
                  Êtes-vous sûr de vouloir{' '}
                  {confirmAction.user.status === 'ACTIVE'
                    ? 'suspendre'
                    : 'activer'}{' '}
                  le compte de <strong>{confirmAction.user.fullName}</strong> ?
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={busyId === confirmAction?.user.id || updatingUser}
            >
              Annuler
            </Button>
            <Button
              variant={
                confirmAction?.type === 'reject' ? 'destructive' : 'default'
              }
              onClick={() => {
                if (confirmAction?.type === 'approve') {
                  executeApproveUser();
                } else if (confirmAction?.type === 'reject') {
                  executeRejectUser();
                } else if (confirmAction?.type === 'change_role') {
                  executeEditUser();
                } else if (confirmAction?.type === 'toggle_status') {
                  executeToggleStatus();
                }
              }}
              disabled={busyId === confirmAction?.user.id || updatingUser}
            >
              {busyId === confirmAction?.user.id || updatingUser ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
