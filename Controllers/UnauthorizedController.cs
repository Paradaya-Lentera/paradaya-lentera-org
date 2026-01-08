using Microsoft.AspNetCore.Mvc;

namespace paradaya_lentera.Controllers
{
    public class UnauthorizedController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}