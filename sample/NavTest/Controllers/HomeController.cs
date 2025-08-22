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

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
