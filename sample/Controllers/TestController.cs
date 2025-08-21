using Microsoft.AspNetCore.Mvc;

namespace TestMvcApp.Controllers
{
    public class TestController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult About()
        {
            return View();
        }

        public IActionResult TestRedirects()
        {
            // Simple RedirectToAction - should navigate to About action in same controller
            return RedirectToAction("About");
        }

        public IActionResult TestRedirectWithController()
        {
            // RedirectToAction with controller - should navigate to Index action in Home controller
            return RedirectToAction("Index", "Home");
        }

        public IActionResult TestRedirectWithRouteValues()
        {
            // RedirectToAction with route values - should navigate to About action in same controller
            return RedirectToAction("About", new { id = 1, category = "test" });
        }

        public IActionResult TestRedirectWithControllerAndRouteValues()
        {
            // RedirectToAction with controller and route values - should navigate to Contact action in Home controller
            return RedirectToAction("Contact", "Home", new { id = 5 });
        }
    }
}
