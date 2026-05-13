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
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, type AppRole } from '@/lib/auth';
import { useStore } from '@/lib/data';
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
  const { data: store } = useStore();
  const visibleNav = nav.filter((n) => {
    if (!n.role) return true;
    if (isSuperAdmin) return true; // SUPER_ADMIN sees everything
    if (n.role === 'ADMIN') return isAdmin;
    return true;
  });
  const isPrint = loc.pathname.includes('/imprimer');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleLogout = async () => {
    await signOut();
    toast.success('Déconnecté');
    navigate('/auth');
  };

  const getLogoUrl = () => {
    if (!store?.logoUrl) return null;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
    return `${base}/${store.logoUrl}`;
  };

  if (isPrint) return <Outlet />;

  return (
    <div className="h-screen overflow-hidden flex bg-background">
      <aside
        className={cn(
          'no-print shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col sticky top-0 h-screen transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-[70px]' : 'w-64',
        )}
      >
        <div
          className={cn(
            'py-6 border-b border-sidebar-border flex items-center gap-3 transition-all duration-300',
            isCollapsed ? 'px-4 justify-center' : 'px-6',
          )}
        >
          <div className="h-10 w-10 shrink-0 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center overflow-hidden">
            {getLogoUrl() ? (
              <img src={getLogoUrl()!} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="font-semibold tracking-tight">{store?.name || 'OptiShop'}</div>
              <div className="text-xs text-sidebar-foreground/60">
                Gestion opticien
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {visibleNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={isCollapsed ? n.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                  isCollapsed ? 'justify-center px-0' : '',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )
              }
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <span className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  {n.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-sidebar-border space-y-2">
          {user && !isCollapsed && (
            <div className="px-3 py-1 space-y-1 animate-in fade-in duration-300">
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
            className={cn(
              'w-full text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all duration-200',
              isCollapsed ? 'justify-center px-0' : 'justify-start',
            )}
            onClick={handleLogout}
            title={isCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="ml-3">Déconnexion</span>}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Agrandir' : 'Réduire'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider">
                <PanelLeftClose className="h-4 w-4" />
                <span>Réduire</span>
              </div>
            )}
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
