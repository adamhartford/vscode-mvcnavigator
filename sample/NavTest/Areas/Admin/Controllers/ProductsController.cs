using Microsoft.AspNetCore.Mvc;

namespace NavTest.Areas.Admin.Controllers;

public class ProductsController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}