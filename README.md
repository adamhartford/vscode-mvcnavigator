# ASP.NET MVC Navigator

A Visual Studio Code extension that provides intelligent navigation between ASP.NET MVC controllers, views, and actions, similar to the functionality found in JetBrains Rider and ReSharper.

## Demo

![ASP.NET MVC Navigator Demo](demo.gif)

## What it does

**In Controllers:**
- Ctrl+click `View("About")` → jumps to `About.cshtml`
- Ctrl+click `RedirectToAction("Login", "Account")` → jumps to `AccountController.Login()`

**In Views:**
- Ctrl+click `@Html.ActionLink("Home", "Index")` → jumps to `HomeController.Index()`
- Ctrl+click `<a asp-action="Details" asp-controller="Product">` → jumps to `ProductController.Details()`

## What's supported

- `View()` and `PartialView()` calls
- `RedirectToAction()` calls  
- `@Html.ActionLink()`, `@Html.BeginForm()`, `@Url.Action()`
- ASP.NET Core tag helpers (`asp-action`, `asp-controller`)
- Areas and multi-project workspaces
- HTTP method-aware navigation (POST forms → POST actions)

Works with ASP.NET MVC and ASP.NET Core projects.