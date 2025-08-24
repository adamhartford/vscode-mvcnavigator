using Microsoft.AspNetCore.Mvc;

namespace NavTest.Controllers
{
    public class TestViewComponentController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult WithNavigationMenu()
        {
            // This should navigate to NavigationMenuViewComponent
            return ViewComponent("NavigationMenu");
        }

        public IActionResult WithProductList()
        {
            // This should navigate to ProductListViewComponent
            var model = new { CategoryId = 1 };
            return ViewComponent("ProductList", model);
        }

        public IActionResult WithBreadcrumb()
        {
            // This should navigate to BreadcrumbViewComponent with parameters
            return ViewComponent("Breadcrumb", new { 
                CurrentPage = "Home", 
                ShowHome = true 
            });
        }
    }
}
