using Microsoft.AspNetCore.Mvc;

namespace NavTest.ViewComponents
{
    public class NavigationMenuViewComponent : ViewComponent
    {
        // public IViewComponentResult Invoke(string currentPage = "")
        // {
        //     ViewBag.CurrentPage = currentPage;
        //     return View();
        // }

        public async Task<IViewComponentResult> InvokeAsync(string currentPage = "")
        {
            ViewBag.CurrentPage = currentPage;
            return View();
        }
    }
}
