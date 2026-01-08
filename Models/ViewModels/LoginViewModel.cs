using System.ComponentModel.DataAnnotations;

namespace paradaya_lentera.Models.ViewModels
{
    public class LoginViewModel
    {
        [Required(ErrorMessage = "Email wajib diisi.")]
        [EmailAddress(ErrorMessage = "Format email tidak valid.")]
        [StringLength(255, ErrorMessage = "Email maksimal 255 karakter.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password wajib diisi.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Password tidak boleh kosong.")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
    }
}
