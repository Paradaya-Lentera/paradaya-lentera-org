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
        private const int FirstPageItemCount = 50;
        private const int SubsequentPageItemCount = 6;
        private const int MinPaginationLimit = 1;
        private const int MaxPaginationLimit = 100;
        private const int MaxTopSavedBooksCount = 100;
        private const int DefaultPopularBooksCount = 8;

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

        [HttpGet]
        public async Task<IActionResult> SearchApi(string q, int page = 1, int limit = 12)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(new { error = "Query tidak boleh kosong" });

            page = Math.Max(MinPaginationLimit, page);
            limit = Math.Clamp(limit, MinPaginationLimit, MaxPaginationLimit);

            var results = await cachedSearchService.SearchBooksAsync(q);
            if (results?.Docs != null)
            {
                int totalItemsToSkip;
                if (page == 1)
                {
                    totalItemsToSkip = 0;
                    limit = Math.Min(limit, FirstPageItemCount);
                }
                else
                {
                    totalItemsToSkip = FirstPageItemCount + (page - 2) * SubsequentPageItemCount;
                    limit = Math.Min(limit, SubsequentPageItemCount);
                }

                var paginatedDocs = results.Docs.Skip(totalItemsToSkip).Take(limit).ToList();

                var totalItemsShown = totalItemsToSkip + paginatedDocs.Count;
                var hasMore = totalItemsShown < results.NumFound;
                var totalPages = 1;
                var remainingAfterFirst = Math.Max(0, results.NumFound - FirstPageItemCount);
                if (remainingAfterFirst > 0)
                {
                    totalPages += (int)Math.Ceiling((double)remainingAfterFirst / SubsequentPageItemCount);
                }

                return Json(new
                {
                    docs = paginatedDocs,
                    numFound = results.NumFound,
                    start = totalItemsToSkip,
                    page,
                    limit,
                    totalPages,
                    hasMore
                });
            }

            return Json(results);
        }

        [HttpGet]
        public async Task<IActionResult> GetPopularBooks()
        {
            var popularBooks = await cachedSearchService.GetTopSavedBooksAsync(DefaultPopularBooksCount);
            return Json(new { popular_books = popularBooks });
        }

        [HttpGet]
        public async Task<IActionResult> GetFeaturedBooks()
        {
            try
            {
                var jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "data", "featured-books.json");
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
            // Validasi input
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
                Book? book = null;

                if (!string.IsNullOrEmpty(isbn))
                {
                    book = await bookService.GetByIsbnAsync(isbn);
                }

                if (book == null)
                {
                    book = await FindExistingBookAsync(isbn, title, author);
                }

                bool isNewBook = false;

                if (book == null)
                {
                    book = new Book
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

                    book = await bookService.AddBookAsync(book);
                    isNewBook = true;
                }
                else
                {
                    await UpdateBookIfNeededAsync(book, title, author, thumbnail, year, pages, isbn);
                }

                var alreadyExists = await readingListService.IsInReadingListAsync(userId, book.Id);
                if (alreadyExists)
                {
                    TempData["InfoMessage"] = $"'{book.Title}' sudah ada di daftar bacaan Anda.";
                    return RedirectToAction("ReadingList", "Page");
                }

                var success = await readingListService.AddToReadingListAsync(userId, book.Id);

                if (success)
                {
                    await cachedSearchService.InvalidateTopSavedBooksCacheAsync();

                    TempData["SuccessMessage"] = isNewBook
                        ? $"Berhasil menambahkan buku baru '{book.Title}' ke daftar bacaan!"
                        : $"Berhasil menambahkan '{book.Title}' ke daftar bacaan!";
                }
                else
                {
                    TempData["ErrorMessage"] = $"Gagal menambahkan '{book.Title}' ke daftar bacaan.";
                }

                return RedirectToAction("ReadingList", "Page");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error adding book to reading list. Title: {Title}, ISBN: {Isbn}", title, isbn);
                TempData["ErrorMessage"] = "Terjadi kesalahan saat menambahkan buku ke daftar bacaan.";
                return RedirectToAction("Index");
            }
        }

        private async Task<Book?> FindExistingBookAsync(string? isbn, string title, string author)
        {
            var books = await bookService.GetAllBooksAsync();

            if (!string.IsNullOrEmpty(isbn))
            {
                var bookByIsbn = books.FirstOrDefault(b =>
                    !string.IsNullOrEmpty(b.Isbn) &&
                    b.Isbn.Replace("-", "").Replace(" ", "") == isbn.Replace("-", "").Replace(" ", ""));

                if (bookByIsbn != null) return bookByIsbn;
            }

            var bookByTitleAuthor = books.FirstOrDefault(b =>
                string.Equals(b.Title.Trim(), title.Trim(), StringComparison.OrdinalIgnoreCase) &&
                string.Equals(b.Author?.Trim(), author?.Trim(), StringComparison.OrdinalIgnoreCase));

            return bookByTitleAuthor;
        }

        private async Task UpdateBookIfNeededAsync(Book existingBook, string title, string author, string thumbnail, int year, int pages, string isbn)
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

        [HttpGet]
        public async Task<IActionResult> GetTopSavedBooks(int count = 10)
        {
            count = Math.Clamp(count, MinPaginationLimit, MaxTopSavedBooksCount);
            var topSavedBooks = await cachedSearchService.GetTopSavedBooksAsync(count);
            return Json(new { top_saved_books = topSavedBooks });
        }
    }
}