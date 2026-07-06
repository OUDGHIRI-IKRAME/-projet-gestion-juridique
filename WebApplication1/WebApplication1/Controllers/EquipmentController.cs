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
    public class EquipmentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EquipmentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _context.Equipment
                .OrderByDescending(e => e.DateCreation)
                .ToListAsync();
            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.Equipment.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Équipement non trouvé" });
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Equipment dto)
        {
            if (dto == null)
                return BadRequest(new { error = "Données invalides" });

            var exists = await _context.Equipment.AnyAsync(e => e.Serial == dto.Serial);
            if (exists)
                return Conflict(new { error = "Ce numéro de série existe déjà" });

            dto.DateCreation = DateTime.Now;
            _context.Equipment.Add(dto);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Équipement créé avec succès", id = dto.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Equipment dto)
        {
            var item = await _context.Equipment.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Équipement non trouvé" });

            item.Serial = dto.Serial ?? item.Serial;
            item.Code = dto.Code ?? item.Code;
            item.Type = dto.Type ?? item.Type;
            item.Etat = dto.Etat ?? item.Etat;
            item.Service = dto.Service ?? item.Service;
            item.EstCharge = dto.EstCharge;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Équipement modifié avec succès" });
        }

        [HttpPut("{id}/toggle-charge")]
        public async Task<IActionResult> ToggleCharge(int id)
        {
            var item = await _context.Equipment.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Équipement non trouvé" });

            item.EstCharge = !item.EstCharge;
            item.DateDechargement = item.EstCharge ? null : DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = item.EstCharge ? "Équipement chargé" : "Équipement déchargé" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Equipment.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Équipement non trouvé" });

            _context.Equipment.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Équipement supprimé avec succès" });
        }
    }
}
