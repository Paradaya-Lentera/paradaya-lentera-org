using paradaya_lentera.Models.External.OpenLibrary;

namespace paradaya_lentera.Services.External
{
    public interface IOpenLibraryService
    {
        Task<OpenLibrarySearchResponse?> SearchBooksAsync(string query, int limit = 50);
        Task<OpenLibraryDoc?> GetBookByIsbnAsync(string isbn);
        Task<OpenLibraryDoc?> GetBookByKeyAsync(string key);
        Task<OpenLibraryWork?> GetWorkAsync(string workKey);
        Task<OpenLibraryRating?> GetWorkRatingAsync(string workKey);
    }
}