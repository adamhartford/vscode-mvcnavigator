using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace SampleMvcApp.Controllers
{
    /// <summary>
    /// Demo controller showing all navigation features supported by the MVC Navigator extension
    /// </summary>
    public class DemoController : Controller
    {
        // Basic view navigation examples
        public IActionResult Index()
        {
            return View(); // Should navigate to Index.cshtml
        }

        public IActionResult ExplicitView()
        {
            return View("CustomViewName"); // Should navigate to CustomViewName.cshtml
        }

        public IActionResult ViewWithModel()
        {
            var model = new { Name = "Test" };
            return View(model); // Should navigate to ViewWithModel.cshtml
        }

        // Partial view navigation examples
        public IActionResult PartialExample()
        {
            return PartialView("_DemoPartial"); // Should navigate to _DemoPartial.cshtml
        }

        public IActionResult ParameterlessPartial()
        {
            return PartialView(); // Should navigate to ParameterlessPartial.cshtml
        }

        // RedirectToAction navigation examples - NEW FEATURE!
        public IActionResult RedirectToSameController()
        {
            // Ctrl+click on "Index" should navigate to Index action above
            return RedirectToAction("Index");
        }

        public IActionResult RedirectToDifferentController()
        {
            // Ctrl+click on "Index" should navigate to HomeController.Index
            // Ctrl+click on "Home" should navigate to HomeController.cs
            return RedirectToAction("Index", "Home");
        }

        public IActionResult RedirectWithRouteValues()
        {
            // Ctrl+click on "ExplicitView" should navigate to ExplicitView action above
            return RedirectToAction("ExplicitView", new { id = 1, category = "demo" });
        }

        public IActionResult RedirectToErrorController()
        {
            // Ctrl+click on "NotFound" should navigate to ErrorController.NotFound
            // Ctrl+click on "Error" should navigate to ErrorController.cs
            return RedirectToAction("NotFound", "Error");
        }

        public IActionResult RedirectToDepartmentDetails()
        {
            // Ctrl+click on "DepartmentDetails" should navigate to DepartmentController.DepartmentDetails
            // Ctrl+click on "Department" should navigate to DepartmentController.cs
            return RedirectToAction("DepartmentDetails", "Department", new { id = 5 });
        }

        // Complex scenarios
        public async Task<IActionResult> AsyncRedirect()
        {
            await Task.Delay(100);
            
            // This should also work in async methods
            return RedirectToAction("Index", "Home");
        }

        public IActionResult MultipleCallsInMethod()
        {
            if (User?.Identity?.IsAuthenticated == true)
            {
                // Ctrl+click should work on both calls
                return RedirectToAction("Index");
            }
            else
            {
                return RedirectToAction("Login", "Account");
            }
        }
    }
}
