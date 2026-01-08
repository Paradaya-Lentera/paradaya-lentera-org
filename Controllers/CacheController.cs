using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using paradaya_lentera.Services.Local;

namespace paradaya_lentera.Controllers
{
    [Authorize] // Require authentication for cache management
    public class CacheController : Controller
    {
        private readonly ICacheService _cacheService;
        private readonly ICachedSearchService _cachedSearchService;
        private readonly ILogger<CacheController> _logger;

        public CacheController(
            ICacheService cacheService,
            ICachedSearchService cachedSearchService,
            ILogger<CacheController> logger)
        {
            _cacheService = cacheService;
            _cachedSearchService = cachedSearchService;
            _logger = logger;
        }

        // GET: Cache management page
        public IActionResult Index()
        {
            return View();
        }

        // POST: Clear all search cache
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ClearSearchCache()
        {
            try
            {
                await _cachedSearchService.ClearSearchCacheAsync();
                TempData["SuccessMessage"] = "Search cache cleared successfully.";
                _logger.LogInformation("Search cache cleared by user");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing search cache");
                TempData["ErrorMessage"] = "Failed to clear search cache.";
            }

            return RedirectToAction(nameof(Index));
        }

        // POST: Clear top saved books cache
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ClearTopSavedBooksCache()
        {
            try
            {
                await _cachedSearchService.ClearTopSavedBooksCache();
                TempData["SuccessMessage"] = "Top saved books cache cleared successfully.";
                _logger.LogInformation("Top saved books cache cleared by user");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing top saved books cache");
                TempData["ErrorMessage"] = "Failed to clear top saved books cache.";
            }

            return RedirectToAction(nameof(Index));
        }

        // POST: Clear all cache
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ClearAllCache()
        {
            try
            {
                await _cacheService.ClearAsync();
                await _cachedSearchService.ClearSearchCacheAsync();
                await _cachedSearchService.ClearTopSavedBooksCache();
                
                TempData["SuccessMessage"] = "All cache cleared successfully.";
                _logger.LogInformation("All cache cleared by user");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing all cache");
                TempData["ErrorMessage"] = "Failed to clear all cache.";
            }

            return RedirectToAction(nameof(Index));
        }

        // GET: Cache statistics (API endpoint)
        [HttpGet]
        public IActionResult GetCacheStats()
        {
            var stats = new
            {
                searchCacheEnabled = true,
                topSavedBooksCacheEnabled = true,
                searchCacheDuration = "7 minutes",
                topSavedBooksCacheDuration = "15 minutes",
                lastCleared = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC")
            };

            return Json(stats);
        }
    }
}