using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WorkspaceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WorkspaceController(AppDbContext context)
        {
            _context = context;
        }

        private async Task<string> GetUserNameAsync()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return "Inconnu";
            var user = await _context.Utilisateurs.FindAsync(int.Parse(userId));
            return user?.Nom ?? "Inconnu";
        }

        private async Task<string> GetUserServiceAsync()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return "";
            var user = await _context.Utilisateurs.FindAsync(int.Parse(userId));
            return user?.Service ?? "";
        }

        // ============ GET document full details ============
        [HttpGet("document/{id}")]
        public async Task<IActionResult> GetDocument(int id)
        {
            var doc = await _context.Documents
                .Include(d => d.Transactions.OrderByDescending(t => t.DateTransaction).Take(20))
                .FirstOrDefaultAsync(d => d.Id == id);

            if (doc == null) return NotFound(new { error = "Document non trouvé" });

            object details = doc switch
            {
                CourrierAdministratif ca => new
                {
                    type = "entrant-admin",
                    ca.Id, ca.NumeroOrdre, ca.NumeroReference, ca.Sujet, ca.Objet,
                    ca.Expediteur, ca.DateCreation, ca.DateReception,
                    ca.TypeCircuit, ca.ServiceActuel, ca.StatutActuel, ca.FilePath,
                    ca.NumeroBureauOrdre, ca.EstSupprime,
                    transactions = ca.Transactions.Select(t => new
                    {
                        t.Id, t.ServiceOrigine, t.ServiceDestination,
                        t.DateTransaction, t.Remarques, t.Statut,
                        t.Commentaire, t.MotifRefus, t.DoitRevenir
                    })
                },
                DossierJuridique dj => new
                {
                    type = "entrant-juridique",
                    dj.Id, dj.NumeroReference, dj.NumeroDossierJuridique,
                    dj.Sujet, dj.Objet, dj.Demandeur,
                    dj.DateCreation, dj.DateEntree,
                    dj.TypeCircuit, dj.MotifException,
                    dj.ServiceActuel, dj.StatutActuel,
                    dj.FilePath,
                    dj.EtapeJalsatActuelle, dj.EtatGlobal,
                    dj.Circuit, dj.EtapeService,
                    dj.JalsatTransaction, dj.TaslimTransaction,
                    dj.AutoriteRetrait, dj.NumeroBureauOrdre, dj.EstSupprime,
                    transactions = dj.Transactions.Select(t => new
                    {
                        t.Id, t.ServiceOrigine, t.ServiceDestination,
                        t.DateTransaction, t.Remarques, t.Statut,
                        t.Commentaire, t.MotifRefus, t.DoitRevenir
                    })
                },
                CourrierSortant cs => new
                {
                    type = cs.TypeSortant == "demande" ? "sortant-demande" : "sortant-normal",
                    cs.Id, cs.NumeroReference, cs.NumeroEnvoi,
                    cs.Sujet, cs.Objet,
                    cs.DateCreation, cs.DateEnvoi,
                    cs.DestinataireExterne,
                    cs.TribunalOrigine, cs.TribunalDestination,
                    cs.ServiceActuel, cs.StatutActuel,
                    cs.FilePath,
                    cs.NumeroBureauOrdre, cs.EstSupprime,
                    transactions = cs.Transactions.Select(t => new
                    {
                        t.Id, t.ServiceOrigine, t.ServiceDestination,
                        t.DateTransaction, t.Remarques, t.Statut,
                        t.Commentaire, t.MotifRefus, t.DoitRevenir
                    })
                },
                _ => new { type = "unknown", doc.Id }
            };

            return Ok(details);
        }

        // ============ PUT update document ============
        [HttpPut("document/{id}")]
        public async Task<IActionResult> UpdateDocument(int id, [FromBody] UpdateDocumentDto dto)
        {
            var doc = await _context.Documents.FindAsync(id);
            if (doc == null) return NotFound(new { error = "Document non trouvé" });

            var userName = await GetUserNameAsync();
            var userService = await GetUserServiceAsync();
            var modifications = new List<DocumentModification>();

            switch (doc)
            {
                case CourrierAdministratif ca:
                    if (dto.NumeroOrdre != null && dto.NumeroOrdre != ca.NumeroOrdre)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "NumeroOrdre", AncienneValeur = ca.NumeroOrdre, NouvelleValeur = dto.NumeroOrdre, Utilisateur = userName, Service = userService });
                        ca.NumeroOrdre = dto.NumeroOrdre;
                    }
                    if (dto.Expediteur != null && dto.Expediteur != ca.Expediteur)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "Expediteur", AncienneValeur = ca.Expediteur, NouvelleValeur = dto.Expediteur, Utilisateur = userName, Service = userService });
                        ca.Expediteur = dto.Expediteur;
                    }
                    if (dto.Objet != null && dto.Objet != ca.Objet)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "Objet", AncienneValeur = ca.Objet, NouvelleValeur = dto.Objet, Utilisateur = userName, Service = userService });
                        ca.Objet = dto.Objet;
                    }
                    if (dto.TypeCircuit != null && dto.TypeCircuit != ca.TypeCircuit)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "TypeCircuit", AncienneValeur = ca.TypeCircuit, NouvelleValeur = dto.TypeCircuit, Utilisateur = userName, Service = userService });
                        ca.TypeCircuit = dto.TypeCircuit;
                    }
                    if (dto.Sujet != null && dto.Sujet != ca.Sujet)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "Sujet", AncienneValeur = ca.Sujet, NouvelleValeur = dto.Sujet, Utilisateur = userName, Service = userService });
                        ca.Sujet = dto.Sujet;
                    }
                    break;

                case DossierJuridique dj:
                    if (dto.Demandeur != null && dto.Demandeur != dj.Demandeur)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "Demandeur", AncienneValeur = dj.Demandeur, NouvelleValeur = dto.Demandeur, Utilisateur = userName, Service = userService });
                        dj.Demandeur = dto.Demandeur;
                    }
                    if (dto.Objet != null && dto.Objet != dj.Objet)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "Objet", AncienneValeur = dj.Objet, NouvelleValeur = dto.Objet, Utilisateur = userName, Service = userService });
                        dj.Objet = dto.Objet;
                    }
                    if (dto.EtatGlobal != null && dto.EtatGlobal != dj.EtatGlobal)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "EtatGlobal", AncienneValeur = dj.EtatGlobal, NouvelleValeur = dto.EtatGlobal, Utilisateur = userName, Service = userService });
                        dj.EtatGlobal = dto.EtatGlobal;
                    }
                    if (dto.EtapeJalsatActuelle != null && dto.EtapeJalsatActuelle != dj.EtapeJalsatActuelle)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "EtapeJalsatActuelle", AncienneValeur = dj.EtapeJalsatActuelle, NouvelleValeur = dto.EtapeJalsatActuelle, Utilisateur = userName, Service = userService });
                        dj.EtapeJalsatActuelle = dto.EtapeJalsatActuelle;
                    }
                    if (dto.Circuit != null && dto.Circuit != dj.Circuit)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "Circuit", AncienneValeur = dj.Circuit, NouvelleValeur = dto.Circuit, Utilisateur = userName, Service = userService });
                        dj.Circuit = dto.Circuit;
                    }
                    if (dto.TypeCircuit != null && dto.TypeCircuit != dj.TypeCircuit)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "TypeCircuit", AncienneValeur = dj.TypeCircuit, NouvelleValeur = dto.TypeCircuit, Utilisateur = userName, Service = userService });
                        dj.TypeCircuit = dto.TypeCircuit;
                    }
                    if (dto.MotifException != null && dto.MotifException != dj.MotifException)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "MotifException", AncienneValeur = dj.MotifException, NouvelleValeur = dto.MotifException, Utilisateur = userName, Service = userService });
                        dj.MotifException = dto.MotifException;
                    }
                    if (dto.Sujet != null && dto.Sujet != dj.Sujet)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "Sujet", AncienneValeur = dj.Sujet, NouvelleValeur = dto.Sujet, Utilisateur = userName, Service = userService });
                        dj.Sujet = dto.Sujet;
                    }
                    if (dto.JalsatTransaction != null && dto.JalsatTransaction != dj.JalsatTransaction)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "JalsatTransaction", AncienneValeur = dj.JalsatTransaction, NouvelleValeur = dto.JalsatTransaction, Utilisateur = userName, Service = userService });
                        dj.JalsatTransaction = dto.JalsatTransaction;
                    }
                    if (dto.TaslimTransaction != null && dto.TaslimTransaction != dj.TaslimTransaction)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "TaslimTransaction", AncienneValeur = dj.TaslimTransaction, NouvelleValeur = dto.TaslimTransaction, Utilisateur = userName, Service = userService });
                        dj.TaslimTransaction = dto.TaslimTransaction;
                    }
                    if (dto.AutoriteRetrait != null && dto.AutoriteRetrait != dj.AutoriteRetrait)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "AutoriteRetrait", AncienneValeur = dj.AutoriteRetrait, NouvelleValeur = dto.AutoriteRetrait, Utilisateur = userName, Service = userService });
                        dj.AutoriteRetrait = dto.AutoriteRetrait;
                    }
                    break;

                case CourrierSortant cs:
                    if (dto.Objet != null && dto.Objet != cs.Objet)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "Objet", AncienneValeur = cs.Objet, NouvelleValeur = dto.Objet, Utilisateur = userName, Service = userService });
                        cs.Objet = dto.Objet;
                    }
                    if (dto.DestinataireExterne != null && dto.DestinataireExterne != cs.DestinataireExterne)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "DestinataireExterne", AncienneValeur = cs.DestinataireExterne, NouvelleValeur = dto.DestinataireExterne, Utilisateur = userName, Service = userService });
                        cs.DestinataireExterne = dto.DestinataireExterne;
                    }
                    if (dto.TribunalOrigine != null && dto.TribunalOrigine != cs.TribunalOrigine)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "TribunalOrigine", AncienneValeur = cs.TribunalOrigine, NouvelleValeur = dto.TribunalOrigine, Utilisateur = userName, Service = userService });
                        cs.TribunalOrigine = dto.TribunalOrigine;
                    }
                    if (dto.TribunalDestination != null && dto.TribunalDestination != cs.TribunalDestination)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "TribunalDestination", AncienneValeur = cs.TribunalDestination, NouvelleValeur = dto.TribunalDestination, Utilisateur = userName, Service = userService });
                        cs.TribunalDestination = dto.TribunalDestination;
                    }
                    if (dto.Sujet != null && dto.Sujet != cs.Sujet)
                    {
                        modifications.Add(new DocumentModification { DocumentId = id, Champ = "Sujet", AncienneValeur = cs.Sujet, NouvelleValeur = dto.Sujet, Utilisateur = userName, Service = userService });
                        cs.Sujet = dto.Sujet;
                    }
                    break;
            }

            if (modifications.Count > 0)
            {
                _context.DocumentModifications.AddRange(modifications);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Document mis à jour", modifications = modifications.Count });
        }

        // ============ NOTES ============
        [HttpGet("document/{id}/notes")]
        public async Task<IActionResult> GetNotes(int id)
        {
            var notes = await _context.DocumentNotes
                .Where(n => n.DocumentId == id)
                .OrderByDescending(n => n.DateCreation)
                .Select(n => new
                {
                    n.Id, n.DocumentId, n.Contenu, n.Auteur, n.Service,
                    n.DateCreation, n.DateModification
                })
                .ToListAsync();

            return Ok(notes);
        }

        [HttpPost("document/{id}/notes")]
        public async Task<IActionResult> AddNote(int id, [FromBody] AddNoteDto dto)
        {
            var doc = await _context.Documents.FindAsync(id);
            if (doc == null) return NotFound(new { error = "Document non trouvé" });

            var note = new DocumentNote
            {
                DocumentId = id,
                Contenu = dto.Contenu,
                Auteur = await GetUserNameAsync(),
                Service = await GetUserServiceAsync(),
                DateCreation = DateTime.Now
            };

            _context.DocumentNotes.Add(note);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                note.Id, note.DocumentId, note.Contenu, note.Auteur, note.Service,
                note.DateCreation, note.DateModification
            });
        }

        [HttpPut("notes/{noteId}")]
        public async Task<IActionResult> UpdateNote(int noteId, [FromBody] AddNoteDto dto)
        {
            var note = await _context.DocumentNotes.FindAsync(noteId);
            if (note == null) return NotFound(new { error = "Note non trouvée" });

            note.Contenu = dto.Contenu;
            note.DateModification = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                note.Id, note.DocumentId, note.Contenu, note.Auteur, note.Service,
                note.DateCreation, note.DateModification
            });
        }

        [HttpDelete("notes/{noteId}")]
        public async Task<IActionResult> DeleteNote(int noteId)
        {
            var note = await _context.DocumentNotes.FindAsync(noteId);
            if (note == null) return NotFound(new { error = "Note non trouvée" });

            _context.DocumentNotes.Remove(note);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Note supprimée" });
        }

        // ============ MODIFICATIONS AUDIT ============
        [HttpGet("document/{id}/modifications")]
        public async Task<IActionResult> GetModifications(int id)
        {
            var mods = await _context.DocumentModifications
                .Where(m => m.DocumentId == id)
                .OrderByDescending(m => m.DateModification)
                .Select(m => new
                {
                    m.Id, m.DocumentId, m.Champ, m.AncienneValeur, m.NouvelleValeur,
                    m.Utilisateur, m.Service, m.DateModification
                })
                .ToListAsync();

            return Ok(mods);
        }
    }

    // ============ DTOs ============
    public class UpdateDocumentDto
    {
        public string? NumeroOrdre { get; set; }
        public string? Expediteur { get; set; }
        public string? Objet { get; set; }
        public string? Sujet { get; set; }
        public string? TypeCircuit { get; set; }
        public string? Demandeur { get; set; }
        public string? EtatGlobal { get; set; }
        public string? EtapeJalsatActuelle { get; set; }
        public string? Circuit { get; set; }
        public string? MotifException { get; set; }
        public string? JalsatTransaction { get; set; }
        public string? TaslimTransaction { get; set; }
        public string? AutoriteRetrait { get; set; }
        public string? DestinataireExterne { get; set; }
        public string? TribunalOrigine { get; set; }
        public string? TribunalDestination { get; set; }
    }

    public class AddNoteDto
    {
        public string Contenu { get; set; } = "";
    }
}
