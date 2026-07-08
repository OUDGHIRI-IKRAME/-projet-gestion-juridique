using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransferController : ControllerBase
    {
        private readonly AppDbContext _context;

        private static readonly Dictionary<ServiceTribunal, List<ServiceTribunal>> ParentChildren = new()
        {
            { ServiceTribunal.JalsatWaIjra2at, new() { ServiceTribunal.Ijra2Baht, ServiceTribunal.MofawidMalaki, ServiceTribunal.Khibra, ServiceTribunal.MustacharMoqarir } },
            { ServiceTribunal.TaslimNusakh, new() { ServiceTribunal.Tabligh, ServiceTribunal.TasfiyatSawa2ir, ServiceTribunal.Archive } },
        };

        public TransferController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Transfer([FromBody] TransferDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var user = await _context.Utilisateurs.FindAsync(int.Parse(userId));
            if (user == null) return Unauthorized();

            Document document;
            switch (dto.DocumentType)
            {
                case "entrant-admin":
                    document = await _context.CourriersAdministratifs.FindAsync(dto.DocumentId);
                    break;
                case "entrant-juridique":
                    document = await _context.DossiersJuridiques.FindAsync(dto.DocumentId);
                    break;
                case "sortant-normal":
                case "sortant-demande":
                    document = await _context.CourriersSortants.FindAsync(dto.DocumentId);
                    break;
                default:
                    return BadRequest(new { error = "Type de document invalide" });
            }

            if (document == null)
                return NotFound(new { error = "Document non trouvé" });

            var serviceOrigine = document.ServiceActuel;
            var serviceDestination = GetServiceEnum(dto.ServiceDestination);

            var destinations = new List<ServiceTribunal> { serviceDestination };
            if (ParentChildren.TryGetValue(serviceDestination, out var children))
            {
                destinations.AddRange(children);
            }

            var transactionIds = new List<int>();

            foreach (var dest in destinations)
            {
                var transaction = new Transaction
                {
                    DocumentId = document.Id,
                    ServiceOrigine = serviceOrigine,
                    ServiceDestination = dest,
                    DateTransaction = DateTime.Now,
                    Remarques = dto.Message,
                    UtilisateurId = userId,
                    Statut = StatutTransaction.EnAttente,
                    DoitRevenir = dto.DoitRevenir
                };
                _context.Transactions.Add(transaction);
                await _context.SaveChangesAsync();
                transactionIds.Add(transaction.Id);
            }

            document.ServiceActuel = serviceDestination;
            document.StatutActuel = StatutDossier.EnInstance;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Transfert effectué avec succès",
                transactionIds,
                destinations = destinations.Select(d => d.ToString()).ToList()
            });
        }

        private static ServiceTribunal GetServiceEnum(string serviceName)
        {
            if (Enum.TryParse<ServiceTribunal>(serviceName, true, out var result))
                return result;

            return serviceName switch
            {
                "Bureau d'ordre et bureau administratif" => ServiceTribunal.BureauOrdre,
                "Bureau de Gestion des Dossiers Judiciaires" => ServiceTribunal.OuvertureDossier,
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

    public class TransferDto
    {
        public int DocumentId { get; set; }
        public string DocumentType { get; set; }
        public string ServiceDestination { get; set; }
        public string? Message { get; set; }
        public bool DoitRevenir { get; set; }
    }
}
