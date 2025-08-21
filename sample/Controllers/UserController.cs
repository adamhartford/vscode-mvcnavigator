using Microsoft.AspNetCore.Mvc;

namespace SampleMvcApp.Controllers
{
    public class UserController : Controller
    {
        public IActionResult GetUserInfo(int id = 1)
        {
            var user = GetUserById(id);
            return PartialView("_UserInfo", user);
        }

        private UserModel GetUserById(int id)
        {
            return new UserModel
            {
                Id = id,
                Name = $"User {id}",
                Email = $"user{id}@example.com",
                Role = "Customer"
            };
        }
    }

    public class UserModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Role { get; set; } = "";
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
