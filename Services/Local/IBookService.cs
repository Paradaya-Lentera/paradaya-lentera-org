using paradaya_lentera.Models.Entities;

namespace paradaya_lentera.Services.Local
{
    public interface IBookService
    {
        Task<List<Book>> GetAllBooksAsync();
        Task<Book?> GetBookByIdAsync(int id);
        Task<Book> AddBookAsync(Book book);
        Task UpdateBookAsync(Book book);
        Task DeleteBookAsync(int id);
        Task<Book?> GetByIsbnAsync(string isbn);
    }
}
