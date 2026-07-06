using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourrierJuridiqueController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CourrierJuridiqueController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/CourrierJuridique
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var user = userId != null ? await _context.Utilisateurs.FindAsync(int.Parse(userId)) : null;
            var userService = user?.Service;

            var query = _context.DossiersJuridiques.Where(d => !d.EstSupprime).AsQueryable();

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

            var juridiques = await query
                .Select(c => new {
                    c.Id,
                    c.NumeroReference,
                    c.Demandeur,
                    c.Objet,
                    c.Sujet,
                    c.DateCreation,
                    c.ServiceActuel,
                    c.StatutActuel,
                    DernierTransfert = c.Transactions
                        .OrderByDescending(t => t.DateTransaction)
                        .Select(t => (System.DateTime?)t.DateTransaction)
                        .FirstOrDefault() ?? c.DateCreation
                })
                .OrderByDescending(c => c.DateCreation)
                .ToListAsync();
            return Ok(juridiques);
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
                _ => ServiceTribunal.BureauOrdre
            };
        }

        // GET: api/CourrierJuridique/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var juridique = await _context.DossiersJuridiques.FindAsync(id);
            if (juridique == null)
                return NotFound(new { message = "Courrier non trouvé" });
            return Ok(juridique);
        }

        // POST: api/CourrierJuridique
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Post([FromBody] CreateDossierJuridiqueDto dto)
        {
            if (dto == null)
                return BadRequest(new { error = "Données invalides" });

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var user = userId != null ? await _context.Utilisateurs.FindAsync(int.Parse(userId)) : null;
            var creatorServiceEnum = GetServiceEnumForFilter(user?.Service ?? "BureauOrdre");

            var juridique = new DossierJuridique
            {
                NumeroReference = dto.Reference ?? "",
                Sujet = dto.Objet ?? "",
                Objet = dto.Objet ?? "",
                NumeroBureauOrdre = dto.NumeroBureauOrdre ?? "",
                NumeroDossierJuridique = dto.NumeroDossierAppel,
                TypeCircuit = dto.TypeCircuit,
                MotifException = dto.MotifException,
                Demandeur = dto.Demandeur ?? "",
                DateEntree = DateTime.Now,
                EtapeJalsatActuelle = dto.EtapeJalsatActuelle ?? "ijra2_baht",
                EtatGlobal = dto.EtatGlobal ?? "En cours",
                Circuit = dto.Circuit,
                EtapeService = dto.EtapeService,
                JalsatTransaction = dto.JalsatTransaction,
                TaslimTransaction = dto.TaslimTransaction,
                AutoriteRetrait = dto.AutoriteRetrait,
                ServiceActuel = creatorServiceEnum,
                StatutActuel = StatutDossier.Nouveau,
                DateCreation = DateTime.Now
            };

            _context.DossiersJuridiques.Add(juridique);
            await _context.SaveChangesAsync();

            if (creatorServiceEnum != ServiceTribunal.OuvertureDossier)
            {
                var transaction = new Transaction
                {
                    DocumentId = juridique.Id,
                    ServiceOrigine = creatorServiceEnum,
                    ServiceDestination = ServiceTribunal.OuvertureDossier,
                    Statut = StatutTransaction.Accepte,
                    Remarques = "Créé et transféré",
                    DateTransaction = DateTime.Now
                };
                _context.Transactions.Add(transaction);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(Get), new { id = juridique.Id }, new { message = "Dossier juridique créé avec succès", id = juridique.Id });
        }

        // PUT: api/CourrierJuridique/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] CreateDossierJuridiqueDto dto)
        {
            var juridique = await _context.DossiersJuridiques.FindAsync(id);
            if (juridique == null)
                return NotFound(new { message = "Courrier non trouvé" });

            juridique.NumeroReference = dto.Reference ?? juridique.NumeroReference;
            juridique.Sujet = dto.Objet ?? juridique.Sujet;
            juridique.Objet = dto.Objet ?? juridique.Objet;
            juridique.NumeroBureauOrdre = dto.NumeroBureauOrdre ?? juridique.NumeroBureauOrdre;
            juridique.NumeroDossierJuridique = dto.NumeroDossierAppel ?? juridique.NumeroDossierJuridique;
            juridique.TypeCircuit = dto.TypeCircuit ?? juridique.TypeCircuit;
            juridique.MotifException = dto.MotifException ?? juridique.MotifException;
            juridique.Demandeur = dto.Demandeur ?? juridique.Demandeur;
            juridique.EtapeJalsatActuelle = dto.EtapeJalsatActuelle ?? juridique.EtapeJalsatActuelle;
            juridique.EtatGlobal = dto.EtatGlobal ?? juridique.EtatGlobal;
            juridique.Circuit = dto.Circuit ?? juridique.Circuit;
            juridique.EtapeService = dto.EtapeService;
            juridique.JalsatTransaction = dto.JalsatTransaction ?? juridique.JalsatTransaction;
            juridique.TaslimTransaction = dto.TaslimTransaction ?? juridique.TaslimTransaction;
            juridique.AutoriteRetrait = dto.AutoriteRetrait ?? juridique.AutoriteRetrait;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Dossier juridique mis à jour" });
        }

        // DELETE: api/CourrierJuridique/{id} (suppression logique)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var juridique = await _context.DossiersJuridiques.FindAsync(id);
            if (juridique == null)
                return NotFound(new { message = "Courrier non trouvé" });

            juridique.EstSupprime = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Courrier supprimé avec succès" });
        }
    }

    public class CreateDossierJuridiqueDto
    {
        public string? Reference { get; set; }
        public string? Objet { get; set; }
        public string? Provenance { get; set; }
        public string? Circuit { get; set; }
        public string? TypeCircuit { get; set; }
        public string? MotifException { get; set; }
        public string? JalsatTransaction { get; set; }
        public string? TaslimTransaction { get; set; }
        public string? AutoriteRetrait { get; set; }
        public int EtapeService { get; set; }
        public string? NumeroDossierAppel { get; set; }
        public string? NumeroBureauOrdre { get; set; }
        public string? Demandeur { get; set; }
        public string? EtatGlobal { get; set; }
        public string? EtapeJalsatActuelle { get; set; }
        public string? TypeProcedure { get; set; }
        public string? NumCourAppel { get; set; }
        public string? ConseillerRapporteur { get; set; }
        public string? DateAudience { get; set; }
    }
}