using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using WebApplication1.Data;
using WebApplication1.Models;

var builder = WebApplication.CreateBuilder(args);

var jwtKey = "CleSecretTresLonguePourLeJwtDeNotreAppJuridique2026!";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = null,
        ValidAudience = null,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// ===== CONFIGURATION JSON : ENUMS EN CHAÎNES =====
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ========== SEED AUTOMATIQUE (optionnel) ==========
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        context.Database.Migrate();
        
        // ========== NETTOYAGE: supprimer tous les documents et transferts ==========
        try
        {
            context.ChangeTracker.Clear();
            context.Database.ExecuteSqlRaw("DELETE FROM DocumentModifications");
            context.Database.ExecuteSqlRaw("DELETE FROM DocumentNotes");
            context.Database.ExecuteSqlRaw("DELETE FROM ActionsJuridiques");
            context.Database.ExecuteSqlRaw("DELETE FROM Transactions");
            context.Database.ExecuteSqlRaw("DELETE FROM Retraits");
            context.Database.ExecuteSqlRaw("DELETE FROM CourriersAdministratifs");
            context.Database.ExecuteSqlRaw("DELETE FROM DossiersJuridiques");
            context.Database.ExecuteSqlRaw("DELETE FROM CourriersSortants");
            context.Database.ExecuteSqlRaw("DELETE FROM Documents");
            Console.WriteLine(">>> Base nettoyée: tous les documents supprimés.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Nettoyage ignoré: {ex.Message}");
        }

        context.ChangeTracker.Clear();
        var admin = context.Utilisateurs.FirstOrDefault(u => u.Login == "admin");
        if (admin == null)
        {
            context.Utilisateurs.Add(new Utilisateur
            {
                Login = "admin",
                PasswordHash = "admin123",
                Nom = "Administrateur",
                Role = "Admin",
                Service = "Direction"
            });
            context.SaveChanges();
            Console.WriteLine("=========================================");
            Console.WriteLine("ADMIN CREE AUTOMATIQUEMENT !");
            Console.WriteLine("   Login: admin");
            Console.WriteLine("   Mot de passe: admin123");
            Console.WriteLine("=========================================");
        }
        else
        {
            Console.WriteLine("Utilisateur admin existe deja.");
        }

        // Seed services
        if (!context.Services.Any())
        {
            context.Services.AddRange(
                new ServiceInfo { Nom = "Cellule informatique", Description = "Cellule informatique", Etage = "2ème" },
                new ServiceInfo { Nom = "Bureau de l'efficacité judiciaire et des statistiques", Description = "Bureau de l'efficacité judiciaire et des statistiques", Etage = "1er" },
                new ServiceInfo { Nom = "Service de Gestion Financière", Description = "Service de Gestion Financière", Etage = "RDC" },
                new ServiceInfo { Nom = "Caisse du Tribunal", Description = "Caisse du Tribunal", Etage = "RDC" },
                new ServiceInfo { Nom = "Bureau de Recouvrement", Description = "Bureau de Recouvrement", Etage = "RDC" },
                new ServiceInfo { Nom = "Bureau d'ordre et bureau administratif", Description = "Bureau d'ordre", Etage = "1er" },
                new ServiceInfo { Nom = "Bureau des procédures du commissaire royal", Description = "Procédures du commissaire royal", Etage = "1er" },
                new ServiceInfo { Nom = "Bureau de Gestion des Dossiers Judiciaires", Description = "Gestion des dossiers judiciaires", Etage = "1er" },
                new ServiceInfo { Nom = "Bureau de Gestion des Pourvois en Cassation", Description = "Gestion des pourvois en cassation", Etage = "1er" },
                new ServiceInfo { Nom = "Bureau de Notification", Description = "Notification", Etage = "1er" },
                new ServiceInfo { Nom = "Bureau d'expertise", Description = "Expertise", Etage = "1er" },
                new ServiceInfo { Nom = "Remise de copie de jugement", Description = "Remise de copies", Etage = "1er" },
                new ServiceInfo { Nom = "Archive", Description = "Archives", Etage = "Sous-sol" },
                new ServiceInfo { Nom = "Greffe", Description = "Greffe", Etage = "1er" },
                new ServiceInfo { Nom = "Direction", Description = "Direction générale", Etage = "2ème" }
            );
            context.SaveChanges();
            Console.WriteLine("Services seedés avec succès.");
        }

        // Seed list items
        if (!context.ListItems.Any())
        {
            context.ListItems.AddRange(
                new ListItem { ListName = "types_equipement", Code = "1", ValueFr = "Ordinateur", ValueAr = "حاسوب", DisplayOrder = 1, IsActive = true },
                new ListItem { ListName = "types_equipement", Code = "2", ValueFr = "Imprimante", ValueAr = "طابعة", DisplayOrder = 2, IsActive = true },
                new ListItem { ListName = "types_equipement", Code = "3", ValueFr = "Scanner", ValueAr = "ماسح ضوئي", DisplayOrder = 3, IsActive = true },
                new ListItem { ListName = "types_equipement", Code = "4", ValueFr = "Photocopieur", ValueAr = "آلة التصوير", DisplayOrder = 4, IsActive = true },
                new ListItem { ListName = "types_equipement", Code = "5", ValueFr = "Serveur", ValueAr = "خادم", DisplayOrder = 5, IsActive = true },
                new ListItem { ListName = "types_equipement", Code = "6", ValueFr = "Switch réseau", ValueAr = "موزع شبكة", DisplayOrder = 6, IsActive = true },
                new ListItem { ListName = "types_equipement", Code = "7", ValueFr = "Routeur", ValueAr = "موزع", DisplayOrder = 7, IsActive = true },
                new ListItem { ListName = "types_equipement", Code = "8", ValueFr = "Onduleur", ValueAr = "موزع طاقة كهربائية", DisplayOrder = 8, IsActive = true },
                new ListItem { ListName = "etats_equipement", Code = "1", ValueFr = "Neuf", ValueAr = "جديد", DisplayOrder = 1, IsActive = true },
                new ListItem { ListName = "etats_equipement", Code = "2", ValueFr = "Bon état", ValueAr = "حالة جيدة", DisplayOrder = 2, IsActive = true },
                new ListItem { ListName = "etats_equipement", Code = "3", ValueFr = "À réparer", ValueAr = "يحتاج إصلاح", DisplayOrder = 3, IsActive = true },
                new ListItem { ListName = "etats_equipement", Code = "4", ValueFr = "Hors service", ValueAr = "خارج الخدمة", DisplayOrder = 4, IsActive = true },
                new ListItem { ListName = "types_juridique", Code = "1", ValueFr = "Ordinaire", ValueAr = "عادي", DisplayOrder = 1, IsActive = true },
                new ListItem { ListName = "types_juridique", Code = "2", ValueFr = "Urgent", ValueAr = "مستعجل", DisplayOrder = 2, IsActive = true },
                new ListItem { ListName = "types_juridique", Code = "3", ValueFr = "Très urgent", ValueAr = "مستعجل جداً", DisplayOrder = 3, IsActive = true },
                new ListItem { ListName = "types_tribunal", Code = "1", ValueFr = "Ministère", ValueAr = "وزارة", DisplayOrder = 1, IsActive = true },
                new ListItem { ListName = "types_tribunal", Code = "2", ValueFr = "Direction", ValueAr = "مديرية", DisplayOrder = 2, IsActive = true },
                new ListItem { ListName = "types_tribunal", Code = "3", ValueFr = "Service", ValueAr = "مصلحة", DisplayOrder = 3, IsActive = true },
                new ListItem { ListName = "types_tribunal", Code = "4", ValueFr = "Autre", ValueAr = "أخرى", DisplayOrder = 4, IsActive = true },
                new ListItem { ListName = "etats_document", Code = "1", ValueFr = "Reçu", ValueAr = "وارد", DisplayOrder = 1, IsActive = true },
                new ListItem { ListName = "etats_document", Code = "2", ValueFr = "En cours", ValueAr = "قيد المعالجة", DisplayOrder = 2, IsActive = true },
                new ListItem { ListName = "etats_document", Code = "3", ValueFr = "Traité", ValueAr = "معالج", DisplayOrder = 3, IsActive = true },
                new ListItem { ListName = "etats_document", Code = "4", ValueFr = "Classé", ValueAr = "مصنف", DisplayOrder = 4, IsActive = true },
                new ListItem { ListName = "direction", Code = "1", ValueFr = "Entrant", ValueAr = "وارد", DisplayOrder = 1, IsActive = true },
                new ListItem { ListName = "direction", Code = "2", ValueFr = "Sortant", ValueAr = "صادر", DisplayOrder = 2, IsActive = true },
                new ListItem { ListName = "type_correspondance", Code = "1", ValueFr = "Lettre", ValueAr = "رسالة", DisplayOrder = 1, IsActive = true },
                new ListItem { ListName = "type_correspondance", Code = "2", ValueFr = "Note", ValueAr = "مذكرة", DisplayOrder = 2, IsActive = true },
                new ListItem { ListName = "type_correspondance", Code = "3", ValueFr = "Délibération", ValueAr = "قرار", DisplayOrder = 3, IsActive = true },
                new ListItem { ListName = "sources_courrier", Code = "1", ValueFr = "Ministère", ValueAr = "وزارة", DisplayOrder = 1, IsActive = true },
                new ListItem { ListName = "sources_courrier", Code = "2", ValueFr = "Direction", ValueAr = "مديرية", DisplayOrder = 2, IsActive = true },
                new ListItem { ListName = "sources_courrier", Code = "3", ValueFr = "Service", ValueAr = "مصلحة", DisplayOrder = 3, IsActive = true },
                new ListItem { ListName = "sources_courrier", Code = "4", ValueFr = "Autre", ValueAr = "أخرى", DisplayOrder = 4, IsActive = true },
                new ListItem { ListName = "sources_doc_lie", Code = "1", ValueFr = "Ministère", ValueAr = "وزارة", DisplayOrder = 1, IsActive = true },
                new ListItem { ListName = "sources_doc_lie", Code = "2", ValueFr = "Direction", ValueAr = "مديرية", DisplayOrder = 2, IsActive = true },
                new ListItem { ListName = "sources_doc_lie", Code = "3", ValueFr = "Service", ValueAr = "مصلحة", DisplayOrder = 3, IsActive = true },
                new ListItem { ListName = "sources_doc_lie", Code = "4", ValueFr = "Autre", ValueAr = "أخرى", DisplayOrder = 4, IsActive = true }
            );
            context.SaveChanges();
            Console.WriteLine("List items seedés avec succès.");
        }

        // Seed equipment
        if (!context.Equipment.Any())
        {
            context.Equipment.AddRange(
                new Equipment { Serial = "PC-001", Code = "Ordinateur Dell OptiPlex 7080", Type = "Ordinateur", Etat = "Bon état", Service = "Cellule informatique", EstCharge = true },
                new Equipment { Serial = "PC-002", Code = "Ordinateur HP EliteBook 840 G7", Type = "Ordinateur", Etat = "Neuf", Service = "Bureau d'ordre", EstCharge = true },
                new Equipment { Serial = "PC-003", Code = "Ordinateur Lenovo ThinkCentre M720q", Type = "Ordinateur", Etat = "Bon état", Service = "Greffe", EstCharge = true },
                new Equipment { Serial = "PC-004", Code = "Ordinateur Dell Latitude 5420", Type = "Ordinateur", Etat = "À réparer", Service = "Direction", EstCharge = true }
            );
            context.SaveChanges();
            Console.WriteLine("Équipements seedés avec succès.");
        }

        // Seed greffier user
        context.ChangeTracker.Clear();
        var greffier = context.Utilisateurs.FirstOrDefault(u => u.Login == "greffier");
        if (greffier == null)
        {
            context.Utilisateurs.Add(new Utilisateur
            {
                Login = "greffier",
                PasswordHash = "greffier123",
                Nom = "Agent Greffe",
                Role = "Greffier",
                Service = "Greffe"
            });
            context.SaveChanges();
        }

        // Seed enregistrement user
        var enreg = context.Utilisateurs.FirstOrDefault(u => u.Login == "enreg");
        if (enreg == null)
        {
            context.Utilisateurs.Add(new Utilisateur
            {
                Login = "enreg",
                PasswordHash = "enreg123",
                Nom = "Agent Enregistrement",
                Role = "Enregistrement",
                Service = "Bureau de Gestion des Dossiers Judiciaires"
            });
            context.SaveChanges();
        }

        // === UN COMPTE PAR SERVICE (tous les services de SERVICE_GROUPS) ===
        context.ChangeTracker.Clear();
        var serviceUsers = new[]
        {
            // Services indépendants
            new { Login = "bureauordre", Pass = "bureauordre123", Nom = "Agent Bureau d'Ordre", Role = "BureauOrdre", Service = "Bureau d'ordre et bureau administratif" },
            new { Login = "fathmilafat", Pass = "fathmilafat123", Nom = "Agent Fath M'lafat", Role = "OuvertureDossier", Service = "Bureau de Gestion des Dossiers Judiciaires" },
            new { Login = "kitabakhasa", Pass = "kitaba123", Nom = "Agent Kitaba Khasa", Role = "KitabaKhasa", Service = "KitabaKhasa" },
            // JalsatWaIjra2at et sous-services
            new { Login = "jalsat", Pass = "jalsat123", Nom = "Agent Jalsat", Role = "Jalsat", Service = "JalsatWaIjra2at" },
            new { Login = "ijra2baht", Pass = "ijra2baht123", Nom = "Agent Recherche", Role = "Ijra2Baht", Service = "Ijra2Baht" },
            new { Login = "mofawid", Pass = "mofawid123", Nom = "Agent Commissaire Royal", Role = "MofawidMalaki", Service = "MofawidMalaki" },
            new { Login = "khibra", Pass = "khibra123", Nom = "Agent Expertise", Role = "Khibra", Service = "Khibra" },
            new { Login = "mustachar", Pass = "mustachar123", Nom = "Agent Conseiller Rapporteur", Role = "MustacharMoqarir", Service = "MustacharMoqarir" },
            // TaslimNusakh et sous-services
            new { Login = "taslim", Pass = "taslim123", Nom = "Agent Taslim", Role = "Taslim", Service = "TaslimNusakh" },
            new { Login = "tabligh", Pass = "tabligh123", Nom = "Agent Tabligh", Role = "Tabligh", Service = "Tabligh" },
            new { Login = "tasfiya", Pass = "tasfiya123", Nom = "Agent Tasfiya", Role = "TasfiyatSawa2ir", Service = "TasfiyatSawa2ir" },
            new { Login = "notification", Pass = "notif123", Nom = "Agent Notification", Role = "Notification", Service = "Bureau de Notification" },
            new { Login = "archive", Pass = "archive123", Nom = "Agent Archive", Role = "Archive", Service = "Archive" },
            // Autres services
            new { Login = "expertise", Pass = "expertise123", Nom = "Agent Bureau Expertise", Role = "Expertise", Service = "BureauExpertise" },
            new { Login = "informatique", Pass = "info123", Nom = "Agent Informatique", Role = "Informatique", Service = "CelluleInformatique" },
            new { Login = "finances", Pass = "finances123", Nom = "Agent Finances", Role = "Finances", Service = "GestionFinanciere" },
            new { Login = "caisse", Pass = "caisse123", Nom = "Agent Caisse", Role = "Caisse", Service = "CaisseTribunal" },
            new { Login = "recouvrement", Pass = "recouv123", Nom = "Agent Recouvrement", Role = "Recouvrement", Service = "BureauRecouvrement" },
            new { Login = "procedures", Pass = "procedures123", Nom = "Agent Procédures", Role = "Procedures", Service = "ProcduresCommissaireRoyal" },
            new { Login = "pourvois", Pass = "pourvois123", Nom = "Agent Pourvois", Role = "Pourvois", Service = "GestionPourvoisCassation" },
            new { Login = "remisecopie", Pass = "remise123", Nom = "Agent Remise Copie", Role = "RemiseCopie", Service = "RemiseCopieJugement" },
            new { Login = "stats", Pass = "stats123", Nom = "Agent Statistiques", Role = "Stats", Service = "EfficaciteJudiciaire" },
            new { Login = "directeur", Pass = "directeur123", Nom = "Directeur Général", Role = "Directeur", Service = "Direction" },
            new { Login = "consultant", Pass = "consult123", Nom = "Consultant", Role = "Consultant", Service = "Direction" }
        };

        foreach (var u in serviceUsers)
        {
            if (!context.Utilisateurs.Any(x => x.Login == u.Login))
            {
                context.Utilisateurs.Add(new Utilisateur
                {
                    Login = u.Login,
                    PasswordHash = u.Pass,
                    Nom = u.Nom,
                    Role = u.Role,
                    Service = u.Service
                });
            }
        }
        context.SaveChanges();
        Console.WriteLine("Utilisateurs par service seedés avec succès.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erreur seed: {ex.Message}");
    }
}

app.Run();