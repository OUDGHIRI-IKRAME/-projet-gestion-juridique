# Prompt de Session — Projet Gestion Juridique

## Contexte Général

Je développe un **système de gestion de dossiers judiciaires** pour une **Cour d'Appel Administrative de Fès** (Maroc). C'est une application web fullstack avec authentification JWT, gestion par étapes workflow, transfert inter-services, import/export de documents, et interface bilingue français/arabe.

**Ne jamais supprimer, écraser ou remplacer les fonctionnalités existantes.** À chaque modification, toujours d'abord lire les fichiers concernés avant de les modifier.

---

## Stack Technique

### Backend
- **ASP.NET Core** (net10.0) + **SQL Server LocalDB**
- Port : `http://localhost:5200`
- Auth JWT (secret : `CleSecretTresLonguePourLeJwtDeNotreAppJuridique2026!`, expire 8h)
- Entity Framework Core avec migrations
- 27 comptes utilisateurs pré-créés

### Frontend
- **Next.js 16** + **React 19** + **TypeScript**
- Port : `http://localhost:3000`
- TailwindCSS pour le style
- Contexte Theme pour dark mode
- Contexte Auth pour JWT

---

## Fonctionnalités Principales

### 1. Authentification & Rôles
- **Admin** : Accès complet + gestion utilisateurs
- **Greffier** : Accès complet SAUF gestion utilisateurs
- **Autres rôles** : Accès limité à leur service
- Tous les utilisateurs ont `canTransfer = true`

### 2. Workflow par Étapes
```
BureauOrdre(0) → OuvertureDossier(1) → KitabaKhasa(2) → JalsatWaIjra2at(3) → TaslimNusakh(4) → Archive(5)
```

### 3. Types de Documents
- **Entrant (Admin)** : Courriers administratifs
- **Entrant (Juridique)** : Dossiers juridiques
- **Sortant** : Courriers sortants avec tribunal origine/destination

### 4. Transfert Multi-Services
- Tout service peut transférer vers n'importe quel autre service
- Parent→Enfant propagation automatique :
  - `JalsatWaIjra2at` → `[Ijra2Baht, MofawidMalaki, Khibra, MustacharMoqarir]`
  - `TaslimNusakh` → `[Tabligh, TasfiyatSawa2ir, Archive]`
- Les documents restent visibles dans le service d'origine
- `doitRevenir` : retour automatique sur acceptation/refus

### 5. Import/Export
- **Export** : Excel (.xlsx) + Word (.doc) — style simple, pas de couleurs
- **Import** : CSV, Excel, Word (via mammoth), PDF (via pdfjs-dist)
- **Import rapide** : crée directement le document sans remplir le formulaire
- **Import Excel depuis tableau** : bouton "📥 Import Excel" dans le header du GeneralTable
- Les colonnes arabes sont parsées automatiquement

### 6. Recherche Globale
- Recherche de documents par nom/titre/référence
- Recherche de dossiers dans le workspace

### 7. Corbeille (Soft-Delete)
- `EstSupprime = true` — les documents ne sont pas supprimés définitivement
- Restauration possible depuis la corbeille

### 8. Notifications
- Badge sur l'icone de notifications
- Polling toutes les 30 secondes
- Accepter/Refuser avec `doitRevenir` checkbox

### 9. Workspace / Édition
- Le bouton "Afficher" ouvre un modal éditable (DetailModal)
- Champs modifiables + sauvegarde via PUT `/api/Workspace/document/{id}`
- Ajout de notes
- Chronologie des transferts
- Bouton de transfert intégré

### 10. Visualisation de Fichiers
- **PDF** : iframe natif avec `/api/FileUpload/{storedName}`
- **Word (.doc/.docx)** : endpoint `/api/FileUpload/preview/{storedName}` qui détecte le HTML ou convertit via OpenXml
- **Excel (.xlsx/.xls)** : endpoint preview qui convertit via OpenXml.Spreadsheet
- Les fichiers `.doc/.docx/.xlsx` peuvent être du HTML sauvé avec extension Office → détection BOM UTF-8

### 11. Mode Sombre (Dark Mode)
- Toggle dans la sidebar
- Persisté dans localStorage
- Sélecteurs CSS `html.dark` dans `globals.css`

### 12. Sortants / Mahkama
- Suivi des tribunaux/mahkamas
- Les sortants sont visibles par TOUS les services
- Tableau dédié dans le dashboard

### 13. Historique & Audit
- `DocumentModifications` : piste d'audit complète
- `DocumentNotes` : annotations/notes par document
- Timeline dans le DetailModal

---

## Base de Données

### Tables Principales
- **Documents** : Table TPH (Table Per Hierarchy) — tous les types de documents
- **CourriersAdministratifs** : Vue Db, pas une table séparée
- **Transactions** : Transferts entre services (ServiceOrigine, ServiceDestination, Statut, DoitRevenir)
- **Utilisateurs** : 27 comptes avec Login, PasswordHash, Role, Service
- **DocumentNotes** : Notes/annotations
- **DocumentModifications** : Audit trail
- **Retraits** : Retrait de documents
- **ActionsJuridiques** : Actions juridiques
- **Services** : Liste des services
- **Equipements** : Équipements
- **ListItems** : Listes de référence

### ServiceTribunal (24 valeurs)
```
BureauOrdre, OuvertureDossier, KitabaKhasa, JalsatWaIjra2at, TaslimNusakh, Archive,
Ijra2Baht, MofawidMalaki, Khibra, MustacharMoqarir, Tabligh, TasfiyatSawa2ir,
Direction, SecretariatGeneral, Contentieux, AffairesJuridiques, Etudes, Cooperation,
Comptabilite, ResourcesHumaines, Informatique, Archives, Communication, Juridique
```

### Modèles Clés
- `Document` : Classe de base avec `FilePath`, `ServiceActuel`, `EstSupprime`
- `Transaction` : `Statut` (EnAttente=0, Accepte=1, Refuse=2), `DoitRevenir`
- `Utilisateur` : `Service` stocké comme string (nom FR ou enum)

---

## Architecture Frontend

### Fichiers Clés
```
frontend-juridique/
├── app/
│   ├── page.tsx              # Page principale — toutes les vues
│   ├── types/index.ts        # Types TypeScript
│   ├── hooks/useDocuments.ts # Hook de fetch avec dateRaw + silent logout
│   └── components/
│       ├── modals/
│       │   ├── DetailModal.tsx    # Modal éditable avec visualisation fichiers
│       │   ├── TransferModal.tsx  # Transfert multi-services
│       │   └── WorkspaceModal.tsx # Workspace avec Info/Notes/Historique
│       ├── tables/
│       │   ├── GeneralTable.tsx   # Tableau principal avec checkboxes + import Excel
│       │   └── SortantTable.tsx   # Tableau sortants avec tribunal
│       ├── layout/Sidebar.tsx     # Navigation + dark mode + badge notifications
│       ├── pages/
│       │   ├── NotificationsPage.tsx  # Notifications avec accept/refuse/doitRevenir
│       │   └── TransactionsPage.tsx   # Transactions avec export
│       ├── forms/
│       │   ├── AdminForm.tsx      # Formulaire courrier admin
│       │   ├── JuridiqueForm.tsx  # Formulaire dossier juridique
│       │   └── SortantForm.tsx    # Formulaire courrier sortant
│       ├── dashboard/DashboardView.tsx  # Dashboard avec stats
│       └── admin/
│           ├── GestionUtilisateurs.tsx
│           ├── GestionServices.tsx
│           ├── GestionEquipements.tsx
│           └── GestionListes.tsx
├── lib/
│   ├── constants.ts     # SERVICE_GROUPS, WORKFLOW_STEPS, PARENT_CHILDREN, getDelayDays()
│   ├── translations.ts  # FR/AR translations
│   └── exportImport.ts  # Export Excel/Word + Import CSV/Excel/Word/PDF
└── context/
    ├── ThemeContext.tsx  # Dark mode
    └── AuthContext.tsx   # JWT auth
```

### Fichiers Clés Backend
```
WebApplication1/
├── Program.cs                    # JWT + Migrate() + seeds + UseStaticFiles()
├── Controllers/
│   ├── AuthController.cs         # Login JWT
│   ├── CourrierAdminController.cs    # CRUD admin + Transmissible
│   ├── CourrierJuridiqueController.cs # CRUD juridique + FilePath
│   ├── CourrierSortantController.cs   # CRUD sortant + FilePath
│   ├── TransferController.cs     # Transfert multi-services + parent→children
│   ├── TransactionsController.cs # Accepter/Refuser + doitRevenir
│   ├── WorkspaceController.cs    # Détails/édition/notes/modifications
│   ├── FileUploadController.cs   # Upload/download/preview (HTML detection + OpenXml)
│   ├── DocumentsController.cs    # Soft-delete/restaurer/corbeille
│   └── UsersController.cs        # CRUD utilisateurs
├── Models/
│   ├── Document.cs               # Classe de base + FilePath
│   ├── CourrierAdministratif.cs  # Transmissible
│   ├── Transaction.cs            # DoitRevenir
│   └── Utilisateur.cs
├── data/AppDbContext.cs
└── Core/Enums/
    ├── ServiceTribunal.cs
    └── StatutTransaction.cs
```

---

## API Endpoints Importants

### Auth
- `POST /api/Auth/login` → JWT token
- `GET /api/Auth/users` → Liste utilisateurs

### Documents
- `GET /api/CourrierAdmin` → Liste admin
- `GET /api/CourrierJuridique` → Liste juridique
- `GET /api/CourrierSortant` → Liste sortant
- `DELETE /api/Documents/{id}` → Soft-delete
- `POST /api/Documents/{id}/restaurer` → Restaurer
- `GET /api/Documents/corbeille` → Corbeille

### Transfert
- `POST /api/Transfer` → Transférer (batch, multi-services)

### Workspace
- `GET /api/Workspace/document/{id}` → Détails complets
- `PUT /api/Workspace/document/{id}` → Modifier
- `GET/POST /api/Workspace/document/{id}/notes` → Notes
- `PUT/DELETE /api/Workspace/notes/{id}` → Modifier/supprimer note

### Fichiers
- `POST /api/FileUpload` → Upload standalone
- `POST /api/FileUpload/{docId}` → Upload + lier au document
- `GET /api/FileUpload/{storedName}` → Télécharger/servir
- `GET /api/FileUpload/preview/{storedName}` → Preview HTML (détection BOM + OpenXml)

### Transactions
- `GET /api/Transactions/count-pending` → Nombre en attente
- `GET /api/Transactions/stats` → Statistiques
- `POST /api/Transactions/{id}/accepter` → Accepter
- `POST /api/Transactions/{id}/refuser` → Refuser
- `POST /api/Transactions/doit-revenir` → Retour

---

## Règles Métier Importantes

1. **Reference/NumeroOrdre** : Saisie MANUELLE par l'utilisateur
2. **ServiceActuel** = service du créateur au moment de la création
3. **ModeTraitement nullable** : null = créer au BureauOrdre sans transfert
4. **Soft-delete** : `EstSupprime = true`, pas de suppression physique
5. **TPH** : Tous les types dans la table `Documents` — PAS de tables séparées
6. **Service stocké** : Mix de noms FR (seed) et noms enum (UI)
7. **Export** : Excel + Word uniquement (PDF éliminé)
8. **Visualisation** : Le Visualiser ne charge PAS automatiquement — il faut cliquer
9. **Fichiers uploadés** : Stockés dans `wwwroot/uploads/` avec `storedName` (timestamp_GUID.ext)
10. **BOM UTF-8** : Les fichiers HTML peuvent avoir un BOM → TrimStart('\uFEFF') nécessaire

---

## Conventions de Code

- **Bilingue** : Zéro mot français en mode AR, zéro valeur enum brute dans l'UI
- **Port Backend** : 5200, **Port Frontend** : 3000
- **Style** : Ne jamais supprimer les styles existants, seulement ajouter
- **Git** : Branche `main`, remote `origin` → `https://github.com/OUDGHIRI-IKRAME/-projet-gestion-juridique.git`
- **Pas de comments** sauf demande explicite
- **TypeScript strict** : Toutes les interfaces typées

---

## Problèmes Connus / En Cours

1. **`gh auth login`** doit être fait par l'utilisateur dans son propre terminal
2. **`git push`** en attente de l'authentification GitHub
3. **Auto-cleanup supprimé** de Program.cs — la DB n'est plus vidée au démarrage
4. **Mammoth** (client-side) n'est plus utilisé pour Word — tout passe par le backend preview
5. **NPOI** a été retiré — incompatible avec .NET 10, remplacé par DocumentFormat.OpenXml

---

## Commandes Utiles

```bash
# Backend
cd WebApplication1
dotnet build
dotnet run --urls http://localhost:5200

# Frontend
cd frontend-juridique
npm run dev
npm run build

# Git
git status
git add .
git commit -m "message"
git push origin main
```

---

## Pour Continuer le Développement

1. **Toujours lire** les fichiers avant de les modifier
2. **Vérifier les builds** après chaque modification (dotnet build + npm run build)
3. **Ne pas supprimer** les fonctionnalités existantes
4. **Respecter le bilinguisme** FR/AR
5. **Vérifier les types TypeScript** avant d'écrire du code
6. **Le DetailModal est éditable** — pas en lecture seule
7. **Les fichiers sont servis** via `/api/FileUpload/{storedName}` ou `/api/FileUpload/preview/{storedName}`
8. **La DB est SQL Server LocalDB** — pas SQLite
