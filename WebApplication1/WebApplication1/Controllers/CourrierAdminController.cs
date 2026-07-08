using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CourrierAdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CourrierAdminController(AppDbContext context)
        {
            _context = context;
        }

        // ========== 1. LISTER LES COURRIERS ADMIN ==========
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourrierAdminListDto>>> GetAll()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var user = userId != null ? await _context.Utilisateurs.FindAsync(int.Parse(userId)) : null;
            var userService = user?.Service;

            var query = _context.CourriersAdministratifs.Where(c => !c.EstSupprime).AsQueryable();

            // If user has a specific service, show docs in their service OR docs they sent out
            // Admin, Greffier, Directeur, Consultant see everything
            var role = user?.Role ?? "";
            var isAdminLike = role == "Admin" || role == "admin" || role == "Greffier" || role == "Directeur" || role == "Consultant";
            if (!string.IsNullOrEmpty(userService) && !isAdminLike)
            {
                var userServiceEnum = GetServiceEnumForFilter(userService);
                var sentDocIds = await _context.Transactions
                    .Where(t => t.ServiceOrigine == userServiceEnum)
                    .Select(t => t.DocumentId)
                    .Distinct()
                    .ToListAsync();

                query = query.Where(c => c.ServiceActuel == userServiceEnum || sentDocIds.Contains(c.Id));
            }

            var courriers = await query
                .Include(c => c.Transactions)
                .OrderByDescending(c => c.DateCreation)
                .Select(c => new CourrierAdminListDto
                {
                    Id = c.Id,
                    NumeroOrdre = c.NumeroOrdre,
                    Expediteur = c.Expediteur,
                    Objet = c.Objet,
                    Sujet = c.Sujet,
                    DateCreation = c.DateCreation,
                    ServiceActuel = c.ServiceActuel.ToString(),
                    StatutActuel = c.StatutActuel.ToString(),
                    FilePath = c.FilePath,
                    Source = c.Expediteur,
                    NumeroReference = c.NumeroReference,
                    DernierTransfert = c.Transactions
                        .OrderByDescending(t => t.DateTransaction)
                        .Select(t => (DateTime?)t.DateTransaction)
                        .FirstOrDefault() ?? c.DateCreation
                })
                .ToListAsync();

            return Ok(courriers);
        }

        // ========== 3. CRÉER UN COURRIER ==========
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CourrierAdminDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(new { error = "Données invalides" });

                // Vérifier que le numéro d'ordre n'existe pas déjà
                var exists = await _context.CourriersAdministratifs
                    .AnyAsync(c => c.NumeroOrdre == dto.NumeroOrdre);

                if (exists)
                    return Conflict(new { error = "Ce numéro d'ordre existe déjà" });

                // ===== 1. CRÉATION DU COURRIER =====
                var courrier = new CourrierAdministratif
                {
                    NumeroOrdre = dto.NumeroOrdre,
                    Expediteur = dto.Expediteur,
                    Objet = dto.Objet,
                    DateReception = dto.DateReception ?? DateTime.Now,
                    TypeCircuit = dto.TypeCircuit ?? "standard",
                    FilePath = dto.FilePath,
                    NumeroReference = dto.NumeroReference ?? dto.NumeroOrdre,
                    Sujet = dto.Objet,
                    DateCreation = DateTime.Now,
                    ServiceActuel = ServiceTribunal.BureauOrdre,
                    StatutActuel = StatutDossier.Nouveau,
                    NumeroBureauOrdre = dto.NumeroOrdre,
                    Transmissible = dto.Transmissible
                };

                _context.CourriersAdministratifs.Add(courrier);
                await _context.SaveChangesAsync();

                // ===== 2. GESTION DU MODE DE TRAITEMENT =====
                if (dto.ModeTraitement == "archivage")
                {
                    courrier.ServiceActuel = ServiceTribunal.Archive;
                    courrier.StatutActuel = StatutDossier.Archive;

                    var transaction = new Transaction
                    {
                        DocumentId = courrier.Id,
                        ServiceOrigine = ServiceTribunal.BureauOrdre,
                        ServiceDestination = ServiceTribunal.Archive,
                        DateTransaction = DateTime.Now,
                        Remarques = "Archivage direct du courrier",
                        NomPersonneExterne = ""
                    };
                    _context.Transactions.Add(transaction);
                }
                else if (dto.ModeTraitement == "unique")
                {
                    if (string.IsNullOrEmpty(dto.ServiceDestinataire))
                        return BadRequest(new { error = "Le service destinataire est requis pour le mode 'unique'" });

                    if (!Enum.TryParse<ServiceTribunal>(dto.ServiceDestinataire, true, out var destService))
                        return BadRequest(new { error = $"Service '{dto.ServiceDestinataire}' invalide" });

                    courrier.ServiceActuel = destService;
                    courrier.StatutActuel = StatutDossier.EnCours;

                    var transaction = new Transaction
                    {
                        DocumentId = courrier.Id,
                        ServiceOrigine = ServiceTribunal.BureauOrdre,
                        ServiceDestination = destService,
                        DateTransaction = DateTime.Now,
                        Remarques = $"Transfert vers {destService}",
                        NomPersonneExterne = ""
                    };
                    _context.Transactions.Add(transaction);
                }
                else if (dto.ModeTraitement == "diffusion")
                {
                    if (dto.ServicesDiffusion == null || dto.ServicesDiffusion.Count == 0)
                        return BadRequest(new { error = "Au moins un service est requis pour la diffusion" });

                    courrier.ServiceActuel = ServiceTribunal.BureauOrdre;
                    courrier.StatutActuel = StatutDossier.EnCours;

                    foreach (var serviceName in dto.ServicesDiffusion)
                    {
                        if (!Enum.TryParse<ServiceTribunal>(serviceName, true, out var destService))
                            continue;

                        var transaction = new Transaction
                        {
                            DocumentId = courrier.Id,
                            ServiceOrigine = ServiceTribunal.BureauOrdre,
                            ServiceDestination = destService,
                            DateTransaction = DateTime.Now,
                            Remarques = $"Diffusion vers {destService}",
                            NomPersonneExterne = ""
                        };
                        _context.Transactions.Add(transaction);
                    }
                }

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = courrier.Id },
                    new { message = $"Courrier créé avec succès (Mode: {dto.ModeTraitement})", courrier });
            }
            catch (Exception ex)
            {
                // ⚠️ CAPTURER TOUTES LES ERREURS ET RENVOYER DU JSON
                return StatusCode(500, new { error = "Erreur interne du serveur", detail = ex.Message });
            }
        }
        // ========== 4. MODIFIER UN COURRIER ==========
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CourrierAdminDto dto)
        {
            var courrier = await _context.CourriersAdministratifs.FindAsync(id);
            if (courrier == null)
                return NotFound(new { message = "Courrier non trouvé" });

            // Mise à jour des champs
            courrier.NumeroOrdre = dto.NumeroOrdre;
            courrier.Expediteur = dto.Expediteur;
            courrier.Objet = dto.Objet;
            courrier.DateReception = dto.DateReception ?? courrier.DateReception;
            courrier.TypeCircuit = dto.TypeCircuit ?? courrier.TypeCircuit;
            courrier.FilePath = dto.FilePath ?? courrier.FilePath;
            courrier.NumeroReference = dto.NumeroReference ?? courrier.NumeroReference;
            courrier.Sujet = dto.Objet;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Courrier modifié avec succès", courrier });
        }

        // ========== 5. SUPPRIMER UN COURRIER (suppression logique) ==========
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var courrier = await _context.CourriersAdministratifs.FindAsync(id);
            if (courrier == null)
                return NotFound(new { message = "Courrier non trouvé" });

            courrier.EstSupprime = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Courrier supprimé avec succès" });
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<CourrierAdminListDto>> GetById(int id)
        {
            var courrier = await _context.CourriersAdministratifs
                .Where(c => c.Id == id)
                .Select(c => new CourrierAdminListDto
                {
                    Id = c.Id,
                    NumeroOrdre = c.NumeroOrdre,
                    Expediteur = c.Expediteur,
                    Objet = c.Objet,
                    Sujet = c.Sujet,
                    DateCreation = c.DateCreation,
                    ServiceActuel = c.ServiceActuel.ToString(),
                    StatutActuel = c.StatutActuel.ToString(),
                    FilePath = c.FilePath,
                    Source = c.Expediteur,
                    NumeroReference = c.NumeroReference
                })
                .FirstOrDefaultAsync();

            if (courrier == null)
                return NotFound(new { message = "Courrier non trouvé" });

            return Ok(courrier);
        }

        private static ServiceTribunal GetServiceEnumForFilter(string serviceName)
        {
            if (Enum.TryParse<ServiceTribunal>(serviceName, true, out var result))
                return result;

            return serviceName switch
            {
                "Bureau d'ordre et bureau administratif" => ServiceTribunal.BureauOrdre,
                "Bureau de Gestion des Dossiers Judiciaires" => ServiceTribunal.OuvertureDossier,
                "KitabaKhasa" => ServiceTribunal.KitabaKhasa,
                "JalsatWaIjra2at" => ServiceTribunal.JalsatWaIjra2at,
                "TaslimNusakh" => ServiceTribunal.TaslimNusakh,
                "Bureau de Notification" => ServiceTribunal.BureauNotification,
                "Archive" => ServiceTribunal.Archive,
                "Bureau d'expertise" => ServiceTribunal.BureauExpertise,
                "Bureau des procédures du commissaire royal" => ServiceTribunal.ProcduresCommissaireRoyal,
                "Bureau de Gestion des Pourvois en Cassation" => ServiceTribunal.GestionPourvoisCassation,
                "Remise de copie de jugement" => ServiceTribunal.RemiseCopieJugement,
                "Bureau de Recouvrement" => ServiceTribunal.BureauRecouvrement,
                "Caisse du Tribunal" => ServiceTribunal.CaisseTribunal,
                "Service de Gestion Financière" => ServiceTribunal.GestionFinanciere,
                "Bureau de l'efficacité judiciaire et des statistiques" => ServiceTribunal.EfficaciteJudiciaire,
                "Cellule informatique" => ServiceTribunal.CelluleInformatique,
                "Direction" => ServiceTribunal.Direction,
                "Greffe" => ServiceTribunal.Greffe,
                _ => ServiceTribunal.BureauOrdre
            };
        }
    }

    // ========== DTO ==========
    public class CourrierAdminListDto
    {
        public int Id { get; set; }
        public string NumeroOrdre { get; set; }
        public string? Expediteur { get; set; }
        public string Objet { get; set; }
        public string? Sujet { get; set; }
        public DateTime DateCreation { get; set; }
        public string? ServiceActuel { get; set; }
        public string? StatutActuel { get; set; }
        public string? FilePath { get; set; }
        public string? Source { get; set; }
        public string? NumeroReference { get; set; }
        public DateTime DernierTransfert { get; set; }
        public bool Transmissible { get; set; } = true;
    }
    public class CourrierAdminDto
    {
        public string NumeroOrdre { get; set; }
        public string Expediteur { get; set; }
        public string Objet { get; set; }
        public DateTime? DateReception { get; set; }
        public string? TypeCircuit { get; set; }
        public string? FilePath { get; set; }
        public string? NumeroReference { get; set; }
        public bool Transmissible { get; set; } = true;

        // ===== NOUVEAUX CHAMPS POUR LES MODES =====
        public string? ModeTraitement { get; set; } // "archivage", "unique", "diffusion"
        public string? ServiceDestinataire { get; set; } // Pour "unique" (ex: "OuvertureDossier")
        public List<string>? ServicesDiffusion { get; set; } // Pour "diffusion" (ex: ["Service1", "Service2"])
    }
}