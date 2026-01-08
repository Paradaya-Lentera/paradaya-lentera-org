using System.ComponentModel.DataAnnotations;

namespace paradaya_lentera.Models.ViewModels
{
    public class RegisterViewModel
    {
        [Required(ErrorMessage = "Nama lengkap wajib diisi.")]
        [StringLength(100, ErrorMessage = "Nama lengkap maksimal 100 karakter.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email wajib diisi.")]
        [EmailAddress(ErrorMessage = "Format email tidak valid.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password wajib diisi.")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password harus minimal 8 karakter.")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Konfirmasi password wajib diisi.")]
        [Compare("Password", ErrorMessage = "Password dan konfirmasi password tidak sama.")]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
