import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Eye,
  Glasses,
  Users,
  FileText,
  ShoppingBag,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  UserCircle,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, type AppRole } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
};

const nav: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  {
    to: '/commandes',
    label: 'Bons de commande',
    icon: ShoppingBag,
    role: 'ADMIN',
  },
  {
    to: '/commandes/nouveau',
    label: 'Nouveau bon',
    icon: ClipboardList,
    role: 'ADMIN',
  },
  { to: '/clients', label: 'Clients', icon: Users, role: 'ADMIN' },
  { to: '/produits', label: 'Produits', icon: Glasses, role: 'ADMIN' },
  { to: '/ordonnances', label: 'Ordonnances', icon: FileText },
  { to: '/profil', label: 'Profil', icon: UserCircle },
  {
    to: '/admin/utilisateurs',
    label: 'Utilisateurs',
    icon: ShieldCheck,
    role: 'ADMIN',
  },
];

export default function AppLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isSuperAdmin, isAdmin } = useAuth();
  const visibleNav = nav.filter((n) => {
    if (!n.role) return true;
    if (isSuperAdmin) return true; // SUPER_ADMIN sees everything
    if (n.role === 'ADMIN') return isAdmin;
    return true;
  });
  const isPrint = loc.pathname.includes('/imprimer');

  const handleLogout = async () => {
    await signOut();
    toast.success('Déconnecté');
    navigate('/auth');
  };

  if (isPrint) return <Outlet />;

  return (
    <div className="h-screen overflow-hidden flex bg-background">
      <aside className="no-print w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="px-6 py-6 border-b border-sidebar-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">OptiShop</div>
            <div className="text-xs text-sidebar-foreground/60">
              Gestion opticien
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-sidebar-border space-y-2">
          {user && (
            <div className="px-3 py-1 space-y-1">
              <div
                className="text-sm font-medium text-sidebar-foreground truncate"
                title={user.displayName || 'Utilisateur'}
              >
                {user.displayName || 'Utilisateur'}
              </div>
              <div
                className="text-xs text-sidebar-foreground/60 truncate"
                title={user.email ?? ''}
              >
                {user.email}
              </div>
              {user.role && (
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge
                    variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {user.role}
                  </Badge>
                </div>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
          <div className="px-3 text-[10px] text-sidebar-foreground/40">
            v1.0
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
