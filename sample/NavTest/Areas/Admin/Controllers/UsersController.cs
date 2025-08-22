using Microsoft.AspNetCore.Mvc;

namespace NavTest.Areas.Admin.Controllers;

public class UsersController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}