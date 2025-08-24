using Microsoft.AspNetCore.Mvc;

namespace NavTest.ViewComponents
{
    public class TestViewComponent : ViewComponent
    {
        public IViewComponentResult InvokeAsync()
        {
            // Standard view component view - this should work
            return View();
        }

        public IViewComponentResult InvokeAsyncWithName()
        {
            // Named view - this should work
            return View("CustomView");
        }

        public IViewComponentResult InvokeAsyncWithFullPath()
        {
            // Full path view - this should now work
            var model = new { Message = "Test" };
            return View("/Areas/Something/Views/Shared/_MyPartial.cshtml", model);
        }

        public IViewComponentResult InvokeAsyncWithTildePath()
        {
            // Tilde path view - this should work
            var model = new { Message = "Test" };
            return View("~/Views/Shared/_GlobalPartial.cshtml", model);
        }
    }
}
