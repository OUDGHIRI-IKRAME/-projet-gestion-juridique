"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";

import { Sidebar } from "@/app/components/layout/Sidebar";
import { DashboardView } from "@/app/components/dashboard/DashboardView";
import { AdminForm } from "@/app/components/forms/AdminForm";
import { JuridiqueForm } from "@/app/components/forms/JuridiqueForm";
import { SortantForm } from "@/app/components/forms/SortantForm";
import { TransferModal } from "@/app/components/modals/TransferModal";
import { DetailModal } from "@/app/components/modals/DetailModal";
import { GestionUtilisateurs } from "@/app/components/admin/GestionUtilisateurs";
import { GestionServices } from "@/app/components/admin/GestionServices";
import { GestionEquipements } from "@/app/components/admin/GestionEquipements";
import { GestionListes } from "@/app/components/admin/GestionListes";
import { NotificationsPage } from "@/app/components/pages/NotificationsPage";
import { TransactionsPage } from "@/app/components/pages/TransactionsPage";
import { ProfilPage } from "@/app/components/pages/ProfilPage";
import { WorkspaceModal } from "@/app/components/modals/WorkspaceModal";
import { ArchiveRetraitPage } from "@/app/components/pages/ArchiveRetraitPage";

import { translations } from "@/lib/translations";
import { normalizeStatus, getDocKey } from "@/lib/utils";
import { SERVICE_GROUPS, getServiceLabel, getStatusLabel, USER_SERVICE_TO_ENUM, WORKFLOW_STEPS } from "@/lib/constants";
import { useDocuments } from "@/app/hooks/useDocuments";
import { exportRows, importFromFile, ExportFormat, ExportRow } from "@/lib/exportImport";
import { useListItems } from "@/app/hooks/useListItems";
import { Langue, VueActive, CourrierSimule, LocalTransaction, LocalRetrait } from "@/app/types";

export default function Home() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const [langue, setLangue] = useState<Langue>("ar");
  const [vueActive, setVueActive] = useState<VueActive>("dashboard");
  const cur = translations[langue];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reference, setReference] = useState("");
  const [tiers, setTiers] = useState("");
  const [objet, setObjet] = useState("");
  const [destinataireExterne, setDestinataireExterne] = useState("");
  const [dateEnvoi, setDateEnvoi] = useState("");

  const [source, setSource] = useState("");
  const [dateArrivee, setDateArrivee] = useState("");
  const [dateMessage, setDateMessage] = useState("");
  const [numeroInterne, setNumeroInterne] = useState("");
  const [anneeNumerotation, setAnneeNumerotation] = useState("");
  const [transmissible, setTransmissible] = useState("Non");
  const [etat, setEtat] = useState("");
  const [notes, setNotes] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [modeTraitement, setModeTraitement] = useState("");
  const [serviceDestinataire, setServiceDestinataire] = useState("");
  const [servicesDiffusion, setServicesDiffusion] = useState<string[]>([]);

  const [circuitJuridique, setCircuitJuridique] = useState("");
  const [etapeService, setEtapeService] = useState<number>(1);
  const [etapeJalsat, setEtapeJalsat] = useState("");
  const [etapeTaslim, setEtapeTaslim] = useState("");
  const [autoriteRetrait, setAutoriteRetrait] = useState("");
  const [typeException, setTypeException] = useState("");
  const [numeroDossierAppel, setNumeroDossierAppel] = useState("");
  const [typeProcedure, setTypeProcedure] = useState("ordinaire");
  const [numCourAppel, setNumCourAppel] = useState("");
  const [conseillerRapporteur, setConseillerRapporteur] = useState("");
  const [dateAudience, setDateAudience] = useState("");
  const [statutSousService, setStatutSousService] = useState("");
  const [commentaireSousService, setCommentaireSousService] = useState("");

  const [docLie, setDocLie] = useState("");
  const [dossierPrincipal, setDossierPrincipal] = useState("");
  const [sourceDocLie, setSourceDocLie] = useState("");
  const [parentDossier, setParentDossier] = useState("");
  const [juridiqueDate, setJuridiqueDate] = useState("");
  const [numeroBureauOrdre, setNumeroBureauOrdre] = useState("");
  const [autoYearSuffix, setAutoYearSuffix] = useState("");
  const [juridiqueEtat, setJuridiqueEtat] = useState("");
  const [juridiqueService, setJuridiqueService] = useState("");
  const [typeDossier, setTypeDossier] = useState("");
  const [numeroPremiereInstance, setNumeroPremiereInstance] = useState("");
  const [juridiqueNotes, setJuridiqueNotes] = useState("");
  const [juridiqueFichier, setJuridiqueFichier] = useState<File | null>(null);

  const [serviceSortant, setServiceSortant] = useState("");
  const [numeroBureauOrdreSortant, setNumeroBureauOrdreSortant] = useState("");
  const [notesSortant, setNotesSortant] = useState("");
  const [fichierSortant, setFichierSortant] = useState<File | null>(null);
  const [tribunalOrigineSortant, setTribunalOrigineSortant] = useState("");
  const [tribunalDestinationSortant, setTribunalDestinationSortant] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilterService, setSearchFilterService] = useState("");
  const [searchFilterType, setSearchFilterType] = useState("");
  const [searchFilterDateDebut, setSearchFilterDateDebut] = useState("");
  const [searchFilterDateFin, setSearchFilterDateFin] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<CourrierSimule | null>(null);
  const [workflowDocId, setWorkflowDocId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [historiqueActions, setHistoriqueActions] = useState<any[]>([]);
  const [hiddenDocKeys, setHiddenDocKeys] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [docOverrides, setDocOverrides] = useState<Record<number, Partial<CourrierSimule>>>({});
  const [transferModalDoc, setTransferModalDoc] = useState<CourrierSimule | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [transferMessage, setTransferMessage] = useState("");
  const [transferMustReturn, setTransferMustReturn] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState(0);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [transactionStats, setTransactionStats] = useState({ total: 0, acceptes: 0, refuses: 0, enAttente: 0, pourcentage: 0 });
  const [localTransactions, setLocalTransactions] = useState<LocalTransaction[]>([]);
  const [localRetraits, setLocalRetraits] = useState<LocalRetrait[]>([]);
  const [showRetournerModal, setShowRetournerModal] = useState(false);
  const [retournerDocs, setRetournerDocs] = useState<any[]>([]);
  const [filtreStatutSortant, setFiltreStatutSortant] = useState("tous");
  const [showCorbeille, setShowCorbeille] = useState(false);
  const [corbeilleDocs, setCorbeilleDocs] = useState<any[]>([]);
  const [localFiles, setLocalFiles] = useState<{ name: string; content: string; path: string }[]>([]);
  const [searchLocalFiles, setSearchLocalFiles] = useState(false);
  const [localSearchResults, setLocalSearchResults] = useState<{ name: string; path: string; snippet: string }[]>([]);
  const [retraitDoc, setRetraitDoc] = useState<{ id: number; reference: string; objet: string } | null>(null);
  const [batchTransferDocs, setBatchTransferDocs] = useState<CourrierSimule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [workspaceDocId, setWorkspaceDocId] = useState<number | null>(null);

  const { listeCourriers, refetch } = useDocuments(token, langue, vueActive);
  const BASE_URL = "http://localhost:5200";

  const fetchPending = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Transactions/count-pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingNotifications(data.count || 0);
      }
      const statsRes = await fetch(`${BASE_URL}/api/Transactions/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTransactionStats(statsData);
      }
    } catch (err) { /* silent */ }
  };

  useEffect(() => {
    if (!token) return;
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Listes dynamiques depuis l'API
  const { items: listItems, getOptions: getListOptions } = useListItems(token);
  const sourceOptions = getListOptions("sources_courrier", langue);
  const etatOptions = getListOptions("etats_document", langue);

  const role = user?.role || "";
  const isAdmin = role === "Admin" || role === "admin";
  const isDirecteur = role === "Directeur" || role === "directeur";
  const isGreffier = role === "Greffier" || role === "greffier";
  const isConsultant = role === "Consultant" || role === "consultant";
  const canManageUsers = isAdmin;
  const canSeeAdminSection = isAdmin || isGreffier;
  const userService = user?.service || "";

  // Permissions par rôle basées sur l'organigramme
  const canCreateEntrantAdmin = isAdmin || isGreffier || role === "BureauOrdre" || role === "Enregistrement";
  const canCreateEntrantJuridique = true; // disponible pour tous les utilisateurs
  const canCreateSortantNormal = isAdmin || isGreffier || role === "Taslim";
  const canCreateSortantDemande = isAdmin || isGreffier || role === "Notification";
  const canOpenDossiers = isAdmin || isGreffier || role === "OuvertureDossier" || role === "BureauOrdre";
  const canTransfer = true; // tous les services peuvent transférer vers n'importe quel service
  const canViewArchives = isAdmin || isGreffier || isDirecteur || role === "Archive" || isConsultant;
  const canViewTransactions = isAdmin || isGreffier || isDirecteur || role === "OuvertureDossier" || role === "BureauOrdre" || isConsultant;
  const canSearchDossiers = true; // tous peuvent chercher

  const isJalsatService = userService === "JalsatWaIjra2at" || isAdmin;
  const isTaslimService = userService === "TaslimNusakh" || isAdmin;
  const canSeeEntrantAdmin = canCreateEntrantAdmin;
  const canSeeEntrantJuridique = canCreateEntrantJuridique;
  const canSeeSortantNormal = true; // tous les services voient les sortants
  const canSeeSortantDemande = true; // tous les services voient les sortants
  const isFormView = ["entrant-admin", "entrant-juridique", "sortant-normal", "sortant-demande"].includes(vueActive);

  const displayedCourriers = listeCourriers.map((doc) => ({ ...doc, ...(docOverrides[doc.id] || {}) }));
  let visibleCourriers = displayedCourriers.filter((doc) => !hiddenDocKeys.includes(getDocKey(doc)) && !hiddenDocKeys.includes(String(doc.id)));

  const generalDocs = visibleCourriers.filter((doc) => doc.type !== "sortant-normal" && doc.type !== "sortant-demande");
  const sortantDocs = visibleCourriers.filter((doc) => doc.type === "sortant-normal" || doc.type === "sortant-demande");

  const filteredGeneral = generalDocs.filter((doc: CourrierSimule) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      doc.objet.toLowerCase().includes(s) ||
      doc.reference.toLowerCase().includes(s) ||
      doc.source.toLowerCase().includes(s) ||
      doc.serviceActuel.toLowerCase().includes(s) ||
      (doc.destinataireExterne && doc.destinataireExterne.toLowerCase().includes(s))
    );
  });

  const filteredSortant = sortantDocs.filter((doc: CourrierSimule) => {
    let matchSearch = true;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      matchSearch = !!(
        doc.objet.toLowerCase().includes(s) ||
        doc.reference.toLowerCase().includes(s) ||
        doc.source.toLowerCase().includes(s) ||
        doc.serviceActuel.toLowerCase().includes(s) ||
        (doc.destinataireExterne && doc.destinataireExterne.toLowerCase().includes(s))
      );
    }
    let matchStatut = true;
    if (filtreStatutSortant !== "tous") {
      const statutBrut = normalizeStatus(doc.statut);
      matchStatut = statutBrut === filtreStatutSortant;
    }
    return matchSearch && matchStatut;
  });

  const totalDocs = visibleCourriers.length || 1;
  const mapToGroup = (s: string): string => {
    if (s === "Nouveau" || s === "EnCours" || s === "EnInstance" || s === "EnAttente" || s === "Brouillon") return "EnAttente";
    if (s === "Cloture" || s === "Envoye" || s === "Archive") return "Traite";
    if (s === "Annule") return "Annule";
    return "EnAttente";
  };
  const countByGroup = (group: string) => visibleCourriers.filter((doc: CourrierSimule) => mapToGroup(normalizeStatus(doc.statut)) === group).length;

  const SERVICE_COLORS: Record<string, string> = {
    "BureauOrdre": "#3b82f6",
    "OuvertureDossier": "#8b5cf6",
    "KitabaKhasa": "#06b6d4",
    "JalsatWaIjra2at": "#f59e0b",
    "TaslimNusakh": "#10b981",
    "Archive": "#6b7280",
    "BureauNotification": "#ec4899",
    "BureauExpertise": "#14b8a6",
    "CelluleInformatique": "#6366f1",
    "GestionFinanciere": "#f97316",
    "CaisseTribunal": "#84cc16",
    "BureauRecouvrement": "#ef4444",
    "ProcduresCommissaireRoyal": "#a855f7",
    "GestionPourvoisCassation": "#0ea5e9",
    "RemiseCopieJugement": "#22c55e",
    "Greffe": "#e11d48",
    "Direction": "#1e293b",
  };
  const SERVICE_LABELS: Record<string, string> = langue === "ar" ? {
    "BureauOrdre": "مكتب الضبط",
    "OuvertureDossier": "فتح الملفات",
    "KitabaKhasa": "الكتابة الخاصة",
    "JalsatWaIjra2at": "الجلسات والإجراءات",
    "Ijra2Baht": "إجراء بحث",
    "MofawidMalaki": "المفوض الملكي",
    "Khibra": "الخبرة",
    "MustacharMoqarir": "المستشار المقرر",
    "TaslimNusakh": "تسليم النسخ",
    "Tabligh": "التبليغ",
    "TasfiyatSawa2ir": "تصفية الصوائر",
    "Archive": "الأرشيف",
    "BureauNotification": "مكتب التبليغ",
    "BureauExpertise": "مكتب الخبرة",
    "CelluleInformatique": "الوحدة المعلوماتية",
    "EfficaciteJudiciaire": "الكفاءة القضائية",
    "GestionFinanciere": "التسيير المالي",
    "CaisseTribunal": "صندوق المحكمة",
    "BureauRecouvrement": "التحصيل",
    "ProcduresCommissaireRoyal": "إجراءات المفوض الملكي",
    "GestionPourvoisCassation": "الطعن بالنقص",
    "RemiseCopieJugement": "تسليم نسخ الأحكام",
    "Greffe": "القلم",
    "Direction": "المديرية",
    "Enregistrement": "التسجيل",
    "Consultant": "مستشار",
    "Directeur": "المدير العام",
  } : {
    "BureauOrdre": "Bureau d'Ordre",
    "OuvertureDossier": "Ouverture Dossiers",
    "KitabaKhasa": "Secrétariat Particulier",
    "JalsatWaIjra2at": "Audiences & Procédures",
    "Ijra2Baht": "Recherche",
    "MofawidMalaki": "Commissaire du Roi",
    "Khibra": "Expertise",
    "MustacharMoqarir": "Conseiller Rapporteur",
    "TaslimNusakh": "Remise de Copies",
    "Tabligh": "Notification",
    "TasfiyatSawa2ir": "Règlement des Dépens",
    "Archive": "Archives",
    "BureauNotification": "Bureau de Notification",
    "BureauExpertise": "Bureau d'Expertise",
    "CelluleInformatique": "Cellule Informatique",
    "EfficaciteJudiciaire": "Efficacité Judiciaire",
    "GestionFinanciere": "Gestion Financière",
    "CaisseTribunal": "Caisse du Tribunal",
    "BureauRecouvrement": "Recouvrement",
    "ProcduresCommissaireRoyal": "Procédures Commissaire Royal",
    "GestionPourvoisCassation": "Pourvois en Cassation",
    "RemiseCopieJugement": "Remise Copie Jugement",
    "Greffe": "Greffe",
    "Direction": "Direction",
    "Enregistrement": "Enregistrement",
    "Consultant": "Consultant",
    "Directeur": "Directeur",
  };

  const statusStats = (() => {
    const statuses = [
      { key: "EnAttente", label: cur.statEnAttente, count: countByGroup("EnAttente"), color: "#f59e0b" },
      { key: "Traite", label: cur.statAcceptees, count: countByGroup("Traite"), color: "#10b981" },
      { key: "Refuse", label: cur.statRefusees, count: 0, color: "#ef4444" },
      { key: "Annule", label: cur.statAnnulees, count: countByGroup("Annule"), color: "#6b7280" },
    ];

    if (isAdmin || isGreffier) {
      const serviceBreakdown: Record<string, Record<string, number>> = {};
      statuses.forEach((s) => { serviceBreakdown[s.key] = {}; });
      visibleCourriers.forEach((doc) => {
        const group = mapToGroup(normalizeStatus(doc.statut));
        const svc = doc.serviceActuelKey || "Autres";
        if (!serviceBreakdown[group]) serviceBreakdown[group] = {};
        serviceBreakdown[group][svc] = (serviceBreakdown[group][svc] || 0) + 1;
      });
      return { statuses, serviceBreakdown, SERVICE_COLORS, SERVICE_LABELS };
    }

    return { statuses, serviceBreakdown: null, SERVICE_COLORS: null, SERVICE_LABELS: null };
  })();

  const docsEnAttente = countByGroup("EnAttente");
  const docsAnnules = countByGroup("Annule");
  const docsArchives = visibleCourriers.filter((doc: CourrierSimule) => normalizeStatus(doc.statut) === "Archive").length + localRetraits.length;
  const docsTraites = visibleCourriers.length - docsEnAttente - docsAnnules;

  const activityCards = [
    { title: cur.notifications, value: transactionStats.enAttente, view: "transactions" as VueActive, accent: "bg-amber-500" },
    { title: cur.demandesAttente, value: sortantDocs.length, view: "transactions" as VueActive, accent: "bg-sky-500" },
    { title: cur.transactionsTraitees, value: transactionStats.acceptes, view: "transactions" as VueActive, accent: "bg-emerald-500" },
    { title: cur.docsRetourner, value: transactionStats.refuses, view: "transactions" as VueActive, accent: "bg-indigo-500" }
  ];

  const workflowSteps = [
    { label: cur.maktabDabt, service: "BureauOrdre" },
    { label: cur.ouvertureDossier, service: "OuvertureDossier" },
    { label: cur.kitabaKhasa, service: "KitabaKhasa" },
    { label: cur.jalsatSection, service: "JalsatWaIjra2at" },
    { label: cur.taslimSection, service: "TaslimNusakh" },
    { label: cur.archiveDef, service: "Archive" }
  ];

  const selectedWorkflowDoc = visibleCourriers.find((doc: CourrierSimule) => doc.id === workflowDocId) ||
    (searchTerm ? visibleCourriers.find((doc: CourrierSimule) =>
      doc.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.objet.toLowerCase().includes(searchTerm.toLowerCase())
    ) : null) ||
    filteredGeneral.find((doc: CourrierSimule) => doc.serviceActuelKey === USER_SERVICE_TO_ENUM[userService]) ||
    filteredGeneral.find((doc: CourrierSimule) => doc.type === "entrant-juridique") ||
    filteredGeneral[0] || visibleCourriers[0] || null;

  const WORKFLOW_SERVICE_MAP: Record<string, number> = {
    "BureauOrdre": 0,
    "OuvertureDossier": 1,
    "KitabaKhasa": 2,
    "JalsatWaIjra2at": 3,
    "Ijra2Baht": 3,
    "MofawidMalaki": 3,
    "Khibra": 3,
    "MustacharMoqarir": 3,
    "TaslimNusakh": 4,
    "Tabligh": 4,
    "TasfiyatSawa2ir": 4,
    "Archive": 5,
    "BureauNotification": 3,
    "BureauExpertise": 3,
    "CelluleInformatique": 3,
    "GestionFinanciere": 3,
    "CaisseTribunal": 3,
    "BureauRecouvrement": 3,
    "ProcduresCommissaireRoyal": 3,
    "GestionPourvoisCassation": 3,
    "RemiseCopieJugement": 4,
    "Greffe": 2,
    "Direction": 0,
  };

  const getWorkflowIndex = (doc: CourrierSimule | null) => {
    if (!doc) return 0;
    const key = doc.serviceActuelKey || "";
    if (WORKFLOW_SERVICE_MAP[key] !== undefined) return WORKFLOW_SERVICE_MAP[key];
    const service = doc.serviceActuel.toLowerCase();
    if (service.includes("archive") || service.includes("الأرشيف") || service.includes("مؤرشف")) return 5;
    if (service.includes("taslim") || service.includes("tabligh") || service.includes("tasfiya") || service.includes("نسخ") || service.includes("التبليغ") || service.includes("الصوائر")) return 4;
    if (service.includes("jalsat") || service.includes("audience") || service.includes("recherche") || service.includes("expertise") || service.includes("rapporteur") || service.includes("الجلسات") || service.includes("الخبرة") || service.includes("المقرر")) return 3;
    if (service.includes("kitaba") || service.includes("secrétariat") || service.includes("الكتابة")) return 2;
    if (service.includes("ouverture") || service.includes("فتح")) return 1;
    return 0;
  };
  const workflowCurrentIndex = getWorkflowIndex(selectedWorkflowDoc);

  const docsPerStep = WORKFLOW_STEPS.map((ws) => {
    return visibleCourriers.filter((doc) => {
      const key = doc.serviceActuelKey || "";
      if (WORKFLOW_SERVICE_MAP[key] !== undefined) {
        const stepIndex = WORKFLOW_SERVICE_MAP[key];
        if (ws.service === "BureauOrdre") return stepIndex === 0;
        if (ws.service === "OuvertureDossier") return stepIndex === 1;
        if (ws.service === "KitabaKhasa") return stepIndex === 2;
        if (ws.service === "JalsatWaIjra2at") return stepIndex === 3;
        if (ws.service === "TaslimNusakh") return stepIndex === 4;
        if (ws.service === "Archive") return stepIndex === 5;
      }
      return false;
    }).length;
  });

  const recentActivity = visibleCourriers.slice(0, 6).map((d) => ({
    type: d.type,
    label: getServiceLabel(d.serviceActuel, langue),
    reference: d.reference,
    time: d.date,
    doc: d,
  }));

  const serviceLoadMap: Record<string, number> = {};
  visibleCourriers.forEach((d) => {
    const key = d.serviceActuelKey || d.serviceActuel;
    serviceLoadMap[key] = (serviceLoadMap[key] || 0) + 1;
  });
  const serviceLoad = Object.entries(serviceLoadMap)
    .map(([service, count]) => ({ service, count, label: getServiceLabel(service, langue) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const fetchCorbeille = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Documents/corbeille`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCorbeilleDocs(data);
      }
    } catch {}
  };

  const restoreDocument = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Documents/${id}/restaurer`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.text();
        alert(langue === "fr" ? `Erreur restauration: ${err}` : `خطأ في الاستعادة: ${err}`);
        return;
      }
      await fetchCorbeille();
      await refetch();
      alert(langue === "fr" ? "Document restauré." : "تمت استعادة الوثيقة.");
    } catch (e: any) {
      alert(langue === "fr" ? `Erreur de restauration: ${e.message}` : `خطأ في الاستعادة: ${e.message}`);
    }
  };

  const searchLocalDirectory = async () => {
    try {
      if (typeof (window as any).showDirectoryPicker !== "function") {
        alert(langue === "fr" ? "Votre navigateur ne supporte pas la recherche de fichiers locaux. Utilisez Chrome/Edge." : "متصفحك لا يدعم البحث في الملفات المحلية. استخدم Chrome/Edge.");
        return;
      }
      const dirHandle = await (window as any).showDirectoryPicker({ mode: "read" });
      const files: { name: string; content: string; path: string }[] = [];

      const readDir = async (dir: any, path: string) => {
        for await (const entry of dir.values()) {
          const entryPath = path ? `${path}/${entry.name}` : entry.name;
          if (entry.kind === "file" && (entry.name.endsWith(".pdf") || entry.name.endsWith(".doc") || entry.name.endsWith(".docx") || entry.name.endsWith(".txt") || entry.name.endsWith(".csv") || entry.name.endsWith(".xlsx") || entry.name.endsWith(".xls"))) {
            try {
              const file = await entry.getFile();
              if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
                const arrayBuffer = await file.arrayBuffer();
                const XLSX = await import("xlsx");
                const wb = XLSX.read(arrayBuffer, { type: "array" });
                let allText = "";
                for (const sheetName of wb.SheetNames) {
                  const ws = wb.Sheets[sheetName];
                  const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
                  allText += jsonData.map((row) => row.join(" ")).join("\n") + "\n";
                }
                files.push({ name: file.name, content: allText, path: entryPath });
              } else if (file.name.endsWith(".doc") || file.name.endsWith(".docx")) {
                const arrayBuffer = await file.arrayBuffer();
                const mammoth = await import("mammoth");
                const result = await mammoth.extractRawText({ arrayBuffer });
                files.push({ name: file.name, content: result.value, path: entryPath });
              } else if (file.name.endsWith(".pdf")) {
                const arrayBuffer = await file.arrayBuffer();
                const pdfjsLib = await import("pdfjs-dist");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                  const page = await pdf.getPage(i);
                  const content = await page.getTextContent();
                  fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
                }
                files.push({ name: file.name, content: fullText, path: entryPath });
              } else {
                const text = await file.text();
                files.push({ name: file.name, content: text, path: entryPath });
              }
            } catch {}
          } else if (entry.kind === "directory") {
            await readDir(entry, entryPath);
          }
        }
      };

      await readDir(dirHandle, "");
      setLocalFiles(files);
      setSearchLocalFiles(true);
      alert(langue === "fr"
        ? `${files.length} fichier(s) trouvé(s). Recherchez maintenant.`
        : `${files.length} ملف(ات). يمكنك البحث الآن.`);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        alert(langue === "fr" ? "Erreur d'accès aux fichiers" : "خطأ في الوصول للملفات");
      }
    }
  };

  const getLocalSearchResults = (term: string) => {
    if (!term || localFiles.length === 0) return [];
    const lower = term.toLowerCase();
    return localFiles
      .filter(f => f.name.toLowerCase().includes(lower) || f.content.toLowerCase().includes(lower))
      .map(f => ({
        name: f.name,
        path: f.path,
        snippet: f.content
          ? f.content.substring(Math.max(0, f.content.toLowerCase().indexOf(lower) - 40), f.content.toLowerCase().indexOf(lower) + 60) + "..."
          : ""
      }));
  };

  const exportGeneralDocs = (format: ExportFormat) => {
    const rows = filteredGeneral.map((doc) => ({
      [cur.exporterTitre]: doc.objet,
      [cur.exporterReference]: doc.reference,
      [cur.exporterType]: doc.type,
      [cur.exporterDate]: doc.date,
      [cur.exporterSource]: doc.source,
      [cur.exporterService]: getServiceLabel(doc.serviceActuel, langue),
      [cur.exporterStatut]: doc.statut
    }));
    exportRows(rows, "courriers_entrants", format, cur.entrants);
  };

  const toggleDocSelect = (id: number) => {
    setSelectedDocIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const selectAllDocs = () => {
    if (selectedDocIds.length === filteredGeneral.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredGeneral.map((d) => d.id));
    }
  };

  const exportSelectedDocs = (format: ExportFormat) => {
    const docs = filteredGeneral.filter((d) => selectedDocIds.includes(d.id));
    const rows = docs.map((doc) => ({
      [cur.exporterTitre]: doc.objet,
      [cur.exporterReference]: doc.reference,
      [cur.exporterType]: doc.type,
      [cur.exporterDate]: doc.date,
      [cur.exporterSource]: doc.source,
      [cur.exporterService]: getServiceLabel(doc.serviceActuel, langue),
      [cur.exporterStatut]: doc.statut
    }));
    exportRows(rows, "selection_export", format, `${cur.entrants} (${docs.length})`);
  };

  const exportSortantDocs = (format: ExportFormat) => {
    const rows = filteredSortant.map((doc) => ({
      [cur.exporterTitre]: doc.objet,
      [cur.exporterReference]: doc.reference,
      [cur.exporterType]: doc.typeSortant || doc.type,
      [cur.exporterDate]: doc.date,
      [cur.exporterSource]: doc.source,
      [cur.tribunalOrigine || "Tribunal origine"]: doc.tribunalOrigine || "",
      [cur.tribunalDestination || "Tribunal destination"]: doc.tribunalDestination || "",
      [cur.exporterDestinataire]: doc.destinataireExterne || "",
      [cur.exporterStatut]: doc.statut
    }));
    exportRows(rows, "courriers_sortants", format, cur.sortants);
  };

  const exportAdminData = async (format: ExportFormat, type: string) => {
    if (!token) return;
    try {
      let url = "";
      if (type === "utilisateurs") url = `${BASE_URL}/api/Auth/users`;
      else if (type === "services") url = `${BASE_URL}/api/Services`;
      else if (type === "equipements") url = `${BASE_URL}/api/Equipment`;
      else if (type === "listes") url = `${BASE_URL}/api/ListItem`;
      else if (type === "notifications") url = `${BASE_URL}/api/Transactions`;
      if (!url) return;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        alert(langue === "fr" ? "Aucune donnée à exporter" : "لا توجد بيانات للتصدير");
        return;
      }
      const rows = data.map((item: any) => {
        const row: Record<string, string> = {};
        Object.keys(item).forEach((key) => {
          if (key !== "id" && key !== "password" && key !== "token") {
            row[key] = String(item[key] ?? "");
          }
        });
        return row;
      });
      exportRows(rows, type, format, (cur as any)[type] || type);
    } catch {
      alert(langue === "fr" ? "Erreur lors de l'export" : "خطأ في التصدير");
    }
  };

  const exportNotifications = async (format: ExportFormat) => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        alert(langue === "fr" ? "Aucune donnée à exporter" : "لا توجد بيانات للتصدير");
        return;
      }
      const rows = data.map((t: any) => ({
        [langue === "fr" ? "Document" : "الوثيقة"]: t.documentSujet || "",
        [langue === "fr" ? "De" : "من"]: t.sourceServiceName || t.sourceServiceId || "",
        [langue === "fr" ? "Vers" : "إلى"]: t.destinationServiceName || t.destinationServiceId || "",
        [langue === "fr" ? "Statut" : "الحالة"]: t.statut || "",
        [langue === "fr" ? "Message" : "الرسالة"]: t.message || "",
        [langue === "fr" ? "Date" : "التاريخ"]: t.dateTransaction || "",
      }));
      exportRows(rows, "notifications", format, cur.notifications);
    } catch {}
  };

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<ExportRow[]>([]);
  const [importFileName, setImportFileName] = useState("");

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromFile(file);
      setImportData(data);
      setImportFileName(file.name);
      setImportModalOpen(true);
    } catch (err: any) {
      alert(err.message || "Erreur d'importation");
    }
    e.target.value = "";
  };

  const confirmImport = async () => {
    if (importData.length === 0) return;
    const token = localStorage.getItem("token");
    let success = 0;
    let errors = 0;
    for (const row of importData) {
      try {
        const res = await fetch(`${BASE_URL}/api/CourrierAdmin`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            reference: row["Référence"] || row["Reference"] || row["المرجع"] || row["ref"] || "",
            objet: row["Titre"] || row["Objet"] || row["العنوان"] || row["title"] || "",
            source: row["Source"] || row["المصدر"] || "",
            expediteur: row["Source"] || row["المصدر"] || "",
          })
        });
        if (res.ok) success++;
        else errors++;
      } catch { errors++; }
    }
    alert(langue === "fr"
      ? `Import terminé: ${success} succès, ${errors} erreurs`
      : `تم الاستيراد: ${success} نجاح, ${errors} أخطاء`);
    setImportModalOpen(false);
    setImportData([]);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let endpoint = "";
      let body: any = {};

      const numeroOrdreFinal = reference.trim();

      if (!numeroOrdreFinal) {
        alert(langue === "fr" ? "Veuillez saisir la référence du document" : "يرجى إدخال مرجع الوثيقة");
        setIsSubmitting(false);
        return;
      }

      if (vueActive === "entrant-admin") {
        if (!modeTraitement) {
          alert(langue === "fr" ? "Veuillez sélectionner un mode de traitement" : "يرجى اختيار نمط المعالجة");
          setIsSubmitting(false);
          return;
        }
        endpoint = `${BASE_URL}/api/CourrierAdmin`;
        body = {
          numeroOrdre: numeroOrdreFinal,
          expediteur: tiers,
          objet: objet,
          dateReception: new Date().toISOString(),
          typeCircuit: "standard",
          numeroReference: numeroOrdreFinal,
          modeTraitement: modeTraitement,
          serviceDestinataire: modeTraitement === "unique" ? serviceDestinataire : null,
          servicesDiffusion: modeTraitement === "diffusion" ? servicesDiffusion : null,
          source: source,
          dateArrivee: dateArrivee,
          dateMessage: dateMessage,
          numeroInterne: numeroInterne,
          anneeNumerotation: anneeNumerotation,
          transmissible: transmissible === "Oui",
          etat: etat,
          notes: notes,
          fichier: fichier ? fichier.name : null
        };
      } else if (vueActive === "entrant-juridique") {
        endpoint = `${BASE_URL}/api/CourrierJuridique`;
        body = {
          reference: numeroOrdreFinal,
          objet: objet,
          provenance: tiers,
          circuit: circuitJuridique,
          typeCircuit: circuitJuridique === "kitaba_khasa" ? "exception" : "classique",
          motifException: circuitJuridique === "kitaba_khasa" ? typeException : null,
          jalsatTransaction: circuitJuridique === "maktab_dabt" ? etapeJalsat : null,
          taslimTransaction: circuitJuridique === "maktab_dabt" ? etapeTaslim : null,
          autoriteRetrait: (circuitJuridique === "maktab_dabt" && etapeTaslim === "archive") ? autoriteRetrait : null,
          etapeService: etapeService,
          numeroDossierAppel: numeroDossierAppel,
          numeroBureauOrdre: numeroBureauOrdre || numeroOrdreFinal,
          demandeur: tiers || "",
          etatGlobal: etat || "En cours",
          etapeJalsatActuelle: etapeJalsat || "ijra2_baht",
          typeProcedure: typeProcedure,
          numCourAppel: numCourAppel,
          conseillerRapporteur: conseillerRapporteur,
          dateAudience: dateAudience,
        };
      } else if (vueActive === "sortant-normal" || vueActive === "sortant-demande") {
        endpoint = `${BASE_URL}/api/CourrierSortant`;
        body = {
          destinataire: tiers,
          reference: numeroOrdreFinal,
          objet: objet,
          typeSortant: vueActive === "sortant-normal" ? "normal" : "demande",
          dateEnvoi: dateEnvoi || new Date().toISOString(),
          numeroEnvoi: numeroOrdreFinal,
          statut: "Brouillon",
          service: serviceSortant,
          numeroBureauOrdre: numeroBureauOrdreSortant,
          notes: notesSortant,
          fichier: fichierSortant ? fichierSortant.name : null,
          tribunalOrigine: tribunalOrigineSortant,
          tribunalDestination: tribunalDestinationSortant
        };
      } else {
        alert(langue === "fr" ? "Enregistrement simulé pour cette catégorie" : "تسجيل تجريبي لهذه الفئة");
        await refetch();
        resetForm();
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        let errorMsg = `Erreur ${res.status}`;
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          errorMsg = data.error || data.message || errorMsg;
        } else {
          const text = await res.text();
          console.error("Réponse non-JSON:", text);
          errorMsg = "Erreur serveur (voir console)";
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      alert(data.message || (langue === "fr" ? "Enregistré avec succès !" : "تم التسجيل بنجاح !"));
      await refetch();
      resetForm();
      setVueActive("dashboard");
    } catch (error: any) {
      console.error("Erreur submit:", error);
      let msg = error.message || "Erreur inconnue";
      // Traduire les erreurs backend en FR/AR
      if (msg.includes("numéro d'ordre existe déjà")) {
        msg = cur.errNumExiste;
      } else if (msg.includes("Données invalides")) {
        msg = cur.errDonneesInvalides;
      } else if (msg.includes("Erreur serveur")) {
        msg = cur.errServeur;
      }
      setErrorMessage(msg);
      alert((langue === "fr" ? "Erreur : " : "خطأ : ") + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setReference("");
    setTiers("");
    setObjet("");
    setDestinataireExterne("");
    setDateEnvoi("");
    setSource("");
    setDateArrivee("");
    setDateMessage("");
    setNumeroInterne("");
    setAnneeNumerotation("");
    setTransmissible("Non");
    setEtat("");
    setNotes("");
    setFichier(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCircuitJuridique("");
    setEtapeService(1);
    setEtapeJalsat("");
    setEtapeTaslim("");
    setAutoriteRetrait("");
    setTypeException("");
    setModeTraitement("");
    setServiceDestinataire("");
    setServicesDiffusion([]);
    setNumeroDossierAppel("");
    setTypeProcedure("ordinaire");
    setNumCourAppel("");
    setConseillerRapporteur("");
    setDateAudience("");
    setStatutSousService("");
    setCommentaireSousService("");
    setDocLie("");
    setDossierPrincipal("");
    setSourceDocLie("");
    setParentDossier("");
    setJuridiqueDate("");
    setNumeroBureauOrdre("");
    setAutoYearSuffix("");
    setJuridiqueEtat("");
    setJuridiqueService("");
    setTypeDossier("");
    setNumeroPremiereInstance("");
    setJuridiqueNotes("");
    setJuridiqueFichier(null);
    setServiceSortant("");
    setNumeroBureauOrdreSortant("");
    setNotesSortant("");
    setFichierSortant(null);
    setTribunalOrigineSortant("");
    setTribunalDestinationSortant("");
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const openTransfer = (doc: CourrierSimule) => {
    setTransferModalDoc(doc);
    setSelectedServices([]);
    setTransferMessage("");
    setTransferMustReturn(false);
  };

  const confirmTransfer = async (services?: string[]) => {
    const docsToProcess = batchTransferDocs.length > 0 ? batchTransferDocs : (transferModalDoc ? [transferModalDoc] : []);
    if (docsToProcess.length === 0) return;
    const servicesToTransfer = services || selectedServices;
    if (servicesToTransfer.length === 0) {
      alert(langue === "fr" ? "Veuillez choisir au moins un service destinataire" : "يرجى اختيار مصلحة واحدة على الأقل");
      return;
    }

    if (!token) {
      alert(langue === "fr" ? "Session expirée. Veuillez vous reconnecter." : "انتهت الجلسة. يرجى إعادة تسجيل الدخول.");
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let lastError = "";

    for (const doc of docsToProcess) {
      for (const svc of servicesToTransfer) {
        try {
          const res = await fetch(`${BASE_URL}/api/Transfer`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              documentId: doc.id,
              documentType: doc.type,
              serviceDestination: svc,
              message: transferMessage || null,
              doitRevenir: transferMustReturn,
            }),
          });

          if (res.ok) {
            successCount++;
          } else if (res.status === 401) {
            alert(langue === "fr" ? "Session expirée. Reconnectez-vous." : "انتهت الجلسة. أعد تسجيل الدخول.");
            logout();
            setTransferModalDoc(null);
            setBatchTransferDocs([]);
            setSelectedServices([]);
            setTransferMessage("");
            return;
          } else {
            failCount++;
            const errBody = await res.text();
            console.error(`Transfer ${doc.reference} to ${svc} failed [${res.status}]:`, errBody);
            lastError = `(${svc}: ${res.status})`;
          }
        } catch (err: any) {
          failCount++;
          console.error(`Transfer ${doc.reference} to ${svc} error:`, err);
          lastError = err.message || " réseau";
        }
      }
    }

    if (successCount > 0) {
      alert(langue === "fr"
        ? `${successCount} transfert(s) réussi(s)${failCount > 0 ? ` (${failCount} échec(s) ${lastError})` : ""}`
        : `تم ${successCount} تحويل بنجاح${failCount > 0 ? ` (${failCount} فشل ${lastError})` : ""}`);
      await refetch();
      fetchPending();
    } else {
      const hint = lastError.includes("401")
        ? (langue === "fr" ? "\n\nToken invalide. Reconnectez-vous." : "\n\nرمز غير صالح. أعد تسجيل الدخول.")
        : lastError.includes("fetch")
          ? (langue === "fr" ? "\n\nBackend inaccessible. Vérifiez que le serveur tourne sur port 5200." : "\n\nالخادم غير متاح. تأكد من تشغيل الخادم على البورت 5200.")
          : "";
      alert((langue === "fr" ? "Échec du transfert" : "فشل التحويل") + lastError + hint);
    }

    setTransferModalDoc(null);
    setBatchTransferDocs([]);
    setSelectedIds([]);
    setSelectedServices([]);
    setTransferMessage("");
  };

  const maskDocument = (doc: CourrierSimule) => {
    const key = getDocKey(doc);
    setHiddenDocKeys((current) => current.includes(key) ? current : [...current, key]);
  };

  const maskSelection = () => {
    setHiddenDocKeys((current) => {
      const selectedKeys = visibleCourriers.filter((doc: CourrierSimule) => selectedIds.includes(doc.id)).map(getDocKey);
      return Array.from(new Set([...current, ...selectedKeys]));
    });
    setSelectedIds([]);
  };

  const archiveSelection = async () => {
    const updates = selectedIds.reduce<Record<number, Partial<CourrierSimule>>>((acc, id) => {
      acc[id] = { serviceActuel: getServiceLabel("Archive", langue), statut: getStatusLabel("Archive", langue) };
      return acc;
    }, {});
    setDocOverrides((current) => ({ ...current, ...updates }));
    if (token && selectedIds.length > 0) {
      try {
        await fetch(`${BASE_URL}/api/Documents/archive-batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: selectedIds }),
        });
        await refetch();
      } catch (err) {
        console.warn("Archivage local uniquement:", err);
      }
    }
    setSelectedIds([]);
  };

  const changerStatutSortant = async (id: number, nouveauStatut: string) => {
    setDocOverrides((current) => ({
      ...current,
      [id]: { ...(current[id] || {}), statut: getStatusLabel(nouveauStatut, langue) },
    }));
    if (!token) return;
    try {
      await fetch(`${BASE_URL}/api/CourrierSortant/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      await refetch();
    } catch (err) {
      console.warn("Statut appliqué localement, backend inaccessible:", err);
    }
  };

  const handleDelete = async (doc: CourrierSimule) => {
    const confirmMsg = langue === "fr"
      ? "Voulez-vous vraiment supprimer ce document ?"
      : "هل تريد بالتأكيد حذف هذه الوثيقة ؟";
    if (!confirm(confirmMsg)) return;

    const endpoint = doc.type === "entrant-juridique"
      ? `${BASE_URL}/api/CourrierJuridique/${doc.id}`
      : doc.type === "sortant-normal" || doc.type === "sortant-demande"
        ? `${BASE_URL}/api/CourrierSortant/${doc.id}`
        : `${BASE_URL}/api/CourrierAdmin/${doc.id}`;

    if (!token) {
      alert(langue === "fr" ? "Connectez-vous pour supprimer." : "سجّل الدخول للحذف.");
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur ${res.status}: ${errorText}`);
      }

      setSelectedIds((current) => current.filter((id) => id !== doc.id));
      alert(langue === "fr" ? "Document supprimé." : "تم حذف الوثيقة.");
      await refetch();
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      alert(
        langue === "fr"
          ? `Erreur : ${err.message || "backend inaccessible"}`
          : `خطأ : ${err.message || "الخادم غير متاح"}`
      );
    }
  };

  const registerRetrait = (row: { id: number; reference: string; objet: string }) => {
    setRetraitDoc({ id: row.id, reference: row.reference, objet: row.objet });
  };

  if (!isAuthenticated) {
    return <LoginPage langue={langue} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans antialiased" dir={langue === "ar" ? "rtl" : "ltr"}>
      <Sidebar
        langue={langue}
        setLangue={setLangue}
        vueActive={vueActive}
        setVueActive={setVueActive}
        user={user}
        logout={logout}
        cur={cur}
        canSeeEntrantAdmin={canSeeEntrantAdmin}
        canSeeEntrantJuridique={canSeeEntrantJuridique}
        canSeeSortantNormal={canSeeSortantNormal}
        canSeeSortantDemande={canSeeSortantDemande}
        isAdmin={isAdmin}
        canManageUsers={canManageUsers}
        canSeeAdminSection={canSeeAdminSection}
        canOpenDossiers={canOpenDossiers}
        canTransfer={canTransfer}
        canViewArchives={canViewArchives}
        canViewTransactions={canViewTransactions}
        pendingNotifications={pendingNotifications}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="border-b border-slate-200 p-6 flex justify-between items-center bg-white">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {vueActive === "dashboard" && cur.tbd}
              {vueActive === "mes-entites" && cur.mesDocuments}
              {vueActive === "transactions" && cur.registreTransactions}
              {vueActive === "archives" && cur.archivesJuridiques}
              {vueActive === "admin-listes" && cur.gestionListes}
              {vueActive === "recherche-dossiers" && cur.rechercheDossiers}
              {vueActive === "entrant-admin" && cur.admin}
              {vueActive === "entrant-juridique" && cur.juridique}
              {vueActive === "sortant-normal" && cur.normalMenu}
                {vueActive === "sortant-demande" && cur.demandeMenu}
                {vueActive === "admin-utilisateurs" && cur.utilisateurs}
                {vueActive === "admin-services" && cur.services}
                {vueActive === "admin-equipements" && cur.equipements}
                {vueActive === "notifications" && cur.notifications}
                {vueActive === "profil" && (langue === "fr" ? "Mon profil" : "ملفي الشخصي")}
            </h1>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">{cur.courAppel} • {cur.royaume}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 font-bold text-xs">
            {new Date().toLocaleDateString()}
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto w-full mx-auto space-y-8">
          {vueActive === "dashboard" && (
            <DashboardView
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              workflowDoc={selectedWorkflowDoc}
              setWorkflowDocId={setWorkflowDocId}
              filteredGeneral={filteredGeneral}
              filteredSortant={filteredSortant}
              allDocs={visibleCourriers}
              filtreStatutSortant={filtreStatutSortant}
              setFiltreStatutSortant={setFiltreStatutSortant}
              stats={statusStats}
              totalDocs={totalDocs}
              activityCards={activityCards}
              onViewDoc={(doc: CourrierSimule) => { setSelectedDocument(doc); setShowModal(true); }}
              onTransferDoc={openTransfer}
              onDeleteDoc={handleDelete}
              onOpenDoc={(doc: CourrierSimule) => setWorkspaceDocId(doc.id)}
              onMarquerEnvoye={(id: number) => changerStatutSortant(id, "Envoye")}
              onMarquerAttente={(id: number) => changerStatutSortant(id, "EnAttente")}
              onAnnuler={(id: number) => changerStatutSortant(id, "Annule")}
              onNavigate={setVueActive}
              cur={cur}
              langue={langue}
              onExportGeneral={exportGeneralDocs}
              onExportSortant={exportSortantDocs}
              selectedDocIds={selectedDocIds}
              onToggleDocSelect={toggleDocSelect}
              onSelectAllDocs={selectAllDocs}
              docsPerStep={docsPerStep}
              workflowIndex={workflowCurrentIndex}
              recentActivity={recentActivity}
              serviceLoad={serviceLoad}
            />
          )}

          {vueActive === "mes-entites" && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                <div className="flex flex-wrap gap-3 justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setVueActive("entrant-admin")}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                  >
                    + {cur.gestionCourriers}
                  </button>
                  <input
                    type="text"
                    placeholder={cur.recherche}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-64 p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowRetournerModal(true);
                      fetch(`${BASE_URL}/api/Transactions/doit-revenir`, {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                        .then((r) => r.json())
                        .then((data) => setRetournerDocs(data))
                        .catch(() => setRetournerDocs([]));
                    }}
                    className="px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold"
                  >
                    {cur.docsRetourner} ({docsArchives})
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => exportGeneralDocs("excel")} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100">Excel</button>
                    <button type="button" onClick={() => exportGeneralDocs("word")} className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 hover:bg-blue-100">Word</button>
                    {selectedDocIds.length > 0 && (
                      <>
                        <button type="button" onClick={() => exportSelectedDocs("excel")} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700">
                          {langue === "fr" ? `Export sélection (${selectedDocIds.length})` : `تصدير المحدد (${selectedDocIds.length})`}
                        </button>
                        <button type="button" onClick={() => exportSelectedDocs("word")} className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700">
                          {langue === "fr" ? `Word sélection (${selectedDocIds.length})` : `وورد المحدد (${selectedDocIds.length})`}
                        </button>
                      </>
                    )}
                    <label className="px-2.5 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-200 hover:bg-violet-100 cursor-pointer">
                      {langue === "fr" ? "Importer" : "استيراد"}
                      <input type="file" accept=".csv,.xlsx,.xls,.doc,.docx,.pdf" onChange={handleImportFile} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3 justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {cur.mesDocuments} ({filteredGeneral.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      {selectedIds.length} {langue === "fr" ? "document(s) sélectionné(s)" : "وثيقة محددة"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const docs = filteredGeneral.filter((item) => selectedIds.includes(item.id));
                        if (docs.length === 0) return;
                        if (docs.length === 1) {
                          openTransfer(docs[0]);
                        } else {
                          setBatchTransferDocs(docs);
                          setTransferModalDoc(docs[0]);
                          setSelectedServices([]);
                          setTransferMessage("");
                          setTransferMustReturn(false);
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold"
                    >
                      {cur.transfererSelection}
                    </button>
                    <button
                      type="button"
                      onClick={archiveSelection}
                      className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold"
                    >
                      {cur.archiverSelection}
                    </button>
                    <button
                      type="button"
                      onClick={maskSelection}
                      className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold"
                    >
                      {cur.masquerSelection}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-sky-50 border-b border-sky-200 text-slate-700">
                      <tr>
                        <th className="p-3 text-start w-10">
                          <input
                            type="checkbox"
                            aria-label={cur.select}
                            checked={selectedIds.length === filteredGeneral.length && filteredGeneral.length > 0}
                            onChange={() => {
                              if (selectedIds.length === filteredGeneral.length) {
                                setSelectedIds([]);
                              } else {
                                setSelectedIds(filteredGeneral.map((d) => d.id));
                              }
                            }}
                          />
                        </th>
                        <th className="p-3 text-start">{cur.tblTitre}</th>
                        <th className="p-3 text-start">{cur.tblRef}</th>
                        <th className="p-3 text-start">{cur.tblType}</th>
                        <th className="p-3 text-start">{cur.tblDate}</th>
                        <th className="p-3 text-start">{cur.tblSource}</th>
                        <th className="p-3 text-start">{cur.tblDest}</th>
                        <th className="p-3 text-center">{cur.tblActions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGeneral.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                            {cur.aucunDoc}
                          </td>
                        </tr>
                      ) : (
                        filteredGeneral.map((doc) => (
                          <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                aria-label={doc.reference}
                                checked={selectedIds.includes(doc.id)}
                                onChange={() => toggleSelected(doc.id)}
                              />
                            </td>
                            <td className="p-3 font-bold text-slate-800">{doc.objet}</td>
                            <td className="p-3 font-mono text-slate-600">{doc.reference}</td>
                            <td className="p-3">
                              {doc.type === "entrant-juridique" ? cur.juridique : cur.admin}
                            </td>
                            <td className="p-3 text-slate-500">{doc.date}</td>
                            <td className="p-3">{doc.source}</td>
                            <td className="p-3">{getServiceLabel(doc.serviceActuel, langue)}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDocument(doc);
                                    setShowModal(true);
                                  }}
                                  className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold"
                                >
                                  {cur.btnVoir}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openTransfer(doc)}
                                  className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 text-[10px] font-bold"
                                >
                                  {cur.btnSuivant}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => maskDocument(doc)}
                                  className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 text-[10px] font-bold"
                                >
                                  {langue === "fr" ? "Masquer" : "إخفاء"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(doc)}
                                  className="px-2 py-1 rounded border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-bold"
                                >
                                  {cur.btnSupprimer}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {vueActive === "transactions" && (
            <TransactionsPage
              langue={langue}
              cur={cur}
              token={token}
              BASE_URL={BASE_URL}
              onAccepted={refetch}
            />
          )}

          {vueActive === "archives" && (
            <div className="space-y-5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCorbeille(false); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${!showCorbeille ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                >
                  {cur.archivesJuridiques}
                </button>
                {(isAdmin || isGreffier) && (
                  <button
                    type="button"
                    onClick={() => { setShowCorbeille(true); fetchCorbeille(); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${showCorbeille ? "bg-red-600 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                  >
                    {langue === "fr" ? "Corbeille" : "سلة المهملات"} ({corbeilleDocs.length})
                  </button>
                )}
              </div>

              {!showCorbeille ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                      <h3 className="font-bold text-slate-900 text-sm">{cur.archivesJuridiques}</h3>
                      <p className="text-xs text-slate-500 mt-1">{cur.retraitSection}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                      <h3 className="font-bold text-slate-900 text-sm">{cur.tousRetraits}</h3>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{docsArchives}</p>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                      <input
                        type="text"
                        placeholder={cur.recherche}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-md p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const rows = filteredGeneral.slice(0, 5).map((doc, index) => ({
                            reference: doc.reference,
                            objet: doc.objet,
                            service: doc.serviceActuel,
                            retrait: index % 2 === 0 ? cur.nonCommence : cur.enCours
                          }));
                          exportRows(rows, "archives", "excel", cur.archivesJuridiques);
                        }}
                        className="ms-3 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                      >
                        {cur.exporterExcel}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const rows = filteredGeneral.slice(0, 5).map((doc) => ({
                            reference: doc.reference,
                            objet: doc.objet,
                            service: doc.serviceActuel,
                            statut: doc.statut
                          }));
                          exportRows(rows, "archives", "word", cur.archivesJuridiques);
                        }}
                        className="ms-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
                      >
                        Word
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-sky-50 text-slate-700 border-b border-sky-200">
                          <tr>
                            <th className="p-3 text-start">{cur.tblRef}</th>
                            <th className="p-3 text-start">{cur.tblTitre}</th>
                            <th className="p-3 text-start">{cur.serviceActuel}</th>
                            <th className="p-3 text-start">{cur.statutAction}</th>
                            <th className="p-3 text-center">{cur.tblActions}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGeneral.slice(0, 10).map((doc) => (
                            <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="p-3 font-mono">{doc.reference}</td>
                              <td className="p-3 font-bold">{doc.objet}</td>
                              <td className="p-3">{getServiceLabel(doc.serviceActuel, langue)}</td>
                              <td className="p-3">
                                {normalizeStatus(doc.statut) === "Archive" ? cur.archiveDef : cur.enCours}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => registerRetrait({
                                    id: doc.id,
                                    reference: doc.reference,
                                    objet: doc.objet
                                  })}
                                  className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold"
                                >
                                  {cur.btnEnregistrer}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 text-sm">{langue === "fr" ? "Documents supprimés" : "المحذوفات"}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-red-50 text-slate-700 border-b border-red-200">
                        <tr>
                          <th className="p-3 text-start">{cur.tblRef}</th>
                          <th className="p-3 text-start">{cur.tblTitre}</th>
                          <th className="p-3 text-start">{cur.serviceActuel}</th>
                          <th className="p-3 text-center">{cur.tblActions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {corbeilleDocs.length === 0 ? (
                          <tr><td colSpan={4} className="p-6 text-center text-slate-400">{langue === "fr" ? "Aucun document supprimé" : "لا توجد مستندات محذوفة"}</td></tr>
                        ) : (
                          corbeilleDocs.map((doc) => (
                            <tr key={doc.id} className="border-b border-slate-100 hover:bg-red-50/30">
                              <td className="p-3 font-mono">{doc.reference}</td>
                              <td className="p-3 font-bold">{doc.objet}</td>
                              <td className="p-3">{getServiceLabel(doc.serviceActuel, langue)}</td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => restoreDocument(doc.id)}
                                  className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold"
                                >
                                  {langue === "fr" ? "Restaurer" : "استعادة"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {vueActive === "recherche-dossiers" && (() => {
            const s = searchTerm.toLowerCase().trim();
            const searchResults = (() => {
              let results = visibleCourriers;
              if (s) {
                results = results.filter((doc) =>
                  doc.reference.toLowerCase().includes(s) ||
                  doc.objet.toLowerCase().includes(s) ||
                  doc.source.toLowerCase().includes(s) ||
                  doc.serviceActuel.toLowerCase().includes(s) ||
                  doc.statut.toLowerCase().includes(s)
                );
              }
              if (searchFilterService) {
                results = results.filter((doc) => doc.serviceActuel === searchFilterService);
              }
              if (searchFilterType) {
                results = results.filter((doc) => doc.type === searchFilterType);
              }
              if (searchFilterDateDebut) {
                results = results.filter((doc) => doc.date >= searchFilterDateDebut);
              }
              if (searchFilterDateFin) {
                results = results.filter((doc) => doc.date <= searchFilterDateFin);
              }
              return results;
            })();
            const hasSearched = s.length > 0 || searchFilterService.length > 0 || searchFilterType.length > 0 || searchFilterDateDebut.length > 0 || searchFilterDateFin.length > 0;

            return (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
                  <div className="flex flex-wrap gap-3 items-center">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={langue === "fr" ? "Rechercher par référence, titre, source, service..." : "بحث بالمرجع، العنوان، المصدر، المصلحة..."}
                      className="flex-1 min-w-64 p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-700 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {}}
                      className="px-6 py-3 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                    >
                      {cur.lancerRecherche}
                    </button>
                    <button
                      type="button"
                      onClick={searchLocalDirectory}
                      className="px-6 py-3 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition"
                    >
                      {langue === "fr" ? "Rechercher sur mon PC" : "البحث في جهازي"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <select value={searchFilterService} onChange={(e) => setSearchFilterService(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-700 dark:text-slate-200 outline-none">
                      <option value="">{langue === "fr" ? "Tous les services" : "جميع المصالح"}</option>
                      {[...new Set(visibleCourriers.map(d => d.serviceActuel))].sort().map(svc => (
                        <option key={svc} value={svc}>{getServiceLabel(svc, langue)}</option>
                      ))}
                    </select>
                    <select value={searchFilterType} onChange={(e) => setSearchFilterType(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-700 dark:text-slate-200 outline-none">
                      <option value="">{langue === "fr" ? "Tous les types" : "جميع الأنواع"}</option>
                      <option value="entrant-admin">{cur.admin}</option>
                      <option value="entrant-juridique">{cur.juridique}</option>
                      <option value="sortant-normal">{cur.normal}</option>
                      <option value="sortant-demande">{cur.demande}</option>
                    </select>
                    <input type="date" value={searchFilterDateDebut} onChange={(e) => setSearchFilterDateDebut(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-700 dark:text-slate-200 outline-none" title={langue === "fr" ? "Date début" : "تاريخ البداية"} />
                    <input type="date" value={searchFilterDateFin} onChange={(e) => setSearchFilterDateFin(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-700 dark:text-slate-200 outline-none" title={langue === "fr" ? "Date fin" : "تاريخ النهاية"} />
                    {(searchFilterService || searchFilterType || searchFilterDateDebut || searchFilterDateFin) && (
                      <button type="button" onClick={() => { setSearchFilterService(""); setSearchFilterType(""); setSearchFilterDateDebut(""); setSearchFilterDateFin(""); }} className="px-3 py-2 text-[11px] font-bold text-red-600 hover:text-red-800 underline">
                        {langue === "fr" ? "Effacer filtres" : "مسح الفلاتر"}
                      </button>
                    )}
                  </div>
                  {searchLocalFiles && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-bold">
                        {localFiles.length} {langue === "fr" ? "fichiers locaux chargés" : "ملف محلي محمل"}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setSearchLocalFiles(false); setLocalFiles([]); }}
                        className="text-red-500 hover:text-red-700 font-bold underline"
                      >
                        {langue === "fr" ? "Décharger" : "إلغاء التحميل"}
                      </button>
                    </div>
                  )}
                </div>

                {hasSearched ? (
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-xs text-slate-800">
                        {langue === "fr" ? `Résultats pour "${searchTerm}"` : `نتائج البحث عن "${searchTerm}"`} ({searchResults.length})
                      </h3>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => exportRows(searchResults.map(d => ({
                          [cur.tblRef]: d.reference,
                          [cur.tblTitre]: d.objet,
                          [cur.tblSource]: d.source,
                          [cur.serviceActuel]: d.serviceActuel,
                          [cur.statutAction]: d.statut,
                        })), "recherche", "excel", cur.rechercheDossiers)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">Excel</button>
                        <button type="button" onClick={() => exportRows(searchResults.map(d => ({
                          [cur.tblRef]: d.reference,
                          [cur.tblTitre]: d.objet,
                          [cur.tblSource]: d.source,
                          [cur.serviceActuel]: d.serviceActuel,
                          [cur.statutAction]: d.statut,
                        })), "recherche", "word", cur.rechercheDossiers)}
                           className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">Word</button>
                      </div>
                    </div>
                    {searchResults.length === 0 ? (
                      <div className="p-12 text-center">
                        <p className="text-slate-400 font-bold text-xs">{langue === "fr" ? "Aucun résultat trouvé" : "لا توجد نتائج"}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-sky-50 border-b border-sky-200 text-slate-700">
                            <tr>
                              <th className="p-3 text-start">{cur.tblRef}</th>
                              <th className="p-3 text-start">{cur.tblTitre}</th>
                              <th className="p-3 text-start">{cur.tblType}</th>
                              <th className="p-3 text-start">{cur.tblDate}</th>
                              <th className="p-3 text-start">{cur.tblSource}</th>
                              <th className="p-3 text-start">{cur.serviceActuel}</th>
                              <th className="p-3 text-start">{cur.statutAction}</th>
                              <th className="p-3 text-center">{cur.tblActions}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults.map((doc) => (
                              <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-slate-600">{doc.reference}</td>
                                <td className="p-3 font-semibold text-slate-800">{doc.objet}</td>
                                <td className="p-3 text-slate-600">{doc.type === "entrant-admin" ? cur.admin : doc.type === "entrant-juridique" ? cur.juridique : doc.type}</td>
                                <td className="p-3 text-slate-500">{doc.date}</td>
                                <td className="p-3">{doc.source}</td>
                            <td className="p-3">{getServiceLabel(doc.serviceActuel, langue)}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    normalizeStatus(doc.statut) === "Archive" ? "bg-slate-100 text-slate-600" :
                                    normalizeStatus(doc.statut) === "EnCours" || normalizeStatus(doc.statut) === "EnInstance" ? "bg-blue-50 text-blue-700" :
                                    "bg-amber-50 text-amber-700"
                                  }`}>{doc.statut}</span>
                                </td>
                                <td className="p-3 text-center">
                                  <button type="button" onClick={() => { setSelectedDocument(doc); setShowModal(true); }}
                                    className="text-blue-600 hover:text-blue-800 font-bold px-2 py-1 rounded hover:bg-blue-50">
                                    {cur.btnVoir}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
                    <p className="text-base font-bold text-slate-900">{langue === "fr" ? "Recherche de dossiers" : "بحث عن ملفات"}</p>
                    <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                      {langue === "fr"
                        ? "Saisissez une référence, un titre, un nom de source ou un service pour lancer la recherche."
                        : "أدخل مرجعاً أو عنواناً أو اسم مصدر أو مصلحة لبدء البحث."}
                    </p>
                  </div>
                )}

                {searchLocalFiles && searchTerm.trim() && (() => {
                  const localResults = getLocalSearchResults(searchTerm);
                  return localResults.length > 0 ? (
                    <div className="bg-white border border-purple-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-purple-200 bg-purple-50">
                        <h3 className="font-bold text-xs text-purple-800">
                          {langue === "fr" ? `Fichiers locaux trouvés` : `الملفات المحلية`} ({localResults.length})
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-purple-50 border-b border-purple-200 text-purple-700">
                            <tr>
                              <th className="p-3 text-start">{langue === "fr" ? "Nom du fichier" : "اسم الملف"}</th>
                              <th className="p-3 text-start">{langue === "fr" ? "Type" : "النوع"}</th>
                              <th className="p-3 text-start">{langue === "fr" ? "Chemin" : "المسار"}</th>
                              <th className="p-3 text-start">{langue === "fr" ? "Extrait" : "مقتطف"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {localResults.map((f, i) => {
                              const ext = f.name.split(".").pop()?.toLowerCase() || "";
                              const typeColors: Record<string, string> = {
                                xlsx: "bg-emerald-100 text-emerald-700",
                                xls: "bg-emerald-100 text-emerald-700",
                                docx: "bg-blue-100 text-blue-700",
                                doc: "bg-blue-100 text-blue-700",
                                pdf: "bg-red-100 text-red-700",
                                csv: "bg-amber-100 text-amber-700",
                                txt: "bg-slate-100 text-slate-700",
                              };
                              return (
                                <tr key={i} className="border-b border-purple-100 hover:bg-purple-50/30">
                                  <td className="p-3 font-bold text-purple-800">{f.name}</td>
                                  <td className="p-3">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${typeColors[ext] || "bg-slate-100 text-slate-700"}`}>
                                      {ext}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono text-slate-500 text-[10px]">{f.path}</td>
                                  <td className="p-3 text-slate-600 max-w-md truncate">{f.snippet || "-"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            );
          })()}

          {isFormView && (
            <div className="bg-white rounded-xl border border-slate-300 shadow-sm w-full overflow-hidden">
              <div className="p-4 bg-slate-900 text-white font-bold text-xs">
                <span>
                  {vueActive === "entrant-admin" && cur.admin}
                  {vueActive === "entrant-juridique" && cur.juridique}
                  {vueActive === "sortant-normal" && cur.normal}
                  {vueActive === "sortant-demande" && cur.demande}
                </span>
              </div>

              <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                {vueActive !== "entrant-admin" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          {vueActive.startsWith("entrant") ? cur.provenance :
                           (vueActive === "sortant-normal" || vueActive === "sortant-demande") ? cur.destinataireExterne :
                           cur.destination} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={tiers}
                          onChange={(e) => setTiers(e.target.value)}
                          className="w-full border border-slate-300 p-3 rounded-lg text-xs outline-none focus:border-blue-500 bg-slate-50/50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">{cur.tblRef} <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          placeholder={langue === "fr" ? "Ex: BO-2026-99" : "مثال: م ض 2026-99"}
                          className="w-full border border-slate-300 p-3 rounded-lg text-xs outline-none focus:border-blue-500 bg-slate-50/50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">{cur.tblTitre} <span className="text-red-500">*</span></label>
                      <textarea
                        rows={3}
                        value={objet}
                        onChange={(e) => setObjet(e.target.value)}
                        placeholder={langue === "ar" ? "اكتب هنا الموضوع..." : "Saisissez l'objet..."}
                        className="w-full border border-slate-300 p-3 rounded-lg text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        {langue === "fr" ? "Service d'origine" : "مصدر الخدمة"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={userService}
                        disabled
                        className="w-full border border-slate-300 p-3 rounded-lg text-xs outline-none bg-slate-100 text-slate-500"
                      />
                    </div>
                  </>
                )}

                {vueActive === "entrant-admin" && canSeeEntrantAdmin && (
                  <AdminForm
                    expediteur={tiers} setExpediteur={setTiers}
                    source={source} setSource={setSource}
                    dateArrivee={dateArrivee} setDateArrivee={setDateArrivee}
                    dateMessage={dateMessage} setDateMessage={setDateMessage}
                    numeroInterne={numeroInterne} setNumeroInterne={setNumeroInterne}
                    anneeNumerotation={anneeNumerotation} setAnneeNumerotation={setAnneeNumerotation}
                    transmissible={transmissible} setTransmissible={setTransmissible}
                    etat={etat} setEtat={setEtat}
                    notes={notes} setNotes={setNotes}
                    fichier={fichier} setFichier={setFichier}
                    modeTraitement={modeTraitement} setModeTraitement={setModeTraitement}
                    serviceDestinataire={serviceDestinataire} setServiceDestinataire={setServiceDestinataire}
                    servicesDiffusion={servicesDiffusion} setServicesDiffusion={setServicesDiffusion}
                    langue={langue} cur={cur}
                    sourceOptions={sourceOptions}
                    etatOptions={etatOptions}
                    reference={reference} setReference={setReference}
                    objet={objet} setObjet={setObjet}
                    serviceOrigine={userService} setServiceOrigine={() => {}} canEditService={isAdmin || isGreffier}
                  />
                )}

                {vueActive === "entrant-juridique" && canSeeEntrantJuridique && (
                  <JuridiqueForm
                    docLie={docLie} setDocLie={setDocLie}
                    dossierPrincipal={dossierPrincipal} setDossierPrincipal={setDossierPrincipal}
                    sourceDocLie={sourceDocLie} setSourceDocLie={setSourceDocLie}
                    parentDossier={parentDossier} setParentDossier={setParentDossier}
                    juridiqueDate={juridiqueDate} setJuridiqueDate={setJuridiqueDate}
                    numeroBureauOrdre={numeroBureauOrdre} setNumeroBureauOrdre={setNumeroBureauOrdre}
                    autoYearSuffix={autoYearSuffix} setAutoYearSuffix={setAutoYearSuffix}
                    juridiqueEtat={juridiqueEtat} setJuridiqueEtat={setJuridiqueEtat}
                    juridiqueService={juridiqueService} setJuridiqueService={setJuridiqueService}
                    typeDossier={typeDossier} setTypeDossier={setTypeDossier}
                    numeroPremiereInstance={numeroPremiereInstance} setNumeroPremiereInstance={setNumeroPremiereInstance}
                    juridiqueNotes={juridiqueNotes} setJuridiqueNotes={setJuridiqueNotes}
                    juridiqueFichier={juridiqueFichier} setJuridiqueFichier={setJuridiqueFichier}
                    circuitJuridique={circuitJuridique} setCircuitJuridique={setCircuitJuridique}
                    etapeService={etapeService} setEtapeService={setEtapeService}
                    etapeJalsat={etapeJalsat} setEtapeJalsat={setEtapeJalsat}
                    etapeTaslim={etapeTaslim} setEtapeTaslim={setEtapeTaslim}
                    autoriteRetrait={autoriteRetrait} setAutoriteRetrait={setAutoriteRetrait}
                    typeException={typeException} setTypeException={setTypeException}
                    numeroDossierAppel={numeroDossierAppel} setNumeroDossierAppel={setNumeroDossierAppel}
                    typeProcedure={typeProcedure} setTypeProcedure={setTypeProcedure}
                    numCourAppel={numCourAppel} setNumCourAppel={setNumCourAppel}
                    conseillerRapporteur={conseillerRapporteur} setConseillerRapporteur={setConseillerRapporteur}
                    dateAudience={dateAudience} setDateAudience={setDateAudience}
                    statutSousService={statutSousService} setStatutSousService={setStatutSousService}
                    commentaireSousService={commentaireSousService} setCommentaireSousService={setCommentaireSousService}
                    reference={reference} tiers={tiers} objet={objet}
                    isJalsatService={isJalsatService}
                    isTaslimService={isTaslimService}
                    langue={langue} cur={cur}
                    userRole={role}
                  />
                )}

                {(vueActive === "sortant-normal" || vueActive === "sortant-demande") && (
                   <SortantForm
                    dateEnvoi={dateEnvoi}
                    setDateEnvoi={setDateEnvoi}
                    typeCourrier={vueActive === "sortant-normal" ? cur.normal : cur.demande}
                    vueActive={vueActive}
                    cur={cur}
                    service={serviceSortant}
                    setService={setServiceSortant}
                    numeroBureauOrdre={numeroBureauOrdreSortant}
                    setNumeroBureauOrdre={setNumeroBureauOrdreSortant}
                    notes={notesSortant}
                    setNotes={setNotesSortant}
                    fichier={fichierSortant}
                    setFichier={setFichierSortant}
                    langue={langue}
                    tribunalOrigine={tribunalOrigineSortant}
                    setTribunalOrigine={setTribunalOrigineSortant}
                    tribunalDestination={tribunalDestinationSortant}
                    setTribunalDestination={setTribunalDestinationSortant}
                  />
                )}

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={!!isSubmitting}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-8 py-4 rounded-xl transition shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? cur.chargement : cur.btnEnregistrer}
                  </button>
                </div>
              </form>
            </div>
          )}

          {vueActive === "admin-utilisateurs" && canManageUsers && (
            <GestionUtilisateurs langue={langue} cur={cur} token={token} BASE_URL={BASE_URL} onExport={(f) => exportAdminData(f, "utilisateurs")} />
          )}

          {vueActive === "admin-services" && canSeeAdminSection && (
            <GestionServices langue={langue} cur={cur} token={token} BASE_URL={BASE_URL} onExport={(f) => exportAdminData(f, "services")} />
          )}

          {vueActive === "admin-equipements" && canSeeAdminSection && (
            <GestionEquipements langue={langue} cur={cur} token={token} BASE_URL={BASE_URL} onExport={(f) => exportAdminData(f, "equipements")} />
          )}

          {vueActive === "admin-listes" && canSeeAdminSection && (
            <GestionListes langue={langue} cur={cur} token={token} BASE_URL={BASE_URL} onExport={(f) => exportAdminData(f, "listes")} />
          )}

          {vueActive === "notifications" && (
            <NotificationsPage langue={langue} cur={cur} token={token} BASE_URL={BASE_URL} onExport={exportNotifications} />
          )}

          {vueActive === "profil" && (
            <ProfilPage langue={langue} cur={cur} token={token} BASE_URL={BASE_URL} user={user} />
          )}
        </div>
      </main>

      {transferModalDoc && (
        <TransferModal
          doc={transferModalDoc}
          onClose={() => setTransferModalDoc(null)}
          onConfirm={confirmTransfer}
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          transferMessage={transferMessage}
          setTransferMessage={setTransferMessage}
          transferMustReturn={transferMustReturn}
          setTransferMustReturn={setTransferMustReturn}
          langue={langue}
          cur={cur}
        />
      )}

      {showModal && selectedDocument && (
        <DetailModal
          doc={selectedDocument}
          onClose={() => { setShowModal(false); setHistoriqueActions([]); }}
          historique={historiqueActions}
          cur={cur}
          langue={langue}
          token={token}
          BASE_URL={BASE_URL}
        />
      )}

      {retraitDoc && (
        <ArchiveRetraitPage
          langue={langue}
          cur={cur}
          token={token}
          BASE_URL={BASE_URL}
          selectedDoc={retraitDoc}
          onClose={() => setRetraitDoc(null)}
          userNom={user?.nom || ""}
        />
      )}

      {showRetournerModal && (
        <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4" onClick={() => setShowRetournerModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">
                {langue === "fr" ? "Documents à retourner" : "الوثائق المرجعة"} ({retournerDocs.length})
              </h3>
              <button onClick={() => setShowRetournerModal(false)} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {retournerDocs.length === 0 ? (
                <p className="text-center text-slate-400 text-xs font-bold py-8">{langue === "fr" ? "Aucun document à retourner" : "لا توجد وثائق للإرجاع"}</p>
              ) : (
                <div className="space-y-2">
                  {retournerDocs.map((t: any) => (
                    <div key={t.id} className="p-3 border border-amber-200 rounded-lg bg-amber-50 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{t.documentSujet}</p>
                        <p className="text-[11px] text-slate-500">
                          {langue === "fr" ? "De" : "من"}: {getServiceLabel(t.sourceServiceId, langue)} → {getServiceLabel(t.destinationServiceId, langue)}
                        </p>
                        {t.message && <p className="text-[11px] text-red-600 mt-1">{langue === "fr" ? "Motif" : "السبب"}: {t.message}</p>}
                      </div>
                      <span className="px-2 py-1 text-[10px] font-bold rounded bg-amber-100 text-amber-700">
                        {langue === "fr" ? "À retourner" : "مرجع"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4" onClick={() => setImportModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">
                {langue === "fr" ? `Importer depuis ${importFileName}` : `استيراد من ${importFileName}`} ({importData.length} {langue === "fr" ? "lignes" : "صفوف"})
              </h3>
              <button onClick={() => setImportModalOpen(false)} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {importData.length === 0 ? (
                <p className="text-center text-slate-400 text-xs font-bold py-8">{langue === "fr" ? "Aucune donnée détectée" : "لم يتم اكتشاف بيانات"}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100">
                      <tr>
                        {Object.keys(importData[0]).map((h) => (
                          <th key={h} className="p-2 text-start font-bold text-slate-700 border-b">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-b hover:bg-slate-50">
                          {Object.keys(importData[0]).map((h) => (
                            <td key={h} className="p-2 text-slate-600">{String(row[h] ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importData.length > 20 && (
                    <p className="text-center text-slate-400 text-[10px] mt-2">... {importData.length - 20} {langue === "fr" ? "lignes supplémentaires" : "صفوف إضافية"}</p>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setImportModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                {cur.annuler}
              </button>
              <button onClick={confirmImport} disabled={importData.length === 0} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40">
                {langue === "fr" ? `Importer ${importData.length} ligne(s)` : `استيراد ${importData.length} صف(وف)`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Workspace Modal */}
      {workspaceDocId && (
        <WorkspaceModal
          docId={workspaceDocId}
          onClose={() => setWorkspaceDocId(null)}
          token={token}
          BASE_URL={BASE_URL}
          langue={langue}
          cur={cur}
          onTransfer={(doc: any) => {
            setWorkspaceDocId(null);
            openTransfer(doc);
          }}
        />
      )}
    </div>
  );
}