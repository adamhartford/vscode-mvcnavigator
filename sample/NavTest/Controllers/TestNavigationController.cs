using Microsoft.AspNetCore.Mvc;

namespace NavTest.Controllers;

public class TestNavigationController : Controller
{
    public IActionResult Index()
    {
        // This should navigate to CustomController at line 15, not TestController at line 6
        return RedirectToAction("CustomAction", "Custom");
    }

    public IActionResult TestFallback()
    {
        // Test navigation to SharedController at line 24
        return RedirectToAction("Index", "Shared");
    }
}
