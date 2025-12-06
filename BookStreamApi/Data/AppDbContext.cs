// Data/AppDbContext.cs
using BookStreamApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStreamApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Book> Books { get; set; }
}