using Microsoft.EntityFrameworkCore;
using WebApplication1.Models; 

namespace WebApplication1.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }


        public DbSet<WebApplication1.Models.Document> Documents { get; set; }
        public DbSet<CourrierAdministratif> CourriersAdministratifs { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<DossierJuridique> DossiersJuridiques { get; set; }
        public DbSet<Utilisateur> Utilisateurs { get; set; }
        public DbSet<ActionJuridique> ActionsJuridiques { get; set; }
        public DbSet<CourrierSortant> CourriersSortants { get; set; }
        public DbSet<ServiceInfo> Services { get; set; }
        public DbSet<Equipment> Equipment { get; set; }
        public DbSet<ListItem> ListItems { get; set; }
        public DbSet<Substitute> Substitutes { get; set; }
        public DbSet<Retrait> Retraits { get; set; }

    }

}