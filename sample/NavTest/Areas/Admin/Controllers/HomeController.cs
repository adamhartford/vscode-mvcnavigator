using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace NavTest.Areas.Admin.Controllers;

public class HomeController : AdminControllerBase
{
    public IActionResult MyHomeAction(int homeId)
    {
        return Content("OK");
    }

    public IActionResult Index()
    {
        return Content("Index");
    }
}
