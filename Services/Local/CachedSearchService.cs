using paradaya_lentera.Models.External.OpenLibrary;
using paradaya_lentera.Services.External;

namespace paradaya_lentera.Services.Local
{
    public class CachedSearchService(
        ICacheService cacheService,
        IOpenLibraryService openLibraryService,
        IBookService bookService,
        ILogger<CachedSearchService> logger) : ICachedSearchService
    {
        private const string SearchCachePrefix = "search_";
        private const string TopSavedBooksCacheKey = "top_saved_books";
        private const int DefaultTopBooksCount = 10;
        private const int FavoriteScoreMultiplier = 2;

        private static readonly TimeSpan SearchCacheDuration = TimeSpan.FromMinutes(7);
        private static readonly TimeSpan TopSavedBooksCacheDuration = TimeSpan.FromMinutes(15);

        public async Task<OpenLibrarySearchResponse?> SearchBooksAsync(string query, int limit = 50)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return null;
            }

            var normalizedQuery = query.Trim().ToLowerInvariant();
            var cacheKey = $"{SearchCachePrefix}{normalizedQuery}_{limit}";

            try
            {
                var cachedResult = await cacheService.GetAsync<OpenLibrarySearchResponse>(cacheKey);
                if (cachedResult != null)
                {
                    logger.LogInformation("Search cache hit for query: {Query} (limit: {Limit})", query, limit);
                    return cachedResult;
                }

                logger.LogInformation("Search cache miss for query: {Query} (limit: {Limit}), fetching from API", query, limit);
                var apiResult = await openLibraryService.SearchBooksAsync(query, limit);

                if (apiResult != null)
                {
                    await cacheService.SetAsync(cacheKey, apiResult, SearchCacheDuration);
                    logger.LogInformation("Search result cached for query: {Query} (limit: {Limit})", query, limit);
                }

                return apiResult;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in cached search for query: {Query}", query);
                
                try
                {
                    return await openLibraryService.SearchBooksAsync(query, limit);
                }
                catch (Exception fallbackEx)
                {
                    logger.LogError(fallbackEx, "Fallback API call also failed for query: {Query}", query);
                    return null;
                }
            }
        }

        public async Task<List<object>> GetTopSavedBooksAsync(int count = DefaultTopBooksCount)
        {
            try
            {
                var cachedResult = await cacheService.GetAsync<List<object>>(TopSavedBooksCacheKey);
                if (cachedResult != null)
                {
                    logger.LogInformation("Top saved books cache hit");
                    return cachedResult.Take(count).ToList();
                }

                logger.LogInformation("Top saved books cache miss, calculating from database");
                var topSavedBooks = await CalculateTopSavedBooksAsync(count);

                if (topSavedBooks.Count > 0)
                {
                    await cacheService.SetAsync(TopSavedBooksCacheKey, topSavedBooks, TopSavedBooksCacheDuration);
                    logger.LogInformation("Top saved books cached with {Count} items", topSavedBooks.Count);
                }

                return topSavedBooks;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting top saved books");
                
                try
                {
                    return await CalculateTopSavedBooksAsync(count);
                }
                catch (Exception fallbackEx)
                {
                    logger.LogError(fallbackEx, "Fallback calculation also failed for top saved books");
                    return [];
                }
            }
        }

        public Task ClearSearchCacheAsync()
        {
            logger.LogInformation("Search cache clear requested - implementation needed for pattern-based clearing");
            return Task.CompletedTask;
        }

        public async Task ClearTopSavedBooksCache()
        {
            try
            {
                await cacheService.RemoveAsync(TopSavedBooksCacheKey);
                logger.LogInformation("Top saved books cache cleared");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error clearing top saved books cache");
            }
        }

        public async Task InvalidateTopSavedBooksCacheAsync()
        {
            await ClearTopSavedBooksCache();
        }

        private async Task<List<object>> CalculateTopSavedBooksAsync(int count)
        {
            try
            {
                var allBooks = await bookService.GetAllBooksAsync();
                var readingListCounts = new Dictionary<int, int>();

                foreach (var book in allBooks)
                {
                    var countForBook = 1;
                    if (book.ReadingLists != null && book.ReadingLists.Count > 0)
                    {
                        countForBook = book.ReadingLists.Count + (book.ReadingLists.Count(r => r.IsFavorite) * FavoriteScoreMultiplier);
                    }
                    readingListCounts[book.Id] = countForBook;
                }

                var topBooks = allBooks
                    .Where(b => readingListCounts.ContainsKey(b.Id))
                    .OrderByDescending(b => readingListCounts[b.Id])
                    .ThenByDescending(b => b.Id)
                    .Take(count)
                    .Select(b => new
                    {
                        id = b.Id,
                        title = b.Title,
                        author = b.Author,
                        thumbnail = b.Thumbnail,
                        year = b.PublishedYear,
                        pages = b.PageCount,
                        isbn = b.Isbn,
                        description = b.Description,
                        saveCount = readingListCounts[b.Id]
                    })
                    .Cast<object>()
                    .ToList();

                return topBooks;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error calculating top saved books");
                return [];
            }
        }
    }
}