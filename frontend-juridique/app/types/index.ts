// app/types/index.ts

export type Langue = "fr" | "ar";

export type VueActive =
  | "dashboard"
  | "mes-entites"
  | "transactions"
  | "archives"
  | "admin-listes"
  | "recherche-dossiers"
  | "entrant-admin"
  | "entrant-juridique"
  | "sortant-normal"
  | "sortant-demande"
  | "admin-utilisateurs"
  | "admin-services"
  | "admin-equipements"
  | "notifications"
  | "profil";

export interface CourrierSimule {
  id: number;
  reference: string;
  objet: string;
  type: VueActive;
  date: string;
  dateRaw?: string;
  source: string;
  serviceActuel: string;
  serviceActuelKey?: string;
  statut: string;
  filePath?: string;
  description?: string;
  destinataireExterne?: string;
  dateEnvoi?: string;
  typeSortant?: string;
  tribunalOrigine?: string;
  tribunalDestination?: string;
}

export interface LocalTransaction {
  id: number;
  document: string;
  reference: string;
  source: string;
  destination: string;
  statut: string;
  message?: string;
  doitRevenir?: boolean;
}

export interface LocalRetrait {
  id: number;
  reference: string;
  objet: string;
  date: string;
  responsable: string;
  statut: string;
}

export interface ListPreviewRow {
  code: string;
  fr: string;
  ar: string;
  ordre: number;
  actif: boolean;
}

export interface ServiceItem {
  id: number;
  nom: string;
  description: string;
  etage: string;
}

export interface EquipmentItem {
  id: number;
  serial: string;
  code: string;
  type: string;
  etat: string;
  service: string;
  estCharge: boolean;
  dateDechargement?: string;
}

export interface UserItem {
  id: number;
  login: string;
  nom: string;
  password?: string;
  role: string;
  service: string;
  substituteUserId?: number;
}

export interface NotificationItem {
  id: number;
  documentId: number;
  documentType: string;
  documentSujet: string;
  sourceServiceId: string;
  destinationServiceId: string;
  message: string;
  statut: string;
  dateEnvoi: string;
  doitRevenir: boolean;
  sourceUserName?: string;
}