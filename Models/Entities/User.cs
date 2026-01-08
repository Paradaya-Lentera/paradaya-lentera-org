using System.ComponentModel.DataAnnotations;

namespace paradaya_lentera.Models.Entities
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = null!;

        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = null!;

        [Required]
        public string PasswordHash { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Property
        public ICollection<ReadingList> ReadingLists { get; set; } = [];
    }
}
