using Microsoft.AspNetCore.Mvc;

namespace SampleMvcApp.Controllers
{
    public class PathVariationsController : Controller
    {
        public IActionResult TestDifferentQuotes()
        {
            // Test with double quotes
            var result1 = View("~/Views/Home/About.cshtml");
            
            // Test with single quotes (actually double quotes - C# doesn't support single quote strings)
            var result2 = View("~/Views/Home/Contact.cshtml");
            
            // Test PartialView with double quotes
            var result3 = PartialView("~/Views/Shared/_Header.cshtml");
            
            return result1;
        }

        public IActionResult TestWithSpaces()
        {
            // Test with spaces around the path
            return View( "~/Views/Home/Index.cshtml" );
        }

        public IActionResult TestDifferentExtensions()
        {
            // Test with .cshtml extension
            var result1 = View("~/Views/Home/About.cshtml");
            
            // Test with .razor extension (for Blazor/Razor Pages)
            var result2 = View("~/Views/Home/About.razor");
            
            return result1;
        }

        public IActionResult TestComplexPaths()
        {
            // Test with complex area path
            return View("~/Areas/Administration/Views/UserManagement/Details.cshtml");
        }

        public IActionResult TestEdgeCases()
        {
            // Test normal view call (should not be affected)
            var normal = View("About");
            
            // Test full path call
            var fullPath = View("~/Views/Home/About.cshtml");
            
            // Test parameterless call (should not be affected)
            return View();
        }
    }
}
