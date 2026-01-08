using System.ComponentModel.DataAnnotations;

namespace paradaya_lentera.Models.Entities
{
    public class ReadingList
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        public bool IsFavorite { get; set; }
        public bool IsRead { get; set; }
        [Required]
        public int BookId { get; set; }
        
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public User User { get; set; } = null!;
        public Book Book { get; set; } = null!;
    }
}
