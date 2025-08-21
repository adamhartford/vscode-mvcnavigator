using Microsoft.AspNetCore.Mvc;

namespace Project2.Controllers
{
    public class ProductController : Controller
    {
        public IActionResult List()
        {
            return View();
        }

        public IActionResult Details()
        {
            return View("ProductDetails");
        }

        public IActionResult GetProductCard()
        {
            return PartialView("_ProductCard");
        }
    }
}
