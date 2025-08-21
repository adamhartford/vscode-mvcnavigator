using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace SampleMvcApp.Controllers
{
    public class ErrorController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public IActionResult NotFound()
        {
            var model = new ErrorViewModel { RequestId = "NotFound" };
            return View(model);
        }

        public IActionResult ServerError()
        {
            return View(new { 
                Message = "Internal Server Error", 
                StatusCode = 500 
            });
        }

        public IActionResult GetErrorPartial()
        {
            return PartialView(new ErrorViewModel { RequestId = "PartialError" });
        }

        public IActionResult GetCustomErrorPartial()
        {
            var errorModel = new ErrorViewModel { RequestId = "CustomError" };
            return PartialView(errorModel);
        }
    }

    public class ErrorViewModel
    {
        public string? RequestId { get; set; }
        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
    }
}
