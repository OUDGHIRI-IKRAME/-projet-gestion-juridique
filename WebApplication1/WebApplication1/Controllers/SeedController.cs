using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SeedController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("user")]
        public async Task<IActionResult> CreateTestUser()
        {
            // Vérifier si l'utilisateur "admin" existe déjà
            var existing = await _context.Utilisateurs.FirstOrDefaultAsync(u => u.Login == "admin");
            if (existing != null)
                return Ok(new { message = "L'utilisateur admin existe déjà. Essayez de vous connecter avec admin/admin123" });

            // Créer un nouvel utilisateur
            var user = new Utilisateur
            {
                Login = "admin",
                PasswordHash = "admin123", //  pour le test
                Nom = "Administrateur",
                Role = "Admin",
                Service = "Direction"
            };

            _context.Utilisateurs.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Utilisateur admin créé avec succès ! Login: admin, Mot de passe: admin123" });
        }
    }
}