using Microsoft.AspNetCore.Mvc;

namespace TestMvcApp.Controllers
{
    public class SimpleTestController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult About()
        {
            return View();
        }

        public IActionResult TestSimpleRedirect()
        {
            // This should work now - Ctrl+click on "Index" should navigate to Index action above
            return RedirectToAction("Index");
        }

        public IActionResult TestAnotherSimpleRedirect()
        {
            // This should work now - Ctrl+click on "About" should navigate to About action above
            return RedirectToAction("About");
        }

        public IActionResult TestWithSpaces()
        {
            // This should also work - Ctrl+click on "Index" should navigate to Index action above
            return RedirectToAction( "Index" );
        }
    }
}
