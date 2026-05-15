import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import type {
  Client,
  Commande,
  CommandeStatut,
  DashboardStatistics,
  LigneCommande,
  Ordonnance,
  Produit,
  PaginatedResponse,
  Store,
} from './types';

const fetchPaginated = async <T>(
  url: string,
  params: Record<string, unknown>,
) => {
  const { data } = await apiClient.get<PaginatedResponse<T>>(url, { params });
  return data;
};

export const DEFAULT_PAGE_SIZE = 10;

// ==================== CLIENTS ====================

const CLIENTS_KEY = ['clients'] as const;

export const useClients = () =>
  useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Client>>(
        '/clients',
      );
      return data.content;
    },
  });

export const usePaginatedClients = (params: {
  page: number;
  size: number;
  q?: string;
  sort?: string;
}) =>
  useQuery({
    queryKey: ['clients', params],
    queryFn: async () => fetchPaginated<Client>('/clients', params),
  });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<Client, 'id' | 'createdAt'>) => {
      const { data } = await apiClient.post<Client>('/clients', c);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Client>;
    }) => {
      const { data } = await apiClient.patch<Client>(`/clients/${id}`, patch);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLIENTS_KEY });
      qc.invalidateQueries({ queryKey: ORDONNANCES_KEY });
      qc.invalidateQueries({ queryKey: COMMANDES_KEY });
    },
  });
};

// ==================== PRODUITS ====================

const PRODUITS_KEY = ['produits'] as const;

export const useProduits = () =>
  useQuery({
    queryKey: PRODUITS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Produit>>(
        '/products',
      );
      return data.content;
    },
  });

export const usePaginatedProduits = (params: {
  page: number;
  size: number;
  q?: string;
  sort?: string;
}) =>
  useQuery({
    queryKey: ['produits', params],
    queryFn: async () => fetchPaginated<Produit>('/products', params),
  });

export const useCreateProduit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<Produit, 'id' | 'createdAt'>) => {
      const { data } = await apiClient.post<Produit>('/products', p);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUITS_KEY }),
  });
};

export const useUpdateProduit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Produit>;
    }) => {
      const { data } = await apiClient.patch<Produit>(`/products/${id}`, patch);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUITS_KEY }),
  });
};

export const useDeleteProduit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUITS_KEY }),
  });
};

// ==================== ORDONNANCES ====================

const ORDONNANCES_KEY = ['ordonnances'] as const;

export const useOrdonnances = (params?: {
  clientId?: string;
  size?: number;
  q?: string;
}) =>
  useQuery({
    queryKey: [...ORDONNANCES_KEY, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Ordonnance>>(
        '/prescriptions',
        {
          params,
        },
      );
      return data.content;
    },
  });

export const useOrdonnance = (id: string | undefined) =>
  useQuery({
    queryKey: ['ordonnance', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<Ordonnance>(`/prescriptions/${id}`);
      return data;
    },
  });

export const usePaginatedOrdonnances = (params: {
  page: number;
  size: number;
  q?: string;
  sort?: string;
}) =>
  useQuery({
    queryKey: ['ordonnances', params],
    queryFn: async () => fetchPaginated<Ordonnance>('/prescriptions', params),
  });

export const useCreateOrdonnance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (o: Omit<Ordonnance, 'id' | 'createdAt'>) => {
      const { data } = await apiClient.post<Ordonnance>('/prescriptions', o);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDONNANCES_KEY }),
  });
};

export const useUpdateOrdonnance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Ordonnance>;
    }) => {
      const { data } = await apiClient.patch<Ordonnance>(
        `/prescriptions/${id}`,
        patch,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDONNANCES_KEY }),
  });
};

export const useDeleteOrdonnance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/prescriptions/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDONNANCES_KEY });
      qc.invalidateQueries({ queryKey: COMMANDES_KEY });
    },
  });
};

// ==================== COMMANDES ====================

const COMMANDES_KEY = ['commandes'] as const;

export const useCommandes = () =>
  useQuery({
    queryKey: COMMANDES_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Commande>>(
        '/orders',
      );
      return data.content;
    },
  });

export const usePaginatedCommandes = (params: {
  page: number;
  size: number;
  q?: string;
  statut?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}) =>
  useQuery({
    queryKey: ['commandes', params],
    queryFn: async () => fetchPaginated<Commande>('/orders', params),
  });

export const usePaginatedAdminUsers = (params: {
  page: number;
  size: number;
  q?: string;
  role?: string;
  status?: string;
  sort?: string;
}) =>
  useQuery<PaginatedResponse<unknown>>({
    queryKey: ['adminUsers', params],
    queryFn: async () => fetchPaginated<unknown>('/admin/users', params),
  });

export const usePaginatedPendingAdminUsers = (params: {
  page: number;
  size: number;
  q?: string;
  sort?: string;
}) =>
  useQuery<PaginatedResponse<unknown>>({
    queryKey: ['adminPendingUsers', params],
    queryFn: async () =>
      fetchPaginated<unknown>('/admin/pending-users', params),
  });

export const useCommande = (id: string | undefined) =>
  useQuery({
    queryKey: ['commande', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<Commande>(`/orders/${id}`);
      return data;
    },
  });

export interface CreateCommandeInput {
  clientId: string;
  ordonnanceId?: string;
  lignes: Omit<LigneCommande, 'id'>[];
  inclutPersonnalisation: boolean;
  detailsPersonnalisation: string;
  prixPersonnalisation?: number;
  montantTotal: number;
  statut: CommandeStatut;
  notes: string;
  dateLivraisonPrevue?: string;
}

export const useCreateCommande = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: CreateCommandeInput) => {
      const { data } = await apiClient.post<Commande>('/orders', c);
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMANDES_KEY }),
  });
};

export interface UpdateCommandeInput {
  id: string;
  clientId: string;
  ordonnanceId?: string;
  lignes: Omit<LigneCommande, 'id'>[];
  montantTotal: number;
  notes: string;
  dateLivraisonPrevue?: string;
}

export const useUpdateCommande = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: UpdateCommandeInput) => {
      await apiClient.patch(`/orders/${c.id}`, {
        clientId: c.clientId,
        ordonnanceId: c.ordonnanceId,
        lignes: c.lignes,
        montantTotal: c.montantTotal,
        notes: c.notes,
        dateLivraisonPrevue: c.dateLivraisonPrevue,
      });
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: COMMANDES_KEY });
      qc.invalidateQueries({ queryKey: ['commande', v.id] });
      qc.invalidateQueries({ queryKey: PRODUITS_KEY });
    },
  });
};

export const useUpdateCommandeStatut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      statut,
    }: {
      id: string;
      statut: CommandeStatut;
    }) => {
      await apiClient.patch(`/orders/${id}/statut`, { statut });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COMMANDES_KEY });
      qc.invalidateQueries({ queryKey: PRODUITS_KEY });
    },
  });
};

export const useDeleteCommande = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/orders/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COMMANDES_KEY });
      qc.invalidateQueries({ queryKey: PRODUITS_KEY });
    },
  });
};

// ==================== DASHBOARD STATISTICS ====================

export const useDashboard = (period: string = '30d') =>
  useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const { data } =
        await apiClient.get<DashboardStatistics>('/statistics/dashboard', {
          params: { period },
        });
      return data;
    },
  });

// ==================== STORE ====================

const STORE_KEY = ['store'] as const;

export const useStore = () =>
  useQuery({
    queryKey: STORE_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<Store>('/store');
      return data;
    },
  });

export const useUpdateStore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Store>) => {
      const { data } = await apiClient.patch<Store>('/store', patch);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: STORE_KEY }),
  });
};

export const useUpdateStoreLogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await apiClient.post<Store>('/store/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: STORE_KEY }),
  });
};

