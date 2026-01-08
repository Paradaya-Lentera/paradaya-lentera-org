using Microsoft.EntityFrameworkCore;
using paradaya_lentera.Models.Entities;
using paradaya_lentera.Services.Local;

namespace paradaya_lentera.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(
            ApplicationDbContext context, 
            IUserService userService,
            ILogger? logger = null)
        {
            await context.Database.EnsureCreatedAsync();

            if (!await context.Users.AnyAsync())
            {
                try
                {
                    await userService.CreateUserAsync(
                        "Zaedan", 
                        "zaedan@lentera.com", 
                        "password123"
                    );
                    logger?.LogInformation("Demo users created successfully. Demo User: zaedan@lentera.com / password123");
                }
                catch (Exception ex)
                {
                    logger?.LogError(ex, "Error creating demo users");
                }
            }

            if (!await context.Books.AnyAsync())
            {
                try
                {
                    var sampleBooks = new List<Book>
                    {
                        new()
                        {
                            Title = "The Lord of the Rings",
                            Author = "J.R.R. Tolkien",
                            Publisher = "Allen & Unwin",
                            Category = "Fantasy",
                            Description = "Epic fantasy novel about the quest to destroy the One Ring.",
                            PublishedYear = 1954,
                            PageCount = 1216,
                            Isbn = "9780544003415",
                            Source = "Manual",
                            Thumbnail = "https://covers.openlibrary.org/b/isbn/9780544003415-M.jpg"
                        },
                        new()
                        {
                            Title = "Harry Potter and the Philosopher's Stone",
                            Author = "J.K. Rowling",
                            Publisher = "Bloomsbury",
                            Category = "Fantasy",
                            Description = "A young wizard's journey begins at Hogwarts School of Witchcraft and Wizardry.",
                            PublishedYear = 1997,
                            PageCount = 223,
                            Isbn = "9780747532699",
                            Source = "Manual"
                        },
                        new()
                        {
                            Title = "To Kill a Mockingbird",
                            Author = "Harper Lee",
                            Publisher = "J.B. Lippincott & Co.",
                            Category = "Fiction",
                            PublishedYear = 1960,
                            PageCount = 281,
                            Isbn = "9780061120084",
                            Source = "Manual"
                        },
                        new()
                        {
                            Title = "1984",
                            Author = "George Orwell",
                            Category = "Dystopian Fiction",
                            PublishedYear = 1949,
                            Source = "Manual"
                        },
                        new()
                        {
                            Title = "Laskar Pelangi",
                            Author = "Andrea Hirata",
                            Publisher = "Bentang Pustaka",
                            Category = "Indonesian Literature",
                            Description = "Novel tentang perjuangan anak-anak Belitung untuk mendapatkan pendidikan.",
                            PublishedYear = 2005,
                            PageCount = 529,
                            Source = "Manual"
                        }
                    };

                    context.Books.AddRange(sampleBooks);
                    await context.SaveChangesAsync();

                    logger?.LogInformation("Sample books created successfully. Count: {Count}", sampleBooks.Count);
                }
                catch (Exception ex)
                {
                    logger?.LogError(ex, "Error creating sample books");
                }
            }
        }
    }
}
