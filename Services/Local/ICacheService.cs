using System;
using System.Threading.Tasks;

namespace paradaya_lentera.Services.Local
{
    public interface ICacheService
    {
        /// <summary>
        /// Get cached value by key
        /// </summary>
        /// <typeparam name="T">Type of cached object</typeparam>
        /// <param name="key">Cache key</param>
        /// <returns>Cached value or default if not found/expired</returns>
        Task<T?> GetAsync<T>(string key) where T : class;

        /// <summary>
        /// Set cache value with expiration
        /// </summary>
        /// /// <typeparam name="T">Type of object to cache</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="value">Value to cache</param>
        /// <param name="expiration">Cache expiration time</param>
        Task SetAsync<T>(string key, T value, TimeSpan expiration) where T : class;

        /// <summary>
        /// Remove cached value by key
        /// </summary>
        /// <param name="key">Cache key</param>
        Task RemoveAsync(string key);

        /// <summary>
        /// /// Clear all cached values
        /// /// </summary>
        Task ClearAsync();

        /// <summary>
        /// Check if key exists in cache
        /// </summary>
        /// <param name="key">Cache key</param>
        /// <returns>True if key exists and not expired</returns>
        Task<bool> ExistsAsync(string key);
    }
}