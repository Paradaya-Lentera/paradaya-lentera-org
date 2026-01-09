using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using paradaya_lentera.Models.Entities;
using paradaya_lentera.Services.Local;
using paradaya_lentera.Extensions;

namespace paradaya_lentera.Controllers
{
    public class SearchController(
        ICachedSearchService cachedSearchService,
        IBookService bookService,
        IReadingListService readingListService,
        ILogger<SearchController> logger) : Controller
    {
        #region Constants
        private const int FirstPageItemCount = 50;
        private const int SubsequentPageItemCount = 6;
        private const int MinPaginationLimit = 1;
        private const int MaxPaginationLimit = 100;
        private const int MaxTopSavedBooksCount = 100;
        private const int DefaultPopularBooksCount = 8;
        private const int InitialBooksLimit = 120;
        private const int BooksPerCategory = 30;
        private const int CategoryCount = 4;
        #endregion

        #region View Actions
        public IActionResult Index()
        {
            return View();
        }

        public async Task<IActionResult> Results(string q)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return RedirectToAction(nameof(Index));
            }

            var results = await cachedSearchService.SearchBooksAsync(q);
            ViewBag.Query = q;
            return View("Index", results);
        }
        #endregion

        #region Search API
        [HttpGet]
        public async Task<IActionResult> SearchApi(string q, int page = 1, int limit = 12)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(new { error = "Query tidak boleh kosong" });

            page = Math.Max(MinPaginationLimit, page);
            limit = Math.Clamp(limit, MinPaginationLimit, MaxPaginationLimit);

            var results = await cachedSearchService.SearchBooksAsync(q);
            
            if (results?.Docs == null)
                return Json(results);

            var (totalItemsToSkip, adjustedLimit) = CalculatePagination(page, limit);
            var paginatedDocs = results.Docs.Skip(totalItemsToSkip).Take(adjustedLimit).ToList();
            var totalPages = CalculateTotalPages(results.NumFound);

            return Json(new
            {
                docs = paginatedDocs,
                numFound = results.NumFound,
                start = totalItemsToSkip,
                page,
                limit = adjustedLimit,
                totalPages,
                hasMore = (totalItemsToSkip + paginatedDocs.Count) < results.NumFound
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetInitialBooks()
        {
            try
            {
                var books = await FetchBooksFromMultipleCategories();
                
                logger.LogInformation($"Returning {books.Count} initial books from API");
                
                return Json(new
                {
                    featured_books = books,
                    source = "api",
                    categories = GetSelectedCategories()
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching initial books from API, falling back to JSON");
                return await GetFallbackFeaturedBooks();
            }
        }
        #endregion

        #region Book Collections API
        [HttpGet]
        public async Task<IActionResult> GetPopularBooks()
        {
            var popularBooks = await cachedSearchService.GetTopSavedBooksAsync(DefaultPopularBooksCount);
            return Json(new { popular_books = popularBooks });
        }

        [HttpGet]
        public async Task<IActionResult> GetTopSavedBooks(int count = 10)
        {
            count = Math.Clamp(count, MinPaginationLimit, MaxTopSavedBooksCount);
            var topSavedBooks = await cachedSearchService.GetTopSavedBooksAsync(count);
            return Json(new { top_saved_books = topSavedBooks });
        }

        [HttpGet]
        public async Task<IActionResult> GetFeaturedBooks()
        {
            try
            {
                var jsonPath = GetFeaturedBooksPath();
                var jsonContent = await System.IO.File.ReadAllTextAsync(jsonPath);
                var featuredData = System.Text.Json.JsonSerializer.Deserialize<object>(jsonContent);
                return Json(featuredData);
            }
            catch (FileNotFoundException)
            {
                logger.LogWarning("Featured books file not found");
                return Json(new { error = "Featured books not available" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error loading featured books");
                return Json(new { error = "Failed to load featured books" });
            }
        }
        #endregion

        #region Reading List Management
        [HttpPost]
        [Authorize]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddToReadingList(
            string title,
            string author,
            string thumbnail,
            int year,
            int pages,
            string isbn)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                TempData["ErrorMessage"] = "Judul buku tidak boleh kosong.";
                return RedirectToAction("Index");
            }

            var userId = User.GetUserId();
            if (userId == 0)
                return Unauthorized("UserId invalid");

            try
            {
                var book = await GetOrCreateBook(isbn, title, author, thumbnail, year, pages);
                var (success, message, isNewBook) = await AddBookToUserReadingList(userId, book);

                TempData[success ? "SuccessMessage" : (message.Contains("sudah ada") ? "InfoMessage" : "ErrorMessage")] = message;
                
                return RedirectToAction("ReadingList", "Page");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error adding book to reading list. Title: {Title}, ISBN: {Isbn}", title, isbn);
                TempData["ErrorMessage"] = "Terjadi kesalahan saat menambahkan buku ke daftar bacaan.";
                return RedirectToAction("Index");
            }
        }
        #endregion

        #region Cache Management
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ClearSearchCache()
        {
            await cachedSearchService.ClearSearchCacheAsync();
            TempData["SuccessMessage"] = "Search cache cleared successfully.";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ClearTopSavedBooksCache()
        {
            await cachedSearchService.ClearTopSavedBooksCache();
            TempData["SuccessMessage"] = "Top saved books cache cleared successfully.";
            return RedirectToAction(nameof(Index));
        }
        #endregion

        #region Private Helper Methods - Pagination
        private (int skip, int limit) CalculatePagination(int page, int limit)
        {
            if (page == 1)
            {
                return (0, Math.Min(limit, FirstPageItemCount));
            }

            var totalItemsToSkip = FirstPageItemCount + (page - 2) * SubsequentPageItemCount;
            var adjustedLimit = Math.Min(limit, SubsequentPageItemCount);
            
            return (totalItemsToSkip, adjustedLimit);
        }

        private int CalculateTotalPages(int totalItems)
        {
            var totalPages = 1;
            var remainingAfterFirst = Math.Max(0, totalItems - FirstPageItemCount);
            
            if (remainingAfterFirst > 0)
            {
                totalPages += (int)Math.Ceiling((double)remainingAfterFirst / SubsequentPageItemCount);
            }
            
            return totalPages;
        }
        #endregion

        #region Private Helper Methods - Book Management
        private async Task<Book> GetOrCreateBook(
            string isbn, 
            string title, 
            string author, 
            string thumbnail, 
            int year, 
            int pages)
        {
            Book? book = null;

            if (!string.IsNullOrEmpty(isbn))
            {
                book = await bookService.GetByIsbnAsync(isbn);
            }

            book ??= await FindExistingBookAsync(isbn, title, author);

            if (book == null)
            {
                book = CreateNewBook(isbn, title, author, thumbnail, year, pages);
                book = await bookService.AddBookAsync(book);
            }
            else
            {
                await UpdateBookIfNeededAsync(book, title, author, thumbnail, year, pages, isbn);
            }

            return book;
        }

        private Book CreateNewBook(
            string isbn, 
            string title, 
            string author, 
            string thumbnail, 
            int year, 
            int pages)
        {
            return new Book
            {
                Title = title?.Trim() ?? "Unknown Title",
                Author = author?.Trim() ?? "Unknown Author",
                Publisher = "Open Library",
                Category = "General",
                Thumbnail = thumbnail,
                Description = $"Imported from Open Library. ISBN: {isbn}",
                PublishedYear = year > 0 ? year : null,
                PageCount = pages > 0 ? pages : null,
                Isbn = isbn?.Trim(),
                Source = "OpenLibrary"
            };
        }

        private async Task<Book?> FindExistingBookAsync(string? isbn, string title, string author)
        {
            var books = await bookService.GetAllBooksAsync();

            if (!string.IsNullOrEmpty(isbn))
            {
                var normalizedIsbn = NormalizeIsbn(isbn);
                var bookByIsbn = books.FirstOrDefault(b =>
                    !string.IsNullOrEmpty(b.Isbn) &&
                    NormalizeIsbn(b.Isbn) == normalizedIsbn);

                if (bookByIsbn != null) 
                    return bookByIsbn;
            }

            return books.FirstOrDefault(b =>
                string.Equals(b.Title.Trim(), title.Trim(), StringComparison.OrdinalIgnoreCase) &&
                string.Equals(b.Author?.Trim(), author?.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        private async Task UpdateBookIfNeededAsync(
            Book existingBook, 
            string title, 
            string author, 
            string thumbnail, 
            int year, 
            int pages, 
            string isbn)
        {
            bool needsUpdate = false;

            if (string.IsNullOrEmpty(existingBook.Thumbnail) && !string.IsNullOrEmpty(thumbnail))
            {
                existingBook.Thumbnail = thumbnail;
                needsUpdate = true;
            }

            if (!existingBook.PublishedYear.HasValue && year > 0)
            {
                existingBook.PublishedYear = year;
                needsUpdate = true;
            }

            if (!existingBook.PageCount.HasValue && pages > 0)
            {
                existingBook.PageCount = pages;
                needsUpdate = true;
            }

            if (string.IsNullOrEmpty(existingBook.Isbn) && !string.IsNullOrEmpty(isbn))
            {
                existingBook.Isbn = isbn;
                needsUpdate = true;
            }

            if (needsUpdate)
            {
                await bookService.UpdateBookAsync(existingBook);
            }
        }

        private async Task<(bool success, string message, bool isNewBook)> AddBookToUserReadingList(int userId, Book book)
        {
            var alreadyExists = await readingListService.IsInReadingListAsync(userId, book.Id);
            
            if (alreadyExists)
            {
                return (false, $"'{book.Title}' sudah ada di daftar bacaan Anda.", false);
            }

            var isNewBook = string.Equals(book.Source, "OpenLibrary", StringComparison.OrdinalIgnoreCase);
            var success = await readingListService.AddToReadingListAsync(userId, book.Id);

            if (success)
            {
                await cachedSearchService.InvalidateTopSavedBooksCacheAsync();
                var message = isNewBook
                    ? $"Berhasil menambahkan buku baru '{book.Title}' ke daftar bacaan!"
                    : $"Berhasil menambahkan '{book.Title}' ke daftar bacaan!";
                return (true, message, isNewBook);
            }

            return (false, $"Gagal menambahkan '{book.Title}' ke daftar bacaan.", isNewBook);
        }
        #endregion

        #region Private Helper Methods - Initial Books
        private async Task<List<dynamic>> FetchBooksFromMultipleCategories()
        {
            var allBooks = new List<dynamic>();
            var random = new Random();
            var selectedQueries = GetPopularQueries()
                .OrderBy(x => random.Next())
                .Take(CategoryCount)
                .ToList();

            foreach (var query in selectedQueries)
            {
                try
                {
                    var booksFromCategory = await FetchBooksForCategory(query);
                    allBooks.AddRange(booksFromCategory);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, $"Failed to fetch books for category: {query}");
                }
            }

            return allBooks
                .OrderBy(x => random.Next())
                .Take(InitialBooksLimit)
                .ToList();
        }

        private async Task<IEnumerable<dynamic>> FetchBooksForCategory(string category)
        {
            var results = await cachedSearchService.SearchBooksAsync(category);
            
            if (results?.Docs == null || !results.Docs.Any())
                return Enumerable.Empty<dynamic>();

            return results.Docs
                .Take(BooksPerCategory)
                .Select(book => new
                {
                    title = book.Title,
                    author = book.AuthorName?.FirstOrDefault() ?? "Unknown Author",
                    year = book.FirstPublishYear ?? 0,
                    isbn = book.Isbn?.FirstOrDefault() ?? "",
                    thumbnail = book.CoverI.HasValue
                        ? $"https://covers.openlibrary.org/b/id/{book.CoverI}-L.jpg"
                        : "",
                    description = book.Subtitle ?? $"Published in {book.FirstPublishYear}",
                    pages = 0,
                    category
                });
        }

        private async Task<IActionResult> GetFallbackFeaturedBooks()
        {
            try
            {
                var jsonPath = GetFeaturedBooksPath();
                var jsonContent = await System.IO.File.ReadAllTextAsync(jsonPath);
                var featuredData = System.Text.Json.JsonSerializer.Deserialize<object>(jsonContent);
                return Json(featuredData);
            }
            catch (Exception jsonEx)
            {
                logger.LogError(jsonEx, "Failed to load fallback JSON");
                return Json(new
                {
                    error = "Failed to load books",
                    featured_books = new List<object>()
                });
            }
        }

        private List<string> GetPopularQueries()
        {
            return new List<string>
            {
                "bestseller",
                "fiction",
                "fantasy",
                "science fiction",
                "mystery",
                "romance",
                "thriller",
                "classics",
                "programming",
                "business"
            };
        }

        private List<string> GetSelectedCategories()
        {
            var random = new Random();
            return GetPopularQueries()
                .OrderBy(x => random.Next())
                .Take(CategoryCount)
                .ToList();
        }
        #endregion

        #region Private Helper Methods - Utilities
        private string NormalizeIsbn(string isbn)
        {
            return isbn.Replace("-", "").Replace(" ", "");
        }

        private string GetFeaturedBooksPath()
        {
            return Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "data", "featured-books.json");
        }
        #endregion
    }
}