using Microsoft.AspNetCore.Mvc;
using Project1.Models;

namespace Project1.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class UsersController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Details(int id = 1)
        {
            var user = GetUserById(id);
            return View("UserDetails", user);
        }

        public IActionResult Edit(int id = 1)
        {
            var user = GetUserById(id);
            return View(user);
        }

        public IActionResult GetUserRow(int id = 1)
        {
            var user = GetUserById(id);
            return PartialView("_UserRow", user);
        }

        public IActionResult GetUserForm(int id = 1)
        {
            var user = GetUserById(id);
            return PartialView(user);
        }

        private UserModel GetUserById(int id)
        {
            return new UserModel
            {
                Id = id,
                Name = $"Admin User {id}",
                Email = $"admin{id}@company.com",
                Role = "Administrator"
            };
        }
    }
}
