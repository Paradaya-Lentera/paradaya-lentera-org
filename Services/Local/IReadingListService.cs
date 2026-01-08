using paradaya_lentera.Models.Entities;

namespace paradaya_lentera.Services.Local
{
    public interface IReadingListService
    {
        Task<bool> AddToReadingListAsync(int userId, int bookId);
        Task<bool> RemoveFromReadingListAsync(int readingListId);
        Task<bool> RemoveFromReadingListAsync(int readingListId, int userId);
        Task<bool> IsInReadingListAsync(int userId, int bookId);
        Task<List<ReadingList>> GetUserReadingListAsync(int userId);
        Task<bool?> ToggleFavoriteAsync(int readingListId);
        Task<bool?> ToggleFavoriteAsync(int readingListId, int userId);
        Task<bool?> ToggleReadAsync(int readingListId);
        Task<bool?> ToggleReadAsync(int readingListId, int userId);
        Task<ReadingList?> GetByUserAndBookAsync(int userId, int bookId);
    }
}
