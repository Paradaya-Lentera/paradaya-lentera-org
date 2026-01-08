using paradaya_lentera.Models.Entities;
using paradaya_lentera.Data;
using Microsoft.EntityFrameworkCore;

namespace paradaya_lentera.Services.Local
{
    public class BookService(ApplicationDbContext context) : IBookService
    {
        public async Task<List<Book>> GetAllBooksAsync()
        {
            return await context.Books.ToListAsync();
        }

        public async Task<Book?> GetBookByIdAsync(int id)
        {
            return await context.Books.FindAsync(id);
        }

        public async Task<Book> AddBookAsync(Book book)
        {
            context.Books.Add(book);
            await context.SaveChangesAsync();
            return book;
        }

        public async Task UpdateBookAsync(Book book)
        {
            context.Books.Update(book);
            await context.SaveChangesAsync();
        }

        public async Task DeleteBookAsync(int id)
        {
            var book = await GetBookByIdAsync(id);
            if (book != null)
            {
                context.Books.Remove(book);
                await context.SaveChangesAsync();
            }
        }

        public async Task<Book?> GetByIsbnAsync(string isbn)
        {
            return await context.Books.FirstOrDefaultAsync(b => b.Isbn == isbn);
        }
    }
}
