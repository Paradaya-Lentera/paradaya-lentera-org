using System.ComponentModel.DataAnnotations;

namespace paradaya_lentera.Models.Entities
{
    public class Book
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Judul buku harus diisi.")]
        [StringLength(200, ErrorMessage = "Judul tidak boleh lebih dari 200 karakter.")]
        public string Title { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Nama penulis tidak boleh lebih dari 100 karakter.")]
        public string? Author { get; set; }

        [StringLength(100, ErrorMessage = "Nama penerbit tidak boleh lebih dari 100 karakter.")]
        public string? Publisher { get; set; }

        [StringLength(50, ErrorMessage = "Nama kategori tidak boleh lebih dari 50 karakter.")]
        public string? Category { get; set; }

        [Url(ErrorMessage = "Format URL thumbnail tidak valid.")]
        public string? Thumbnail { get; set; }

        [StringLength(5000, ErrorMessage = "Deskripsi tidak boleh lebih dari 5000 karakter.")]
        public string? Description { get; set; }

        [Range(1000, 9999, ErrorMessage = "Tahun terbit tidak valid.")]
        public int? PublishedYear { get; set; }

        [Range(1, 10000, ErrorMessage = "Jumlah halaman harus antara 1-10000.")]
        public int? PageCount { get; set; }

        [StringLength(20, ErrorMessage = "ISBN tidak boleh lebih dari 20 karakter.")]
        public string? Isbn { get; set; }

        public string Source { get; set; } = "Local";

        public ICollection<ReadingList> ReadingLists { get; set; } = [];
    }
}
