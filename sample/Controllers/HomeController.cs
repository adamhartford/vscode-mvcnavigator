using Microsoft.AspNetCore.Mvc;

namespace SampleMvcApp.Controllers
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

        public IActionResult Contact()
        {
            return View("Contact");
        }

        public IActionResult Privacy()
        {
            return View("PrivacyPolicy");
        }

        public IActionResult CustomView()
        {
            return View("MyCustomView");
        }

        public IActionResult Error()
        {
            return View("Error");
        }
    }
}
