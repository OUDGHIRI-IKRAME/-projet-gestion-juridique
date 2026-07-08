# Prompt pour sessions futures — Projet Gestion Juridique

Copiez ce texte entier au début d'une nouvelle session pour que l'IA comprenne le projet immédiatement.

---

## Résumé du projet

Application web de gestion judiciaire pour une **Cour d'Appel Administrative de Fès** (Maroc). C'est un système de workflow documentaire avec accès basé sur les rôles, bilingue français/arabe, pour gérer le circuit complet des dossiers administratifs et juridiques.

## Stack technique

| Couche | Technologie | Port |
|--------|-------------|------|
| Backend | ASP.NET Core 10 + SQL Server LocalDB | **5200** |
| Frontend | Next.js 16 + React 19 + Tailwind CSS | **3000** |
| Base de données | SQL Server LocalDB `GestionJuridiqueDB` | — |

## Démarrage

```bash
# Backend
cd WebApplication1/WebApplication1
dotnet run    # http://localhost:5200

# Frontend
cd frontend-juridique
npm run dev   # http://localhost:3000
```

## Comptes utilisateurs (seedés automatiquement)

| Login | Mot de passe | Rôle | Service |
|-------|-------------|------|---------|
| `admin` | `admin123` | Admin | Direction |
| `greffier` | `greffier123` | Greffier | Greffe |
| `bureauordre` | `bureauordre123` | BureauOrdre | Bureau d'ordre et bureau administratif |
| `jalsat` | `jalsat123` | Jalsat | JalsatWaIjra2at |
| `ijra2baht` | `ijra2baht123` | Ijra2Baht | Ijra2Baht |
| `khibra` | `khibra123` | Khibra | Khibra |
| `tabligh` | `tabligh123` | Tabligh | Tabligh |
| `archive` | `archive123` | Archive | Archive |
| `directeur` | `directeur123` | Directeur | Direction |
| `consultant` | `consult123` | Consultant | Direction |

→ 27 comptes au total (1 par service). Voir `Program.cs` lignes 228-258 pour la liste complète.

## Fonctionnalités principales

### 1. Workflow de transfert de dossiers
- Un document suit un circuit : `BureauOrdre → OuvertureDossier → KitabaKhasa → JalsatWaIjra2at → TaslimNusakh → Archive`
- Chaque service ne voit que SES propres documents
- Transfert multi-services avec cases à cocher (groupes + enfants)
- Parent → enfants auto (`JalsatWaIjra2at → Ijra2Baht, MofawidMalaki, Khibra, MustacharMoqarir`)
- Bouton "doitRevenir" : après acceptation/refus, le document revient automatiquement à l'expéditeur

### 2. Types de documents
- **Entrant Admin** (`CourrierAdministratif`) : courriers administratifs entrants
- **Entrant Juridique** (`DossierJuridique`) : dossiers juridiques
- **Sortant** (`CourrierSortant`) : courriers sortants (normal + demande)

### 3. Notifications
- Badge de notifications en attente dans la sidebar
- Page notifications avec accepter/refuser individuel ou en lot
- 30 secondes de polling automatique
- `fetchPending()` appelé après chaque transfert

### 4. Recherche
- Recherche rapide par texte (référence, objet)
- Recherche multi-critères : service, type, date début/fin
- Recherche locale de fichiers (API `showDirectoryPicker`)

### 5. Espace de travail (Workspace)
Bouton "Ouvrir" sur chaque document → Modal avec 3 onglets :
- **Informations** : tous les champs du dossier, mode édition avec sauvegarde
- **Notes** : ajouter/modifier/supprimer des notes
- **Historique** : audit trail des modifications (ancienne → nouvelle valeur)
- Transfert depuis le workspace

### 6. Import/Export
- **Export** : Excel (.xlsx) et Word (.doc) uniquement (PDF supprimé)
- **Import** : CSV, Excel (.xlsx/.xls), Word (.doc/.docx via mammoth), PDF (.pdf via pdfjs-dist)
- Style d'export simple et administratif (pas de couleurs, pas de gras)
- Export groupé (sélection multiple)

### 7. Corbeille (soft-delete)
- Documents cachés via `EstSupprime = true` (pas de suppression physique)
- Restauration possible depuis la corbeille

### 8. Mode sombre
- Toggle 🌙/☀️ dans la sidebar
- Persistance dans `localStorage`
- Classes `dark:` Tailwind dans `globals.css`

### 9. Bilingue FR/AR
- Toggle français/arabe dans la sidebar
- RTL automatique en arabe
- Zéro mot français dans le mode AR
- Service labels traduits (SERVICE_LABELS dans constants.ts)
- Rôle labels traduits (getRoleLabel dans constants.ts)

### 10. Progress bars
- Barre de progression par dossier (étape 2/6)
- Alertes de retard (> 7 jours)
- Utilise `dateRaw` (date ISO brute) pour un calcul précis

## Architecture Backend

### Modèles (TPT Inheritance)
```
Document (base)
├── CourrierAdministratif
├── DossierJuridique
├── CourrierSortant
├── DocumentNote (annotations)
├── DocumentModification (audit trail)
Transaction (transferts)
Retrait (archivage/retrait)
ActionJuridique (journal d'audit workflow)
Utilisateur
ServiceInfo
Equipment
ListItem
Substitute
```

### Controllers principaux
| Route | Controller | Usage |
|-------|-----------|-------|
| `/api/Auth/login` | AuthController | Connexion JWT |
| `/api/CourrierAdmin` | CourrierAdminController | CRUD courriers admin |
| `/api/CourrierJuridique` | CourrierJuridiqueController | CRUD dossiers juridiques |
| `/api/CourrierSortant` | CourrierSortantController | CRUD courriers sortants |
| `/api/Transfer` | TransferController | Transfert multi-services |
| `/api/Transactions` | TransactionsController | Notifications, accepter, refuser |
| `/api/Documents` | DocumentsController | Soft-delete, restore, archive |
| `/api/Workspace` | WorkspaceController | Édition, notes, audit trail |
| `/api/Retrait` | RetraitController | Retrait d'archives |
| `/api/Users` | UsersController | Gestion utilisateurs |
| `/api/Services` | ServicesController | Services |
| `/api/Equipment` | EquipmentController | Équipements |
| `/api/ListItems` | ListItemsController | Listes dynamiques |

### Enums
- `ServiceTribunal` : 24 valeurs (BureauOrdre, Ijra2Baht, etc.)
- `StatutDossier` : Nouveau, EnCours, EnInstance, Cloture, Archive
- `StatutTransaction` : EnAttente(0), Accepte(1), Refuse(2)

### Clé JWT
```
CleSecretTresLonguePourLeJwtDeNotreAppJuridique2026!
```
Expire après 8 heures, `ClockSkew = TimeSpan.Zero`.

## Architecture Frontend

### Structure des fichiers principaux
```
frontend-juridique/
├── app/
│   ├── page.tsx                    # Page principale (~2100 lignes)
│   ├── layout.tsx                  # ThemeProvider wrapper
│   ├── globals.css                 # Dark mode CSS
│   ├── types/index.ts              # Types TypeScript
│   ├── hooks/useDocuments.ts       # Fetch documents depuis 3 APIs
│   └── components/
│       ├── layout/Sidebar.tsx      # Navigation + toggles
│       ├── dashboard/
│       │   ├── DashboardView.tsx   # Vue dashboard complète
│       │   ├── StatsCircles.tsx    # Cercles de statistiques
│       │   ├── WorkflowSteps.tsx   # Étapes du workflow
│       │   └── ActivityCards.tsx   # Cartes d'activité
│       ├── tables/
│       │   ├── GeneralTable.tsx    # Table documents entrants
│       │   └── SortantTable.tsx    # Table documents sortants
│       ├── modals/
│       │   ├── DetailModal.tsx     # Détail read-only + timeline
│       │   ├── TransferModal.tsx   # Transfert multi-services
│       │   └── WorkspaceModal.tsx  # Espace de travail (édition)
│       ├── forms/
│       │   ├── AdminForm.tsx       # Formulaire courrier admin
│       │   ├── JuridiqueForm.tsx   # Formulaire dossier juridique
│       │   └── SortantForm.tsx     # Formulaire courrier sortant
│       ├── pages/
│       │   ├── NotificationsPage.tsx
│       │   ├── TransactionsPage.tsx
│       │   └── ArchiveRetraitPage.tsx
│       └── admin/
│           ├── GestionUtilisateurs.tsx
│           ├── GestionServices.tsx
│           ├── GestionEquipements.tsx
│           └── GestionListes.tsx
├── context/
│   ├── AuthContext.tsx             # Auth JWT + localStorage
│   └── ThemeContext.tsx            # Dark mode + localStorage
├── lib/
│   ├── constants.ts               # SERVICE_GROUPS, WORKFLOW_STEPS, PARENT_CHILDREN, etc.
│   ├── translations.ts            # FR/AR translations
│   ├── exportImport.ts            # Excel/Word export + CSV/Excel/Word/PDF import
│   └── utils.ts                   # Fonctions utilitaires
```

### Constantes clés (constants.ts)
- `SERVICE_GROUPS` : groupes de services avec labels FR/AR
- `WORKFLOW_STEPS` : 6 étapes du workflow
- `PARENT_CHILDREN` : mapping parent → enfants pour transfert
- `getWorkflowProgress()` : pourcentage de progression
- `getDelayDays()` : jours de retard (utilise dateRaw)
- `getRoleLabel()` : traduction des rôles
- `SERVICE_LABELS` : labels FR/AR de tous les services
- `USER_SERVICE_TO_ENUM` : mapping nom service → enum

### Types principaux (types/index.ts)
```typescript
CourrierSimule {
  id, reference, objet, type: VueActive, date, dateRaw?,
  source, serviceActuel, serviceActuelKey?, statut, filePath?,
  description?, destinataireExterne?, dateEnvoi?,
  typeSortant?, tribunalOrigine?, tribunalDestination?
}

VueActive = "dashboard" | "entrant-admin" | "entrant-juridique" |
  "sortant-normal" | "sortant-demande" | "notifications" | ...
```

## Contraintes importantes

1. **Backend port** : toujours 5200
2. **Frontend port** : toujours 3000
3. **Référence/NuméroOrdre** : saisi MANUELLEMENT par l'utilisateur
4. **ServiceActuel** = `creatorServiceEnum` lors de la création (le doc reste dans le service créateur)
5. **Tout service peut transférer vers tout autre service**
6. **Après transfert** : le document reste visible dans le service d'origine
7. **Export** : Excel + Word UNIQUEMENT (PDF éliminé)
8. **Style d'export** : simple, pas de couleurs, pas de gras
9. **Soft-delete** : `EstSupprime = true` (jamais de suppression physique)
10. **Notifications** : poll toutes les 30 secondes + refresh après transfert
11. **DernierTransfert** : champ calculé côté backend (dernière date de transaction)
12. **dateRaw** : date ISO brute utilisée pour le calcul de retard

## Fichiers modifiés récemment (ne pas casser)

- `TransactionsController.cs` : GetPending, Accepter (doitRevenir auto-return), Refuser (transaction.DoitRevenir)
- `TransferController.cs` : ParentChildren propagation
- `WorkspaceController.cs` : nouveau — édition + notes + audit
- `DocumentNote.cs`, `DocumentModification.cs` : nouveaux modèles
- `page.tsx` : workspaceDocId, fetchPending hors useEffect, fetchPending après transfert
- `WorkspaceModal.tsx` : nouveau — modal édition/notes/historique
- `GeneralTable.tsx`, `SortantTable.tsx` : bouton "Ouvrir"
- `DashboardView.tsx` : onOpenDoc prop
- `useDocuments.ts` : dateRaw dans les mappings
- `constants.ts` : getDelayDays avec null safety
- `types/index.ts` : champ dateRaw
- `Program.cs` : cleanup auto + ChangeTracker.Clear()
