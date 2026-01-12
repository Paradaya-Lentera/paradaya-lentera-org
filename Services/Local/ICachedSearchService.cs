using paradaya_lentera.Models.External.OpenLibrary;
using paradaya_lentera.Services.External;

namespace paradaya_lentera.Services.Local
{
    public interface ICachedSearchService : IOpenLibraryService
    {
        Task<List<object>> GetTopSavedBooksAsync(int count = 10);

        Task ClearSearchCacheAsync();

        Task ClearTopSavedBooksCache();

        Task InvalidateTopSavedBooksCacheAsync();
    }
}