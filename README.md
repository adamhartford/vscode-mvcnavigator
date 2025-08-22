# ASP.NET MVC Navigator

A Visual Studio Code extension that provides intelligent navigation between ASP.NET MVC controllers, views, and actions, similar to the functionality found in JetBrains Rider and ReSharper.

## Demo

![ASP.NET MVC Navigator Demo](demo.gif)

## Features

### 🎯 **Controller Navigation**
Ctrl+click to navigate from controllers to views and actions:
- `View("About")` → jumps to `About.cshtml` 
- `View("~/Views/Shared/_Layout.cshtml")` → jumps to full path views
- `PartialView("_UserInfo")` → jumps to partial views
- `RedirectToAction("Login", "Account")` → jumps to `AccountController.Login()`
- `RedirectToAction("Index", "Product", new { area = "Admin" })` → jumps to actions in Areas

### 🌐 **View Navigation**  
Ctrl+click to navigate from views to controllers and actions:
- `@Html.ActionLink("Edit", "Edit", "Product")` → jumps to `ProductController.Edit()`
- `@Html.ActionLink("Details", "Details", new { id = 5 })` → jumps to current controller's `Details()` action
- `@Html.BeginForm("Create", "Product", FormMethod.Post)` → jumps to `ProductController.Create()` POST action
- `@Url.Action("Delete", "Product", new { area = "Admin" })` → jumps to actions in Areas
- `@Html.Partial("_UserCard")` → jumps to partial views
- `@await Html.PartialAsync("_ProductList")` → jumps to partial views

### 🏷️ **Tag Helper Support**
Full support for ASP.NET Core tag helpers:
- `<a asp-action="Details" asp-controller="Product" asp-area="Admin">` → jumps to controller actions in Areas
- `<a asp-action="Edit" asp-route-id="5">` → jumps to actions with route parameters
- `<form asp-action="Create" asp-controller="Product" method="post">` → jumps to POST actions
- `<form asp-action="Search" method="get">` → jumps to GET actions (HTTP method aware)
- `<partial name="_Navigation" />` → jumps to partial views
- `<partial name="~/Views/Shared/_Header.cshtml" />` → jumps to full path partial views

### 🔧 **HTML Helper Support**
Classic ASP.NET MVC HTML helpers:
- `@Html.ActionLink("Link Text", "Action", "Controller")` → jumps to controller actions
- `@Html.ActionLink("Edit", "Edit", new { id = Model.Id })` → handles route parameters
- `@Html.BeginForm("Submit", "Contact", FormMethod.Post)` → jumps to POST actions
- `@Url.Action("Index", "Home", new { area = "Admin" })` → generates URLs and enables navigation
- `@Html.Partial("_PartialName", Model)` → jumps to partial views with models

### 🏢 **Advanced Features**
- **Areas Support**: Navigate between Areas, controllers, and views seamlessly
- **HTTP Method Awareness**: POST forms navigate to POST actions, GET forms to GET actions
- **Multi-Project Workspaces**: Works across multiple ASP.NET projects in a single workspace
- **Smart Path Resolution**: Handles relative paths, full virtual paths (`~/`), and Area-specific routing
- **Parameterized Actions**: Navigate to actions with route parameters and anonymous objects

## Supported Patterns

### Controllers (C#)
- `View()`, `View("ViewName")`, `View("~/Path/To/View.cshtml")`
- `PartialView()`, `PartialView("PartialName")`
- `RedirectToAction()` with action, controller, and area parameters

### Views (Razor)
- `@Html.ActionLink()`, `@Html.BeginForm()`, `@Url.Action()`
- `@Html.Partial()`, `@await Html.PartialAsync()` 
- `<a asp-action="" asp-controller="" asp-area="">` tag helpers
- `<form asp-action="" asp-controller="" asp-area="">` tag helpers
- `<partial name="" />` tag helpers with regular names and full paths

## Compatibility

- ✅ ASP.NET MVC (.NET Framework)
- ✅ ASP.NET Core MVC (.NET Core/.NET 5+)
- ✅ Razor Pages projects
- ✅ Areas and multi-project solutions

## Usage

Simply Ctrl+click (or Cmd+click on Mac) on any MVC controller, action, or view name string in your code. The extension will:
1. 🔍 Analyze the code context
2. 🗂️ Locate the target file (controller, view, or action)  
3. 🚀 Navigate directly to the destination
4. 📍 Position the cursor at the exact method or view

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `mvcNavigator.enableDebugLogging` | `false` | Enable debug logging for troubleshooting navigation issues. Logs appear in the developer tools console. |