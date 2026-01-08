using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using paradaya_lentera.Services.Local;
using paradaya_lentera.Models.ViewModels;

namespace paradaya_lentera.Controllers
{
    public class AuthController(IUserService userService, ILogger<AuthController> logger) : Controller
    {
        private const int AuthCookieExpirationDays = 7;

        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                    return Redirect(returnUrl);
                return RedirectToAction("Index", "Page");
            }
            
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
        {
            if (!ModelState.IsValid)
            {
                ViewBag.ReturnUrl = returnUrl;
                return View(model);
            }

            try
            {
                var user = await userService.GetUserByEmailAsync(model.Email);
                if (user == null)
                {
                    ModelState.AddModelError("", "Email atau password tidak valid.");
                    ViewBag.ReturnUrl = returnUrl;
                    return View(model);
                }

                var isValidPassword = await userService.ValidatePasswordAsync(user, model.Password);
                if (!isValidPassword)
                {
                    ModelState.AddModelError("", "Email atau password tidak valid.");
                    ViewBag.ReturnUrl = returnUrl;
                    return View(model);
                }

                await SignInUserAsync(user.FullName, user.Email, "User", user.Id.ToString());
                
                // Redirect ke returnUrl jika ada dan valid, atau ke home
                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                    return Redirect(returnUrl);
                    
                return RedirectToAction("Index", "Page");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during login for email: {Email}", model.Email);
                ModelState.AddModelError("", "Terjadi kesalahan saat login. Silakan coba lagi.");
                ViewBag.ReturnUrl = returnUrl;
                return View(model);
            }
        }

        [HttpGet]
        public IActionResult Register()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                return RedirectToAction("Index", "Page");
            }
            return View();
        }

        // POST: Auth/Register
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            try
            {
                var emailExists = await userService.EmailExistsAsync(model.Email);
                if (emailExists)
                {
                    ModelState.AddModelError("Email", "Email sudah terdaftar. Silakan gunakan email lain.");
                    return View(model);
                }

                var user = await userService.CreateUserAsync(model.FullName, model.Email, model.Password);
                await SignInUserAsync(user.FullName, user.Email, "User", user.Id.ToString());
                
                TempData["SuccessMessage"] = "Akun berhasil dibuat! Selamat datang di Paradaya Lentera.";
                return RedirectToAction("Index", "Page");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during registration for email: {Email}", model.Email);
                ModelState.AddModelError("", "Terjadi kesalahan saat membuat akun. Silakan coba lagi.");
                return View(model);
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            TempData["InfoMessage"] = "Anda telah berhasil logout.";
            return RedirectToAction("Index", "Page");
        }

        private async Task SignInUserAsync(string name, string email, string role, string userId)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, name),
                new(ClaimTypes.Email, email),
                new(ClaimTypes.Role, role),
                new(ClaimTypes.NameIdentifier, userId.ToString())
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(AuthCookieExpirationDays)
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);
        }
    }
}