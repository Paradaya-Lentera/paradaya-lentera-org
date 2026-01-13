using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using paradaya_lentera.Models;
using paradaya_lentera.Models.Entities;
using paradaya_lentera.Models.ViewModels;
using paradaya_lentera.Services.Local;
using paradaya_lentera.Services.External;
using paradaya_lentera.Extensions;

namespace paradaya_lentera.Controllers;

public class PageController : Controller
{
    private readonly ILogger<PageController> _logger;
    private readonly IBookService _bookService;
    private readonly IOpenLibraryService _openLibraryService;
    private readonly IReadingListService _readingListService;

    public PageController(
        ILogger<PageController> logger,
        IBookService bookService,
        IOpenLibraryService openLibraryService,
        IReadingListService readingListService)
    {
        _logger = logger;
        _bookService = bookService;
        _openLibraryService = openLibraryService;
        _readingListService = readingListService;
    }

    public IActionResult Index()
    {
        return View();
    }

    // DETAIL
    public async Task<IActionResult> Detail(int? id, string? isbn, string? olkey)
    {
        BookDetailViewModel viewModel;

        if (id.HasValue)
        {
            var book = await _bookService.GetBookByIdAsync(id.Value);
            if (book == null)
                return NotFound();

            // Buat viewModel dulu
            viewModel = await BookDetailViewModel
                .EnrichLocalBookWithOpenLibrary(book, _openLibraryService);

            // Default
            viewModel.IsInReadingList = false;

            // Sinkron ReadingList
            if (User.Identity?.IsAuthenticated == true)
            {
                var userId = User.GetUserId();
                var list = await _readingListService.GetByUserAndBookAsync(userId, id.Value);

                if (list != null)
                {
                    viewModel.IsInReadingList = true;
                    viewModel.ReadingListId = list.Id;
                    viewModel.IsFavorite = list.IsFavorite;
                    viewModel.IsRead = list.IsRead;
                }
            }

            return View(viewModel);
        }

        // API BOOK (AMAN)
        if (!string.IsNullOrEmpty(isbn))
        {
            var apiBook = await _openLibraryService.GetBookByIsbnAsync(isbn);
            if (apiBook == null) return NotFound();
            return View(await BookDetailViewModel.FromOpenLibraryDoc(apiBook, _openLibraryService));
        }

        if (!string.IsNullOrEmpty(olkey))
        {
            var apiBook = await _openLibraryService.GetBookByKeyAsync(olkey);
            if (apiBook == null) return NotFound();
            return View(await BookDetailViewModel.FromOpenLibraryDoc(apiBook, _openLibraryService));
        }

        return RedirectToAction(nameof(Index));
    }

    // READ / EMBED
    [Authorize]
    public async Task<IActionResult> Read(int? id, string? isbn, string? olkey)
    {
        BookDetailViewModel? viewModel = null;

        if (id.HasValue)
        {
            var book = await _bookService.GetBookByIdAsync(id.Value);
            if (book == null) return NotFound();

            viewModel = await BookDetailViewModel.EnrichLocalBookWithOpenLibrary(book, _openLibraryService);
        }
        else if (!string.IsNullOrEmpty(isbn))
        {
            var apiBook = await _openLibraryService.GetBookByIsbnAsync(isbn);
            if (apiBook != null)
                viewModel = await BookDetailViewModel.FromOpenLibraryDoc(apiBook, _openLibraryService);
        }
        else if (!string.IsNullOrEmpty(olkey))
        {
            var apiBook = await _openLibraryService.GetBookByKeyAsync(olkey);
            if (apiBook != null)
                viewModel = await BookDetailViewModel.FromOpenLibraryDoc(apiBook, _openLibraryService);
        }

        if (viewModel == null || string.IsNullOrEmpty(viewModel.IaId))
        {
            // If no IA ID found, we can't embed. Redirect to Detail with a message or just Detail.
            // Or maybe show an error view.
            return RedirectToAction(nameof(Detail), new { id, isbn, olkey });
        }

        return View(viewModel);
    }

    // READING LIST
    [Authorize]
    public async Task<IActionResult> ReadingList(int page = 1)
    {
        // Set cache headers that allow caching but ensure revalidation when online
        Response.Headers.Add("Cache-Control", "max-age=0, must-revalidate");
        Response.Headers.Add("ETag", $"\"{DateTime.UtcNow.Ticks}\"");
        
        var userId = User.GetUserId();
        var (items, totalCount) = await _readingListService.GetUserReadingListPagedAsync(userId, page, 9);
        
        var viewModel = ReadingListPagedViewModel.Create(items, totalCount, page, 9);
        return View(viewModel);
    }

    // API endpoint for reading list data
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetReadingListData(int page = 1)
    {
        // Set cache headers that allow caching but ensure revalidation
        Response.Headers.Add("Cache-Control", "max-age=0, must-revalidate");
        Response.Headers.Add("ETag", $"\"{DateTime.UtcNow.Ticks}\"");
        
        var userId = User.GetUserId();
        var (items, totalCount) = await _readingListService.GetUserReadingListPagedAsync(userId, page, 9);
        
        var data = items.Select(item => new
        {
            id = item.Id,
            bookId = item.BookId,
            title = item.Book.Title,
            author = item.Book.Author,
            thumbnail = item.Book.Thumbnail,
            category = item.Book.Category ?? "GENERAL",
            publishedYear = item.Book.PublishedYear,
            pageCount = item.Book.PageCount,
            isFavorite = item.IsFavorite,
            isRead = item.IsRead
        });

        var totalPages = (int)Math.Ceiling((double)totalCount / 9);

        return Json(new { 
            success = true, 
            data,
            pagination = new {
                currentPage = page,
                totalPages,
                totalItems = totalCount,
                hasNextPage = page < totalPages,
                hasPreviousPage = page > 1
            }
        });
    }

    // ADD / REMOVE
    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleFavorite(int readingListId)
    {
        try
        {
            _logger.LogInformation("ToggleFavorite called with readingListId: {ReadingListId}", readingListId);
            
            if (readingListId <= 0)
            {
                _logger.LogWarning("Invalid reading list ID: {ReadingListId}", readingListId);
                return Json(new { success = false, message = "Invalid reading list ID" });
            }

            var userId = User.GetUserId();
            _logger.LogInformation("User ID: {UserId}", userId);

            var result = await _readingListService.ToggleFavoriteAsync(readingListId, userId);
            _logger.LogInformation("ToggleFavoriteAsync result: {Result}", result);

            if (result == null)
            {
                _logger.LogWarning("Reading list item not found: {ReadingListId}", readingListId);
                return Json(new { success = false, message = "Item tidak ditemukan" });
            }

            return Json(new { success = true, isFavorite = result.Value });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ToggleFavorite for readingListId: {ReadingListId}", readingListId);
            return Json(new { success = false, message = "Terjadi kesalahan sistem" });
        }
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleRead(int readingListId)
    {
        try
        {
            _logger.LogInformation("ToggleRead called with readingListId: {ReadingListId}", readingListId);
            
            if (readingListId <= 0)
            {
                _logger.LogWarning("Invalid reading list ID: {ReadingListId}", readingListId);
                return Json(new { success = false, message = "Invalid reading list ID" });
            }

            var userId = User.GetUserId();
            _logger.LogInformation("User ID: {UserId}", userId);

            var result = await _readingListService.ToggleReadAsync(readingListId, userId);
            _logger.LogInformation("ToggleReadAsync result: {Result}", result);

            if (result == null)
            {
                _logger.LogWarning("Reading list item not found: {ReadingListId}", readingListId);
                return Json(new { success = false, message = "Item tidak ditemukan" });
            }

            return Json(new { success = true, isRead = result.Value });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ToggleRead for readingListId: {ReadingListId}", readingListId);
            return Json(new { success = false, message = "Terjadi kesalahan sistem" });
        }
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleReadingList(int bookId)
    {
        if (bookId <= 0)
            return Json(new { success = false, message = "Invalid book ID" });

        var userId = User.GetUserId();
        var isInList = await _readingListService.IsInReadingListAsync(userId, bookId);

        bool success;
        bool newState;

        if (isInList)
        {
            var list = await _readingListService.GetByUserAndBookAsync(userId, bookId);
            success = await _readingListService.RemoveFromReadingListAsync(list!.Id);
            newState = false;
        }
        else
        {
            success = await _readingListService.AddToReadingListAsync(userId, bookId);
            newState = true;
        }

        return Json(new
        {
            success,
            isInReadingList = newState
        });
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RemoveFromReadingList(int readingListId)
    {
        try
        {
            _logger.LogInformation("RemoveFromReadingList called with readingListId: {ReadingListId}", readingListId);
            
            if (readingListId <= 0)
            {
                _logger.LogWarning("Invalid reading list ID: {ReadingListId}", readingListId);
                return Json(new { success = false, message = "Invalid reading list ID" });
            }

            var userId = User.GetUserId();
            _logger.LogInformation("User ID: {UserId}", userId);

            var success = await _readingListService.RemoveFromReadingListAsync(readingListId, userId);
            _logger.LogInformation("RemoveFromReadingListAsync result: {Success}", success);

            return Json(new
            {
                success
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in RemoveFromReadingList for readingListId: {ReadingListId}", readingListId);
            return Json(new { success = false, message = "Terjadi kesalahan sistem" });
        }
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel
        {
            RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
        });
    }
}