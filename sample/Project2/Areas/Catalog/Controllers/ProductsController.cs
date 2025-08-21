using Microsoft.AspNetCore.Mvc;

namespace Project2.Areas.Catalog.Controllers
{
    [Area("Catalog")]
    public class ProductsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Details()
        {
            return View();
        }

        public IActionResult Create()
        {
            return View("ProductForm");
        }

        public IActionResult GetCategoryFilter()
        {
            return PartialView("_CategoryFilter");
        }
    }
}
