using Microsoft.AspNetCore.Mvc;

namespace Project1.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult About()
        {
            return View("About");
        }

        public IActionResult GetHeader()
        {
            return PartialView("_Header");
        }
    }
}
