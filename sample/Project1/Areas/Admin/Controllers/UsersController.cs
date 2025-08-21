using Microsoft.AspNetCore.Mvc;

namespace Project1.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class UsersController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Details()
        {
            return View("UserDetails");
        }

        public IActionResult Edit()
        {
            return View();
        }

        public IActionResult GetUserRow()
        {
            return PartialView("_UserRow");
        }

        public IActionResult GetUserForm()
        {
            return PartialView();
        }
    }
}
