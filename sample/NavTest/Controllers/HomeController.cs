using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using NavTest.Models;

namespace NavTest.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Index2()
    {
        return View("Index");
    }

    public IActionResult Index3()
    {
        return View(viewName: "Index");
    }

    public IActionResult Index4()
    {
        return RedirectToAction("Index");
    }

    public IActionResult MyHomeAction()
    {
        return RedirectToAction("Index");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Index(IFormCollection formCollection)
    {
        return Ok();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    public IActionResult Users()
    {
        return RedirectToAction("Index", "Users", new { area = "Admin" });
    }

    public IActionResult ControllerTest()
    {
        return View();
    }

    // Test methods for controller navigation fallback
    public IActionResult GoToTest()
    {
        return RedirectToAction("SampleAction", "Test");
    }

    public IActionResult GoToCustom()
    {
        return RedirectToAction("CustomAction", "Custom");
    }

    public IActionResult GoToShared()
    {
        return RedirectToAction("Index", "Shared");
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}

public class HomeViewComponent : ViewComponent
{
    public IViewComponentResult Invoke(string currentPage = "")
    {
        ViewBag.CurrentPage = currentPage;
        return View();
    }

    // public async Task<IViewComponentResult> InvokeAsync(string currentPage = "")
    // {
    //     ViewBag.CurrentPage = currentPage;
    //     return View();
    // }
}