using Microsoft.AspNetCore.Mvc;

namespace NavTest.Controllers;

// Test controller with non-standard naming in a shared file
public class TestController : ControllerBase
{
    public IActionResult SampleAction()
    {
        return Ok("Test action");
    }
}

// Another test controller
public class CustomController : Controller
{
    public IActionResult CustomAction()
    {
        return View();
    }
}

// One more test controller to verify fallback search
public class SharedController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
