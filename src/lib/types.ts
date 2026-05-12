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
