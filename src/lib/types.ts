export type ProduitCategorie = 'MONTURE' | 'VERRE' | 'ACCESSOIRE';
export type CommandeStatut =
  | 'EN_ATTENTE'
  | 'EN_TRAITEMENT'
  | 'TERMINEE'
  | 'ANNULEE';
export type FactureStatut =
  | 'EN_ATTENTE'
  | 'PARTIELLEMENT_PAYEE'
  | 'PAYEE'
  | 'EN_RETARD';
export type PaiementMethode = 'ESPECES' | 'CARTE' | 'VIREMENT' | 'AUTRE';

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  telephone: string;
  email: string;
  adresse: string;
  notes: string;
  createdAt: string;
}

export interface Produit {
  id: string;
  nom: string;
  marque: string;
  modele: string;
  categorie: ProduitCategorie;
  description: string;
  prix: number;
  stock: number;
  sku?: string;
  barcode?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  profitAmount?: number;
  profitMargin?: number;
  createdAt: string;
}

export interface Ordonnance {
  id: string;
  clientId: string;
  datePrescription?: string;
  dateExpiration?: string;
  nomMedecin: string;
  odSphere?: number;
  odCylindre?: number;
  odAxe?: number;
  odAddition?: number;
  odPrisme?: number;
  odBase?: string;
  ogSphere?: number;
  ogCylindre?: number;
  ogAxe?: number;
  ogAddition?: number;
  ogPrisme?: number;
  ogBase?: string;
  ecartOd?: number;
  ecartOg?: number;
  hauteurOd?: number;
  hauteurOg?: number;
  distancePupillaire?: number;
  notes: string;
  createdAt: string;
  client?: Partial<Client>;
}

export interface LigneCommande {
  id: string;
  produitId?: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  prixAchatUnitaire?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface Commande {
  id: string;
  numero: number;
  clientId: string;
  ordonnanceId?: string;
  lignes: LigneCommande[];
  inclutPersonnalisation: boolean;
  detailsPersonnalisation: string;
  prixPersonnalisation?: number;
  montantTotal: number;
  statut: CommandeStatut;
  notes: string;
  createdAt: string;
  dateLivraisonPrevue?: string;
  client?: Partial<Client>;
}

export interface Store {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  telephone?: string;
  address?: string;
}

// ── Dashboard Statistics ──────────────────────────────────────────────────────

export interface KpiValue {
  value: number;
  previousValue: number;
  variationPercent: number | null;
}

export interface MonthlyCaItem {
  mois: string;
  ca: number;
}

export interface StatusCountItem {
  name: string;
  value: number;
}

export interface TopProductItem {
  id: string;
  nom: string;
  qte: number;
  ca: number;
}

export interface RecentOrderItem {
  id: string;
  numero: number;
  clientNom: string;
  clientPrenom: string;
  montantTotal: number;
  statut: string;
  createdAt: string;
}

export interface DashboardStatistics {
  period: string;
  commandes: KpiValue;
  clients: KpiValue;
  produits: KpiValue;
  ordonnances: KpiValue;
  totalCA: KpiValue;
  commandesEnCours: KpiValue;
  statusBreakdown: StatusCountItem[];
  top5Produits: TopProductItem[];
  caMensuel: MonthlyCaItem[];
  dernieresCommandes: RecentOrderItem[];
}

// ── Financial Statistics ──────────────────────────────────────────────────────

export interface FinancialKpis {
  period: string;
  grossProfit: number;
  grossMarginPercent: number;
  totalRevenue: number;
  totalCost: number;
  avgMarginPercent: number;
  inventoryValue: number;
  inventoryRetailValue: number;
  potentialProfit: number;
}

export interface ProductProfitabilityItem {
  id: string;
  nom: string;
  sku?: string;
  categorie: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
  unitsSold: number;
}

export interface InventoryValueResult {
  totalCostValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  potentialMarginPercent: number;
  itemCount: number;
}

export interface ProfitChartItem {
  mois: string;
  ca: number;
  profit: number;
}

