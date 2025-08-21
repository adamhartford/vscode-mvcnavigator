using Microsoft.AspNetCore.Mvc;
using Project2.Models;

namespace Project2.Areas.Catalog.Controllers
{
    [Area("Catalog")]
    public class ProductsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Details(int id = 1)
        {
            var product = GetProductById(id);
            return View(product);
        }

        public IActionResult Create()
        {
            return View("ProductForm");
        }

        public IActionResult GetCategoryFilter()
        {
            var categories = GetCategories();
            return PartialView("_CategoryFilter", categories);
        }

        private ProductModel GetProductById(int id)
        {
            return new ProductModel 
            { 
                Id = id, 
                Name = $"Catalog Product {id}", 
                Description = $"Description for catalog product {id}",
                Price = 29.99m + id 
            };
        }

        private List<CategoryModel> GetCategories()
        {
            return new List<CategoryModel>
            {
                new CategoryModel { Id = 1, Name = "Electronics", ProductCount = 25 },
                new CategoryModel { Id = 2, Name = "Books", ProductCount = 150 },
                new CategoryModel { Id = 3, Name = "Clothing", ProductCount = 75 },
                new CategoryModel { Id = 4, Name = "Home & Garden", ProductCount = 45 }
            };
        }
    }
}
