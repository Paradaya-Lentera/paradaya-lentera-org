using System.Net.Http.Json;
using paradaya_lentera.Models.External.OpenLibrary;

namespace paradaya_lentera.Services.External
{
    public class OpenLibraryService : IOpenLibraryService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<OpenLibraryService> _logger;
        private const string BaseUrl = "https://openlibrary.org";

        public OpenLibraryService(HttpClient httpClient, ILogger<OpenLibraryService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _httpClient.BaseAddress = new Uri(BaseUrl);
        }

        public async Task<OpenLibrarySearchResponse?> SearchBooksAsync(string query, int limit = 50)
        {
            try
            {
                var response = await _httpClient.GetFromJsonAsync<OpenLibrarySearchResponse>(
                    $"/search.json?q={Uri.EscapeDataString(query)}&fields=key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median,publisher,subject,ia,language,subtitle&limit={limit}");
                return response;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "HTTP error searching books for query: {Query}", query);
                return null;
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogWarning(ex, "Request timeout searching books for query: {Query}", query);
                return null;
            }
        }

        public async Task<OpenLibraryDoc?> GetBookByIsbnAsync(string isbn)
        {
            try
            {
                var response = await _httpClient.GetFromJsonAsync<OpenLibrarySearchResponse>(
                    $"/search.json?isbn={isbn}&fields=key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median,publisher,subject,ia,language,subtitle");
                return response?.Docs.FirstOrDefault();
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "HTTP error getting book by ISBN: {Isbn}", isbn);
                return null;
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogWarning(ex, "Request timeout getting book by ISBN: {Isbn}", isbn);
                return null;
            }
        }

        public async Task<OpenLibraryDoc?> GetBookByKeyAsync(string key)
        {
            try
            {
                var response = await _httpClient.GetFromJsonAsync<OpenLibrarySearchResponse>(
                    $"/search.json?q=key:{key}&fields=key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median,publisher,subject,ia,language,subtitle");
                return response?.Docs.FirstOrDefault();
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "HTTP error getting book by key: {Key}", key);
                return null;
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogWarning(ex, "Request timeout getting book by key: {Key}", key);
                return null;
            }
        }

        public async Task<OpenLibraryWork?> GetWorkAsync(string workKey)
        {
            try
            {
                var response = await _httpClient.GetFromJsonAsync<OpenLibraryWork>($"/works/{workKey}.json");
                return response;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "HTTP error getting work: {WorkKey}", workKey);
                return null;
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogWarning(ex, "Request timeout getting work: {WorkKey}", workKey);
                return null;
            }
        }

        public async Task<OpenLibraryRating?> GetWorkRatingAsync(string workKey)
        {
            try
            {
                var response = await _httpClient.GetFromJsonAsync<OpenLibraryRating>($"/works/{workKey}/ratings.json");
                return response;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "HTTP error getting work rating: {WorkKey}", workKey);
                return null;
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogWarning(ex, "Request timeout getting work rating: {WorkKey}", workKey);
                return null;
            }
        }
    }
}
