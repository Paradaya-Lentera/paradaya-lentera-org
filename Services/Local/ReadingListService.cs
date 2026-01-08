using Microsoft.EntityFrameworkCore;
using paradaya_lentera.Data;
using paradaya_lentera.Models.Entities;

namespace paradaya_lentera.Services.Local
{
    public class ReadingListService(ApplicationDbContext context, ILogger<ReadingListService> logger) : IReadingListService
    {
        public async Task<bool> AddToReadingListAsync(int userId, int bookId)
        {
            try
            {
                var exists = await context.ReadingLists
                    .AnyAsync(rl => rl.UserId == userId && rl.BookId == bookId);

                if (exists)
                    return false;

                var readingList = new ReadingList
                {
                    UserId = userId,
                    BookId = bookId,
                    AddedAt = DateTime.UtcNow,
                    IsFavorite = false,
                    IsRead = false
                };

                context.ReadingLists.Add(readingList);
                await context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateException ex)
            {
                logger.LogError(ex, "Database error adding book {BookId} to reading list for user {UserId}", bookId, userId);
                return false;
            }
        }

        public async Task<bool> RemoveFromReadingListAsync(int readingListId)
        {
            var item = await context.ReadingLists.FindAsync(readingListId);
            if (item == null) return false;

            context.ReadingLists.Remove(item);
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveFromReadingListAsync(int readingListId, int userId)
        {
            var item = await context.ReadingLists
                .FirstOrDefaultAsync(rl => rl.Id == readingListId && rl.UserId == userId);
            if (item == null) return false;

            context.ReadingLists.Remove(item);
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IsInReadingListAsync(int userId, int bookId)
        {
            return await context.ReadingLists
                .AnyAsync(x => x.UserId == userId && x.BookId == bookId);
        }

        public async Task<List<ReadingList>> GetUserReadingListAsync(int userId)
        {
            return await context.ReadingLists
                .Include(x => x.Book)
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.AddedAt)
                .ToListAsync();
        }

        public async Task<bool?> ToggleFavoriteAsync(int readingListId)
        {
            var item = await context.ReadingLists.FindAsync(readingListId);
            if (item == null) return null;

            item.IsFavorite = !item.IsFavorite;
            await context.SaveChangesAsync();
            return item.IsFavorite;
        }

        public async Task<bool?> ToggleFavoriteAsync(int readingListId, int userId)
        {
            var item = await context.ReadingLists
                .FirstOrDefaultAsync(rl => rl.Id == readingListId && rl.UserId == userId);
            if (item == null) return null;

            item.IsFavorite = !item.IsFavorite;
            await context.SaveChangesAsync();
            return item.IsFavorite;
        }

        public async Task<bool?> ToggleReadAsync(int readingListId)
        {
            var item = await context.ReadingLists.FindAsync(readingListId);
            if (item == null) return null;

            item.IsRead = !item.IsRead;
            await context.SaveChangesAsync();
            return item.IsRead;
        }

        public async Task<bool?> ToggleReadAsync(int readingListId, int userId)
        {
            var item = await context.ReadingLists
                .FirstOrDefaultAsync(rl => rl.Id == readingListId && rl.UserId == userId);
            if (item == null) return null;

            item.IsRead = !item.IsRead;
            await context.SaveChangesAsync();
            return item.IsRead;
        }

        public async Task<ReadingList?> GetByUserAndBookAsync(int userId, int bookId)
        {
            return await context.ReadingLists
                .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == bookId);
        }
    }
}
