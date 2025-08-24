using Microsoft.AspNetCore.Mvc;

namespace NavTest.Controllers
{
    public class FullPathTestController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult TestTildePaths()
        {
            // Tilde path views
            return View("~/Views/Shared/_Layout.cshtml");
        }

        public IActionResult TestAbsolutePaths()
        {
            // Absolute path views
            return View("/Areas/Admin/Views/Shared/_AdminLayout.cshtml");
        }

        public IActionResult TestTildePartials()
        {
            // Tilde path partials
            return PartialView("~/Views/Shared/_Navigation.cshtml");
        }

        public IActionResult TestAbsolutePartials()
        {
            // Absolute path partials
            return PartialView("/Areas/Admin/Views/Shared/_AdminNav.cshtml");
        }

        public IActionResult TestWithModels()
        {
            var model = new { Title = "Test" };
            
            // Both path types with models
            var tildeResult = View("~/Views/Home/Index.cshtml", model);
            var absoluteResult = PartialView("/Areas/Something/Views/Shared/_MyPartial.cshtml", model);
            
            return tildeResult;
        }
    }
}
