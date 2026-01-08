using paradaya_lentera.Models.Entities;

namespace paradaya_lentera.Services.Local
{
    public interface IUserService
    {
        Task<User?> GetUserByEmailAsync(string email);
        Task<User> CreateUserAsync(string fullName, string email, string password);
        Task<bool> ValidatePasswordAsync(User user, string password);
        Task<bool> EmailExistsAsync(string email);
    }
}