using System.Text.Json.Serialization;

namespace paradaya_lentera.Models.External.OpenLibrary
{
    public class OpenLibrarySearchResponse
    {
        [JsonPropertyName("numFound")]
        public int NumFound { get; set; }

        [JsonPropertyName("docs")]
        public List<OpenLibraryDoc> Docs { get; set; } = [];
    }

    public class OpenLibraryDoc
    {
        [JsonPropertyName("key")]
        public string Key { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("author_name")]
        public List<string>? AuthorName { get; set; }

        [JsonPropertyName("first_publish_year")]
        public int? FirstPublishYear { get; set; }

        [JsonPropertyName("isbn")]
        public List<string>? Isbn { get; set; }

        [JsonPropertyName("cover_i")]
        public int? CoverI { get; set; }

        [JsonPropertyName("number_of_pages_median")]
        public int? NumberOfPages { get; set; }

        [JsonPropertyName("publisher")]
        public List<string>? Publisher { get; set; }

        [JsonPropertyName("subject")]
        public List<string>? Subject { get; set; }

        [JsonPropertyName("ia")]
        public List<string>? Ia { get; set; }

        [JsonPropertyName("ia_box_id")]
        public List<string>? IaBoxId { get; set; }

        [JsonPropertyName("language")]
        public List<string>? Language { get; set; }

        [JsonPropertyName("subtitle")]
        public string? Subtitle { get; set; }

        // Computed properties
        public string CoverUrl => CoverI.HasValue 
            ? $"https://covers.openlibrary.org/b/id/{CoverI}-M.jpg" 
            : "https://via.placeholder.com/150x200?text=No+Cover";
            
        public string? PrimaryIsbn => Isbn?.FirstOrDefault();
        
        public string? PrimaryIa => Ia?.FirstOrDefault();
        
        public string? BorrowUrl => !string.IsNullOrEmpty(PrimaryIa) 
            ? $"https://archive.org/details/{PrimaryIa}" 
            : null;

        public string? PrimaryPublisher => Publisher?.FirstOrDefault();

        public string WorkKey => Key.Replace("/works/", "");
    }

    // Model untuk Work detail (untuk mendapatkan description)
    public class OpenLibraryWork
    {
        [JsonPropertyName("key")]
        public string Key { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public object? Description { get; set; }

        [JsonPropertyName("subjects")]
        public List<string>? Subjects { get; set; }

        [JsonPropertyName("authors")]
        public List<OpenLibraryAuthorRef>? Authors { get; set; }

        [JsonPropertyName("covers")]
        public List<int>? Covers { get; set; }

        // Helper property untuk description
        public string? DescriptionText
        {
            get
            {
                if (Description == null) return null;
                
                // Description bisa berupa string atau object dengan property "value"
                if (Description is string str)
                    return str;
                
                if (Description is System.Text.Json.JsonElement element)
                {
                    if (element.ValueKind == System.Text.Json.JsonValueKind.String)
                        return element.GetString();
                    
                    if (element.ValueKind == System.Text.Json.JsonValueKind.Object && 
                        element.TryGetProperty("value", out var valueProperty))
                        return valueProperty.GetString();
                }
                
                return null;
            }
        }
    }

    public class OpenLibraryAuthorRef
    {
        [JsonPropertyName("author")]
        public OpenLibraryAuthorKey? Author { get; set; }
    }

    public class OpenLibraryAuthorKey
    {
        [JsonPropertyName("key")]
        public string Key { get; set; } = string.Empty;
    }

    // Model untuk Rating
    public class OpenLibraryRating
    {
        [JsonPropertyName("summary")]
        public OpenLibraryRatingSummary? Summary { get; set; }
    }

    public class OpenLibraryRatingSummary
    {
        [JsonPropertyName("average")]
        public double? Average { get; set; }

        [JsonPropertyName("count")]
        public int? Count { get; set; }
    }
}
