using paradaya_lentera.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace paradaya_lentera.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<Book> Books { get; set; }
    public DbSet<ReadingList> ReadingLists { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure User
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Configure ReadingList relationships
        modelBuilder.Entity<ReadingList>()
            .HasOne(rl => rl.User)
            .WithMany(u => u.ReadingLists)
            .HasForeignKey(rl => rl.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Book>()
            .HasIndex(b => b.Isbn)
            .IsUnique();
        
        modelBuilder.Entity<ReadingList>()
            .HasOne(rl => rl.Book)
            .WithMany(b => b.ReadingLists)
            .HasForeignKey(rl => rl.BookId)
            .OnDelete(DeleteBehavior.Cascade);

        // Ensure unique constraint for User-Book combination
        modelBuilder.Entity<ReadingList>()
            .HasIndex(rl => new { rl.UserId, rl.BookId })
            .IsUnique();

        base.OnModelCreating(modelBuilder);
    }
}