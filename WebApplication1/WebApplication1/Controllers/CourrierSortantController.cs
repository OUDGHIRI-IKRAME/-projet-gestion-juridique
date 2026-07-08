using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using WebApplication1.Data;
using WebApplication1.Models;
using WebApplication1.DTO;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CourrierSortantController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CourrierSortantController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] SortantDto dto)
        {
            if (dto == null)
                return BadRequest(new { error = "Données invalides" });

            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var user = userId != null ? await _context.Utilisateurs.FindAsync(int.Parse(userId)) : null;
                var creatorService = user?.Service ?? "BureauOrdre";
                ServiceTribunal creatorServiceEnum;
                if (!Enum.TryParse<ServiceTribunal>(creatorService, true, out creatorServiceEnum))
                    creatorServiceEnum = ServiceTribunal.BureauOrdre;

                var sortant = new CourrierSortant
                {
                    NumeroReference = dto.Reference ?? "REF-" + DateTime.Now.Ticks.ToString(),
                    Sujet = dto.Objet ?? "Sans objet",
                    Objet = dto.Objet ?? "Sans objet",
                    DateCreation = DateTime.Now,
                    ServiceActuel = creatorServiceEnum,
                    StatutActuel = StatutDossier.Nouveau,
                    NumeroBureauOrdre = dto.Reference ?? "BO-" + DateTime.Now.Ticks.ToString(),
                    DestinataireExterne = dto.Destinataire,
                    TypeSortant = dto.TypeSortant ?? "normal",
                    DateEnvoi = dto.DateEnvoi ?? DateTime.Now,
                    NumeroEnvoi = dto.NumeroEnvoi ?? dto.Reference,
                    TribunalOrigine = dto.TribunalOrigine,
                    TribunalDestination = dto.TribunalDestination
                };

                _context.CourriersSortants.Add(sortant);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Courrier sortant enregistré avec succès !",
                    id = sortant.Id,
                    sortant
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Erreur interne", detail = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sortants = await _context.CourriersSortants
                .Where(c => !c.EstSupprime)
                .Select(c => new {
                    c.Id,
                    c.NumeroReference,
                    c.NumeroEnvoi,
                    c.Objet,
                    c.Sujet,
                    c.DateCreation,
                    c.ServiceActuel,
                    c.StatutActuel,
                    c.DestinataireExterne,
                    c.TypeSortant,
                    c.DateEnvoi,
                    c.TribunalOrigine,
                    c.TribunalDestination,
                    c.FilePath,
                    DernierTransfert = c.Transactions
                        .OrderByDescending(t => t.DateTransaction)
                        .Select(t => (DateTime?)t.DateTransaction)
                        .FirstOrDefault() ?? c.DateCreation
                })
                .OrderByDescending(c => c.DateCreation)
                .ToListAsync();
            return Ok(sortants);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var sortant = await _context.CourriersSortants
                .FirstOrDefaultAsync(c => c.Id == id);
            if (sortant == null)
                return NotFound(new { error = "Courrier sortant non trouvé" });
            return Ok(sortant);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStatut(int id, [FromBody] UpdateStatutDto dto)
        {
            try
            {
                var sortant = await _context.CourriersSortants.FindAsync(id);
                if (sortant == null)
                    return NotFound(new { error = "Courrier sortant non trouvé" });

                // Mapper le statut reçu (string) vers l'enum StatutDossier
                switch (dto.Statut)
                {
                    case "Brouillon":
                        sortant.StatutActuel = StatutDossier.Nouveau;
                        break;
                    case "EnAttente":
                        sortant.StatutActuel = StatutDossier.EnCours;
                        break;
                    case "Envoye":
                        sortant.StatutActuel = StatutDossier.Cloture;
                        break;
                    case "Annule":
                        sortant.StatutActuel = StatutDossier.Archive;
                        break;
                    default:
                        return BadRequest(new { error = "Statut invalide" });
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Statut mis à jour avec succès" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Erreur interne", detail = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var sortant = await _context.CourriersSortants.FindAsync(id);
            if (sortant == null)
                return NotFound(new { error = "Courrier sortant non trouvé" });

            sortant.EstSupprime = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Courrier sortant supprimé (suppression logique)" });
        }
        public class UpdateStatutDto
        {
            public string Statut { get; set; }
        }



    }
}