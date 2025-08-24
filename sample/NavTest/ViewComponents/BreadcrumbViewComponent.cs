using Microsoft.AspNetCore.Mvc;

namespace NavTest.ViewComponents
{
    public class BreadcrumbViewComponent : ViewComponent
    {
        public IViewComponentResult InvokeAsync(string currentPage, bool showHome = true)
        {
            var model = new { CurrentPage = currentPage, ShowHome = showHome };
            return View(model);
        }
    }
}
