using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace NavTest.Controllers;

public abstract class ControllerBase : Controller
{
    protected string GetUrl()
    {
        var actionUrl = Url.Action("Index", "Products", new { Foo = "Bar", Area = "Admin" });
        return actionUrl ?? string.Empty;
    }
}