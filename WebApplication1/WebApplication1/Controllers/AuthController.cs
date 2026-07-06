using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private const string JwtKey = "CleSecretTresLonguePourLeJwtDeNotreAppJuridique2026!";

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Utilisateurs.FirstOrDefaultAsync(u => u.Login == dto.Login);

            if (user == null)
                return Unauthorized(new { message = "Identifiant ou mot de passe incorrect" });

            if (user.PasswordHash != dto.Password)
                return Unauthorized(new { message = "Identifiant ou mot de passe incorrect" });

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Nom ?? user.Login),
                new Claim(ClaimTypes.Role, user.Role ?? ""),
                new Claim("Service", user.Service ?? "")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                token = tokenString,
                user = new
                {
                    user.Id,
                    user.Login,
                    user.Nom,
                    user.Role,
                    user.Service
                }
            });
        }
    }

    public class LoginDto
    {
        public string Login { get; set; }
        public string Password { get; set; }
    }
}
