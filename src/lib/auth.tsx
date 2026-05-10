import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { apiClient } from '../api/apiClient';

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

interface User {
  id: string;
  email: string;
  storeId: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  profile: {
    role: AppRole;
    prenom: string;
    nom: string;
    displayName: string | null;
  };
  roles: AppRole[];
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  roles: AppRole[];
  rolesLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  hasRole: (r: AppRole) => boolean;
  signOut: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  roles: [],
  rolesLoading: true,
  isSuperAdmin: false,
  isAdmin: false,
  isManager: false,
  hasRole: () => false,
  signOut: async () => {},
  signIn: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await apiClient.get('/auth/profile');
      setUser(data);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (token: string) => {
    localStorage.setItem('access_token', token);
    await fetchProfile();
  };

  const signOut = async () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const roles = user?.roles ?? (user?.profile?.role ? [user.profile.role] : []);
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isAdmin = isSuperAdmin || roles.includes('ADMIN');
  const isManager = isSuperAdmin || isAdmin || roles.includes('MANAGER');

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        roles,
        rolesLoading: loading,
        isSuperAdmin,
        isAdmin,
        isManager,
        hasRole: (r) => isSuperAdmin || roles.includes(r),
        signOut,
        signIn,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
