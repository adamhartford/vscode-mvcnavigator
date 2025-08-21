using Microsoft.AspNetCore.Mvc;

namespace SampleMvcApp.Controllers
{
    public class FullPathTestController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult TestFullPathView()
        {
            // This should navigate to the full path view file
            return View("~/Views/Home/About.cshtml");
        }

        public IActionResult TestFullPathPartialView()
        {
            // This should navigate to the full path partial view file  
            return PartialView("~/Views/Shared/_UserInfo.cshtml");
        }

        public IActionResult TestAreaFullPath()
        {
            // This should navigate to an area-specific view
            return View("~/Areas/Admin/Views/Users/Index.cshtml");
        }

        public IActionResult TestFullPathWithModel()
        {
            var model = new { Name = "Test" };
            // This should navigate to the full path view file with model
            return View("~/Views/Home/Index.cshtml", model);
        }

        public IActionResult TestPartialWithFullPathAndModel()
        {
            var model = new { Comments = new string[] { "Comment 1", "Comment 2" } };
            // This should navigate to the full path partial view file with model
            return PartialView("~/Views/Shared/_CommentsList.cshtml", model);
        }

        public IActionResult TestMixedPaths()
        {
            if (User?.Identity?.IsAuthenticated == true)
            {
                // Regular view name
                return View("Index");
            }
            else
            {
                // Full path
                return View("~/Views/Error/NotFound.cshtml");
            }
        }
    }
}
