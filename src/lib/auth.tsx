import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { apiClient } from '../api/apiClient';

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';

interface User {
  id: string;
  email: string;
  storeId: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  role: AppRole;
  displayName?: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  hasRole: (r: AppRole) => boolean;
  signOut: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
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

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || user?.role === 'ADMIN';

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        isSuperAdmin,
        isAdmin,
        hasRole: (r) => user?.role === r,
        signOut,
        signIn,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
