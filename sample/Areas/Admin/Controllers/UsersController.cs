using Microsoft.AspNetCore.Mvc;

namespace TestProject.Areas.Admin.Controllers
{
    public class UsersController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Details(int id)
        {
            // Test various RedirectToAction calls with area
            return RedirectToAction("Index", "Home", new { area = "Admin" });
        }

        public IActionResult Edit(int id)
        {
            // Test two-parameter area call
            return RedirectToAction("Index", new { area = "Admin" });
        }

        public IActionResult Delete(int id)
        {
            // Test three-parameter with area and other params
            return RedirectToAction("Details", "Users", new { area = "Admin", id = 1 });
        }

        public IActionResult Test()
        {
            // Test non-area call (should use general patterns)
            return RedirectToAction("Index", "Home", new { id = 1 });
        }
    }
}
