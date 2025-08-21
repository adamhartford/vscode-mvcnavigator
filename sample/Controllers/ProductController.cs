using Microsoft.AspNetCore.Mvc;

namespace SampleMvcApp.Controllers
{
    public class ProductController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Edit(int id)
        {
            var viewModel = new ProductEditViewModel 
            { 
                Id = id, 
                Name = "Sample Product",
                Description = "Sample Description"
            };
            return View("ProductEdit", viewModel);
        }

        public IActionResult Create()
        {
            var viewModel = new ProductCreateViewModel();
            return View("ProductForm", viewModel);
        }

        public IActionResult Details(int id)
        {
            var model = GetProductById(id);
            return View("ProductDetails", model);
        }

        public IActionResult GetProductCard(int id)
        {
            var model = GetProductById(id);
            return PartialView("_ProductCard", model);
        }

        public IActionResult GetProductForm()
        {
            var viewModel = new ProductFormViewModel();
            return PartialView("_ProductForm", viewModel);
        }

        public IActionResult GetEditForm(int id)
        {
            var model = GetProductById(id);
            return PartialView("_EditForm", model);
        }

        private ProductModel GetProductById(int id)
        {
            return new ProductModel { Id = id, Name = $"Product {id}", Description = $"Description for product {id}" };
        }
    }

    public class ProductEditViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
    }

    public class ProductCreateViewModel
    {
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
    }

    public class ProductFormViewModel
    {
        public string Title { get; set; } = "Product Form";
    }

    public class ProductModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
