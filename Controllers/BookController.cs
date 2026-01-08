using Microsoft.AspNetCore.Mvc;
using paradaya_lentera.Models.Entities;
using paradaya_lentera.Services.Local;

namespace paradaya_lentera.Controllers
{
    public class BookController(IBookService bookService, IReadingListService readingListService) : Controller
    {
        public async Task<IActionResult> Index()
        {
            var books = await bookService.GetAllBooksAsync();
            return View(books);
        }

        public async Task<IActionResult> Details(int id)
        {
            var book = await bookService.GetBookByIdAsync(id);
            if (book == null)
                return NotFound();

            var userId = User.Identity?.IsAuthenticated == true ? 
                int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0") : 0;

            ViewBag.IsInReadingList = userId > 0 && await readingListService.IsInReadingListAsync(userId, id);

            return View(book);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Book book)
        {
            if (ModelState.IsValid)
            {
                await bookService.AddBookAsync(book);
                return RedirectToAction(nameof(Index));
            }

            return View(book);
        }

        public async Task<IActionResult> Edit(int id)
        {
            var book = await bookService.GetBookByIdAsync(id);
            if (book == null)
                return NotFound();

            return View(book);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Book book)
        {
            if (id != book.Id)
                return NotFound();

            if (ModelState.IsValid)
            {
                await bookService.UpdateBookAsync(book);
                return RedirectToAction(nameof(Index));
            }
            return View(book);
        }

        public async Task<IActionResult> Delete(int id)
        {
            var book = await bookService.GetBookByIdAsync(id);
            if (book == null)
                return NotFound();

            return View(book);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            await bookService.DeleteBookAsync(id);
            return RedirectToAction(nameof(Index));
        }
    }
}
