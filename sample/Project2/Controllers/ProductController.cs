using Microsoft.AspNetCore.Mvc;
using Project2.Models;

namespace Project2.Controllers
{
    public class ProductController : Controller
    {
        public IActionResult List()
        {
            var products = GetProducts();
            return View(products);
        }

        public IActionResult Details(int id = 1)
        {
            var product = GetProductById(id);
            return View("ProductDetails", product);
        }

        public IActionResult GetProductCard(int id = 1)
        {
            var product = GetProductById(id);
            return PartialView("_ProductCard", product);
        }

        private List<ProductModel> GetProducts()
        {
            return new List<ProductModel>
            {
                new ProductModel { Id = 1, Name = "Laptop", Description = "High-performance laptop", Price = 999.99m },
                new ProductModel { Id = 2, Name = "Mouse", Description = "Wireless mouse", Price = 29.99m },
                new ProductModel { Id = 3, Name = "Keyboard", Description = "Mechanical keyboard", Price = 79.99m }
            };
        }

        private ProductModel GetProductById(int id)
        {
            var products = GetProducts();
            return products.FirstOrDefault(p => p.Id == id) ?? products.First();
        }
    }
}
