using Microsoft.AspNetCore.Mvc;

namespace NavTest.Areas.Admin.Controllers;

public class ProductsController : Controller
{
    public IActionResult Index()
    {
        return View();
        return View(new List<int>());
        return Ok();
    }

    public IActionResult Detail(int homeId)
    {
        return View("Index");
        return View("Index", new List<int>());

        return RedirectToAction("Index");
        return RedirectToAction("Index", "Home", new { HomeId = homeId });
        return RedirectToAction("Index", "Home", new { Foo = "Bar", Baz=1, Area = "Admin" });
        return RedirectToAction("MyHomeAction", "Home", new { HomeId = homeId });

        return RedirectToAction("Index", "Home", new { area = "" });
        return RedirectToAction("Index", "Home", new { area = "Admin" });
        return RedirectToRoute("default", new { controller = "Home", action = "Index", HomeId = homeId });
    }
}