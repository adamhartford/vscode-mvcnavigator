using Microsoft.AspNetCore.Mvc;

namespace NavTest.Areas.Admin.Controllers;

public class MusicController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}