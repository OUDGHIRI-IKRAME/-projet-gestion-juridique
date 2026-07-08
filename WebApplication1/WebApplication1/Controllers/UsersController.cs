using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Utilisateurs
                .Select(u => new {
                    u.Id,
                    u.Login,
                    u.Nom,
                    u.Role,
                    u.Service
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            return Ok(new {
                user.Id,
                user.Login,
                user.Nom,
                user.Role,
                user.Service
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            if (dto == null)
                return BadRequest(new { error = "Données invalides" });

            var exists = await _context.Utilisateurs.AnyAsync(u => u.Login == dto.Login);
            if (exists)
                return Conflict(new { error = "Ce login existe déjà" });

            var user = new Utilisateur
            {
                Login = dto.Login,
                PasswordHash = dto.Password,
                Nom = dto.Nom,
                Role = dto.Role,
                Service = dto.Service
            };

            _context.Utilisateurs.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Utilisateur créé avec succès", id = user.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
        {
            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            user.Nom = dto.Nom ?? user.Nom;
            user.Login = dto.Login ?? user.Login;
            user.Role = dto.Role ?? user.Role;
            user.Service = dto.Service ?? user.Service;
            if (!string.IsNullOrEmpty(dto.Password))
                user.PasswordHash = dto.Password;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Utilisateur modifié avec succès" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            _context.Utilisateurs.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Utilisateur supprimé avec succès" });
        }
    }

    public class CreateUserDto
    {
        public string Login { get; set; }
        public string Password { get; set; }
        public string Nom { get; set; }
        public string Role { get; set; }
        public string Service { get; set; }
    }

    public class UpdateUserDto
    {
        public string? Login { get; set; }
        public string? Password { get; set; }
        public string? Nom { get; set; }
        public string? Role { get; set; }
        public string? Service { get; set; }
    }
}
