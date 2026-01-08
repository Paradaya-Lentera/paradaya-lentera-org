using paradaya_lentera.Models.Entities;
using paradaya_lentera.Models.External.OpenLibrary;
using paradaya_lentera.Services.External;

namespace paradaya_lentera.Models.ViewModels
{
    public class BookDetailViewModel
    {
        public bool IsLocal { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string CoverUrl { get; set; } = string.Empty;
        public string Synopsis { get; set; } = "-";
        public int? Pages { get; set; }
        public int? Year { get; set; }
        public string Publisher { get; set; } = "-";
        public double? Rating { get; set; }
        public string Isbn { get; set; } = string.Empty;
        public string? BorrowUrl { get; set; }
        public bool IsInReadingList { get; set; }
        public int? LocalBookId { get; set; }
        public List<string> Subjects { get; set; } = new();
        public string? Language { get; set; }
        public int? ReadingListId { get; set; }
        public bool IsFavorite { get; set; }
        public bool IsRead { get; set; }
        public string? Subtitle { get; set; }
        public string? IaId { get; set; }
        public string? OlKey { get; set; }

        // Helper method to clean synopsis text
        public string GetCleanSynopsis()
        {
            if (Synopsis == "-" || string.IsNullOrEmpty(Synopsis))
                return Synopsis;

            var cleanSynopsis = Synopsis;
            
            // Remove markdown links like [text](url) and [text][ref]
            cleanSynopsis = System.Text.RegularExpressions.Regex.Replace(cleanSynopsis, @"\[([^\]]+)\]\([^)]+\)", "$1");
            cleanSynopsis = System.Text.RegularExpressions.Regex.Replace(cleanSynopsis, @"\[([^\]]+)\]\[\d+\]", "$1");
            
            // Remove reference links like [1]: https://...
            cleanSynopsis = System.Text.RegularExpressions.Regex.Replace(cleanSynopsis, @"\[\d+\]:\s*https?://[^\s\r\n]+", "");
            
            // Remove "Contains" sections and similar unwanted content
            cleanSynopsis = System.Text.RegularExpressions.Regex.Replace(cleanSynopsis, @"(\*\*Contains\*\*.*?)(?=\n\n|\r\n\r\n|$)", "", System.Text.RegularExpressions.RegexOptions.Singleline);
            cleanSynopsis = System.Text.RegularExpressions.Regex.Replace(cleanSynopsis, @"(Contains.*?)(?=\n\n|\r\n\r\n|$)", "", System.Text.RegularExpressions.RegexOptions.Singleline);
            
            // Remove multiple dashes (----------)
            cleanSynopsis = System.Text.RegularExpressions.Regex.Replace(cleanSynopsis, @"-{3,}", "");
            
            // Clean up extra whitespace and newlines
            cleanSynopsis = System.Text.RegularExpressions.Regex.Replace(cleanSynopsis, @"\s+", " ");
            cleanSynopsis = cleanSynopsis.Trim();
            
            return cleanSynopsis;
        }

        // Helper method to get truncated synopsis
        public string GetTruncatedSynopsis(int maxLength = 300)
        {
            var cleanSynopsis = GetCleanSynopsis();
            if (cleanSynopsis == "-" || string.IsNullOrEmpty(cleanSynopsis))
                return cleanSynopsis;
                
            return cleanSynopsis.Length > maxLength ? cleanSynopsis.Substring(0, maxLength) + "..." : cleanSynopsis;
        }

        // Helper method to check if synopsis should be truncated
        public bool ShouldTruncateSynopsis(int maxLength = 300)
        {
            var cleanSynopsis = GetCleanSynopsis();
            return !string.IsNullOrEmpty(cleanSynopsis) && cleanSynopsis != "-" && cleanSynopsis.Length > maxLength;
        }

        // Factory methods untuk membuat ViewModel
        public static BookDetailViewModel FromLocalBook(Book book, string? apiIsbn = null, double? rating = null)
        {
            return new BookDetailViewModel
            {
                IsLocal = true,
                Title = book.Title,
                Author = book.Author ?? "Unknown",
                CoverUrl = book.Thumbnail ?? "",
                Synopsis = book.Description ?? "-",
                Pages = book.PageCount,
                Year = book.PublishedYear,
                Publisher = book.Publisher ?? "-",
                Rating = rating,
                Isbn = apiIsbn ?? book.Isbn ?? "",
                LocalBookId = book.Id,
                Subjects = !string.IsNullOrEmpty(book.Category) ? new List<string> { book.Category } : new()
            };
        }

        public static async Task<BookDetailViewModel> FromOpenLibraryDoc(OpenLibraryDoc doc, 
            IOpenLibraryService openLibraryService)
        {
            var viewModel = new BookDetailViewModel
            {
                IsLocal = false,
                Title = doc.Title,
                Author = doc.AuthorName?.FirstOrDefault() ?? "Unknown",
                CoverUrl = doc.CoverUrl,
                Synopsis = "-", // Will be enriched below
                Pages = doc.NumberOfPages,
                Year = doc.FirstPublishYear,
                Publisher = doc.PrimaryPublisher ?? "-",
                Isbn = doc.PrimaryIsbn ?? "",
                BorrowUrl = doc.BorrowUrl,
                Subjects = doc.Subject ?? new(),
                Language = doc.Language?.FirstOrDefault(),
                Subtitle = doc.Subtitle,
                IaId = doc.PrimaryIa,
                OlKey = doc.Key
            };

            // Enrich dengan data dari Work (untuk description)
            if (!string.IsNullOrEmpty(doc.WorkKey))
            {
                var work = await openLibraryService.GetWorkAsync(doc.WorkKey);
                if (work?.DescriptionText != null)
                {
                    viewModel.Synopsis = work.DescriptionText;
                }

                // Get rating
                var rating = await openLibraryService.GetWorkRatingAsync(doc.WorkKey);
                if (rating?.Summary?.Average.HasValue == true)
                {
                    viewModel.Rating = rating.Summary.Average;
                }
            }

            return viewModel;
        }

        public static async Task<BookDetailViewModel> EnrichLocalBookWithOpenLibrary(Book book, 
            IOpenLibraryService openLibraryService)
        {
            var viewModel = FromLocalBook(book);

            // Coba cari data tambahan dari Open Library
            OpenLibraryDoc? apiBook = null;
            
            // Cari berdasarkan ISBN jika ada
            if (!string.IsNullOrEmpty(book.Isbn))
            {
                apiBook = await openLibraryService.GetBookByIsbnAsync(book.Isbn);
            }
            
            // Jika tidak ada ISBN atau tidak ditemukan, cari berdasarkan title + author
            if (apiBook == null)
            {
                var searchResult = await openLibraryService.SearchBooksAsync($"{book.Title} {book.Author}");
                apiBook = searchResult?.Docs.FirstOrDefault();
            }

            if (apiBook != null)
            {
                // Enrich data yang kosong dengan data dari API
                if (string.IsNullOrEmpty(viewModel.Isbn))
                    viewModel.Isbn = apiBook.PrimaryIsbn ?? "";
                
                if (viewModel.Pages == null)
                    viewModel.Pages = apiBook.NumberOfPages;
                
                if (viewModel.Year == null)
                    viewModel.Year = apiBook.FirstPublishYear;
                
                if (viewModel.Publisher == "-" && !string.IsNullOrEmpty(apiBook.PrimaryPublisher))
                    viewModel.Publisher = apiBook.PrimaryPublisher;
                
                if (string.IsNullOrEmpty(viewModel.CoverUrl))
                    viewModel.CoverUrl = apiBook.CoverUrl;

                // Enrich synopsis jika kosong
                if ((viewModel.Synopsis == "-" || string.IsNullOrEmpty(viewModel.Synopsis)) && 
                    !string.IsNullOrEmpty(apiBook.WorkKey))
                {
                    var work = await openLibraryService.GetWorkAsync(apiBook.WorkKey);
                    if (work?.DescriptionText != null)
                    {
                        viewModel.Synopsis = work.DescriptionText;
                    }
                }

                // Get rating
                if (!string.IsNullOrEmpty(apiBook.WorkKey))
                {
                    var rating = await openLibraryService.GetWorkRatingAsync(apiBook.WorkKey);
                    if (rating?.Summary?.Average.HasValue == true)
                    {
                        viewModel.Rating = rating.Summary.Average;
                    }
                }

                // Enrich subjects
                if (apiBook.Subject?.Any() == true)
                {
                    viewModel.Subjects = apiBook.Subject;
                }

                // Set subtitle and language
                viewModel.Subtitle = apiBook.Subtitle;
                viewModel.Language = apiBook.Language?.FirstOrDefault();
                viewModel.IaId = apiBook.PrimaryIa;
                viewModel.OlKey = apiBook.Key;
            }

            return viewModel;
        }
    }
}