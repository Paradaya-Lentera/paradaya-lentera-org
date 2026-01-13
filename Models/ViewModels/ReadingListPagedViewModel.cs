using paradaya_lentera.Models.Entities;

namespace paradaya_lentera.Models.ViewModels
{
    public class ReadingListPagedViewModel
    {
        public List<ReadingList> Items { get; set; } = new();
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int TotalItems { get; set; }
        public int PageSize { get; set; } = 9;
        public bool HasPreviousPage => CurrentPage > 1;
        public bool HasNextPage => CurrentPage < TotalPages;
        
        public static ReadingListPagedViewModel Create(List<ReadingList> items, int totalCount, int currentPage, int pageSize = 9)
        {
            return new ReadingListPagedViewModel
            {
                Items = items,
                CurrentPage = currentPage,
                TotalItems = totalCount,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }
    }
}