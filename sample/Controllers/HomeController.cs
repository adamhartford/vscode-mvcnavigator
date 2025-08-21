using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace SampleMvcApp.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult About()
        {
            return View("About");
        }

        public IActionResult Contact()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View("PrivacyPolicy");
        }

        public IActionResult CustomView()
        {
            return View("MyCustomView");
        }

        public IActionResult Error()
        {
            return View();
        }

        public async Task<IActionResult> AsyncAction()
        {
            await Task.Delay(100);
            return View();
        }

        public ActionResult<string> ApiAction()
        {
            return View();
        }
    }
}
