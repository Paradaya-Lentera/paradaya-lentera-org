using paradaya_lentera.Models.External.OpenLibrary;

namespace paradaya_lentera.Services.Local
{
    public interface ICachedSearchService
    {
        Task<OpenLibrarySearchResponse?> SearchBooksAsync(string query);

        Task<List<object>> GetTopSavedBooksAsync(int count = 10);

        Task ClearSearchCacheAsync();

        Task ClearTopSavedBooksCache();

        Task InvalidateTopSavedBooksCacheAsync();
    }
}