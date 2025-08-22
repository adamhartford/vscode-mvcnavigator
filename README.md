# ASP.NET MVC Navigator

A Visual Studio Code extension that provides intelligent navigation between ASP.NET MVC controllers, views, and actions, similar to the functionality found in JetBrains Rider and ReSharper.

## Demo

<video width="800" controls>
  <source src="demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

*Watch the extension in action: Ctrl+click navigation between controllers, views, and actions with support for HTML helpers, tag helpers, and HTTP method-aware routing.*

## Features

- **Ctrl+Click Navigation**: Navigate from controller actions to their corresponding views by Ctrl+clicking on view names in `View()` and `PartialView()` calls
- **RedirectToAction Navigation**: Navigate to action methods by Ctrl+clicking on action names or controller names in `RedirectToAction()` calls
- **Razor View Navigation**: Navigate to action methods from Razor views using `@Url.Action()`, `@Html.ActionLink()`, and `@Html.BeginForm()` calls
- **ASP.NET Core Tag Helper Support**: Navigate to action methods and controllers from modern tag helpers like `<a asp-action="..." asp-controller="...">` and `<form asp-action="..." asp-controller="...">`
- **Underlined View Names**: View names in `View("ViewName")` and `PartialView("_PartialName")` calls are automatically underlined and made clickable
- **Underlined Action/Controller Names**: Action names and controller names in `RedirectToAction()`, `@Url.Action()`, `@Html.ActionLink()`, `@Html.BeginForm()`, and tag helper attributes are automatically underlined and made clickable
- **Parameterless Call Support**: Both `View()` and `PartialView()` calls without parameters automatically resolve to action-named views
- **Multi-Project Workspace Support**: Automatically detects and handles multiple ASP.NET MVC projects within a single VS Code workspace
- **Smart Project Root Detection**: Intelligently identifies MVC project boundaries by looking for .csproj files, Views folders, Controllers folders, and other MVC indicators
- **Multiple Project Structure Support**: Works with various ASP.NET MVC project structures including:
  - Standard MVC structure (`Views/Controller/ViewName.cshtml`)
  - Areas-based structure (`Areas/AreaName/Views/Controller/ViewName.cshtml`) 
  - Shared views (`Views/Shared/ViewName.cshtml`)
  - Custom project structures
- **Multiple File Types**: Supports both `.cshtml` and `.razor` view files
- **Smart Controller Name Detection**: Automatically extracts controller names from file names (removes "Controller" suffix)
- **Partial View Priority**: For partial views, searches controller-specific folders first, then Shared folder (following ASP.NET MVC conventions)

## Usage

1. Open any C# controller file in your ASP.NET MVC project
2. Locate a `View()`, `PartialView()`, or `RedirectToAction()` call with names, e.g., `return View("MyView");`, `return PartialView("_MyPartial");`, or `return RedirectToAction("MyAction", "MyController");`
3. The view name, action name, or controller name will be automatically underlined
4. Ctrl+click on the name to navigate to the corresponding `.cshtml`/`.razor` file or action method
5. Alternatively, use the command palette (Ctrl+Shift+P) and search for:
   - "Navigate to View" when your cursor is on a line with a View() or PartialView() call
   - "Navigate to Action Method" to navigate to a specific action
   - "Navigate to Controller Class" to navigate to a controller file

### For Razor Views

1. Open any `.cshtml` or `.razor` view file in your ASP.NET MVC project
2. Locate a `@Url.Action()`, `@Html.ActionLink()`, or `@Html.BeginForm()` call with action names, e.g., `@Url.Action("About", "Home")`, `@Html.ActionLink("Link Text", "About", "Home")`, or `@Html.BeginForm("Submit", "Home")`
3. Note: `Html.BeginForm()` and `Html.ActionLink()` calls work both with and without the `@` prefix (e.g., within `@using` blocks)
4. The action name and controller name will be automatically underlined
5. Ctrl+click on the action or controller name to navigate to the corresponding action method or controller file

## Supported Call Patterns

### View() and PartialView() Patterns

The extension recognizes various patterns of View() and PartialView() calls:

```csharp
return View("ViewName");        // Navigates to ViewName.cshtml
return View("ViewName", model); // Navigates to ViewName.cshtml  
return View();                  // Navigates to {ActionName}.cshtml (follows MVC convention)
return View(model);             // Navigates to {ActionName}.cshtml (follows MVC convention)
return View(new ErrorViewModel { RequestId = "123" }); // Navigates to {ActionName}.cshtml
View("ViewName")               // Navigates to ViewName.cshtml
return View( "ViewName" );     // with spaces - Navigates to ViewName.cshtml

return PartialView("_PartialName");     // Navigates to _PartialName.cshtml
return PartialView("_PartialName", model); // Navigates to _PartialName.cshtml
return PartialView();                   // Navigates to {ActionName}.cshtml (follows MVC convention)
return PartialView(model);              // Navigates to {ActionName}.cshtml (follows MVC convention)
return PartialView(new Model { Property = "value" }); // Navigates to {ActionName}.cshtml
PartialView("_PartialName")            // Navigates to _PartialName.cshtml
```

**View() with Model Support**: The extension now supports View() and PartialView() calls that pass model objects or create new instances. These are treated as convention-based calls where the view name matches the action method name.

### Full Path Support for View() and PartialView()

The extension supports full path navigation for View() and PartialView() calls with absolute paths:

```csharp
return View("~/Views/Home/About.cshtml");                    // Navigates to the exact file
return View("~/Areas/Admin/Views/Users/Index.cshtml");       // Navigates to area-specific view
return PartialView("~/Views/Shared/_UserInfo.cshtml");       // Navigates to shared partial view
return View("~/Views/Home/Index.cshtml", model);             // Full path with model
return PartialView("~/Views/Shared/_Comments.cshtml", model); // Full path partial with model
```

**Full Path Features**:
- **Absolute Path Navigation**: Paths starting with `~/` are resolved relative to the project root
- **Area Support**: Works with Areas-based paths like `~/Areas/AreaName/Views/...`
- **Multiple Extensions**: Supports both `.cshtml` and `.razor` file extensions
- **Cross-Project**: Searches across multiple project roots in the workspace
- **Mixed Usage**: Can be used alongside regular view names in the same controller

### RedirectToAction() Patterns

The extension recognizes various patterns of RedirectToAction() calls:

```csharp
return RedirectToAction("ActionName");           // Navigates to ActionName method in same controller
return RedirectToAction("ActionName", "ControllerName");  // Navigates to ActionName method in ControllerNameController
return RedirectToAction("ActionName", "ControllerName", new { id = 1 });  // Both action and controller are clickable
return RedirectToAction("ActionName", new { id = 1, category = "test" });  // Navigates to ActionName method in same controller
return RedirectToAction("ActionName", "ControllerName", new { area = "Admin" });  // Area-aware navigation
return RedirectToAction("Index", "Home", new { area = "Area1", id = 5 });  // Navigates to correct area
RedirectToAction("ActionName")                   // Navigates to ActionName method
RedirectToAction( "ActionName" , "ControllerName" ); // with spaces - Both parts are clickable
```

**RedirectToAction Navigation Features**:
- **Action Names**: Ctrl+click on action names to navigate to the corresponding action method
- **Controller Names**: Ctrl+click on controller names to navigate to the controller file
- **Same Controller**: When only action name is specified, searches within the current controller
- **Cross-Controller**: When both action and controller are specified, navigates to the target controller
- **Route Values Support**: Works with RedirectToAction calls that include route values (anonymous objects)
- **Area-Aware Navigation**: When `area = "AreaName"` is specified in route values, navigates to the controller in the correct area folder
- **Precise Navigation**: Navigates directly to the action method line, not just the file

**Area Support**: The extension intelligently detects area information from route values:
```csharp
return RedirectToAction("Index", "Home", new { area = "Admin" });      // → Areas/Admin/Controllers/HomeController.cs
return RedirectToAction("Create", "User", new { area = "Management" }); // → Areas/Management/Controllers/UserController.cs
return RedirectToAction("List", "Product", new { area = "Catalog", page = 1 }); // → Areas/Catalog/Controllers/ProductController.cs
```

**Parameterless View() Calls**: When you use `return View();` without specifying a view name, the extension automatically determines the view name based on the current action method name, following standard ASP.NET MVC conventions.

**PartialView Support**: The extension fully supports `PartialView()` calls, both with explicit names and parameterless calls. Partial views are searched in controller-specific folders first, then in the Shared folder, which is the most common location for partial views.

### @Url.Action() Patterns in Razor Views

The extension also provides navigation for `@Url.Action()` calls in Razor views:

```csharp
@Url.Action("ActionName")                                    // Navigates to ActionName method in current controller
@Url.Action("ActionName", "ControllerName")                 // Navigates to ActionName method in ControllerNameController
@Url.Action("ActionName", "ControllerName", new { id = 1 }) // Both action and controller are clickable
@Url.Action("ActionName", new { area = "" })                // Navigates to ActionName method with route values
```

### @Html.ActionLink() Patterns in Razor Views

The extension supports navigation for `@Html.ActionLink()` calls in Razor views:

```csharp
@Html.ActionLink("Link Text", "ActionName")                           // Navigates to ActionName method in current controller
@Html.ActionLink("Link Text", "ActionName", "ControllerName")         // Navigates to ActionName method in ControllerNameController
@Html.ActionLink("Link Text", "ActionName", "ControllerName", new { id = 1 }) // Both action and controller are clickable
@Html.ActionLink("Link Text", "ActionName", new { area = "" })        // Navigates to ActionName method with route values
```

### @Html.BeginForm() Patterns in Razor Views

The extension supports navigation for `@Html.BeginForm()` calls in Razor views:

```csharp
@Html.BeginForm("ActionName")                                    // Navigates to ActionName method in current controller
@Html.BeginForm("ActionName", "ControllerName")                 // Navigates to ActionName method in ControllerNameController
@Html.BeginForm("ActionName", "ControllerName", new { id = 1 }) // Both action and controller are clickable
@Html.BeginForm("ActionName", new { area = "" })                // Navigates to ActionName method with route values
```

### ASP.NET Core Tag Helper Patterns in Razor Views

The extension supports modern ASP.NET Core tag helper navigation:

```html
<!-- Anchor Tag Helpers -->
<a asp-action="Index" asp-controller="Home">Home</a>                    // Navigates to Index action in HomeController
<a asp-action="Details" asp-controller="Product" asp-area="Admin">      // Navigates to Details action in Admin area ProductController
    Product Details
</a>
<a asp-action="Edit" asp-controller="User">Edit User</a>                // Both action and controller names are clickable

<!-- Form Tag Helpers -->
<form asp-action="Create" asp-controller="User" method="post">          // Navigates to Create action in UserController
    <input type="submit" value="Create" />
</form>
<form asp-action="Update" asp-controller="Product" asp-area="Catalog">  // Navigates to Update action in Catalog area ProductController
    <input type="submit" value="Update" />
</form>

<!-- Flexible Formatting -->
<a asp-action = "Delete"                                               // Works with flexible spacing
   asp-controller="User" 
   asp-route-id="123">Delete</a>

<a asp-action='Edit' asp-controller='Product' asp-area='Admin'>        // Works with single quotes
    Edit Product
</a>
```

**Tag Helper Navigation Features**:
- **Action Names**: Ctrl+click on action values in `asp-action` attributes to navigate to the corresponding action method
- **Controller Names**: Ctrl+click on controller values in `asp-controller` attributes to navigate to the controller file
- **Area Support**: Full support for `asp-area` attributes with area-aware navigation
- **Flexible Formatting**: Works with various quote styles (single/double) and spacing
- **Modern ASP.NET Core**: Provides navigation for current tag helper syntax alongside traditional HTML helpers
- **Mixed Usage**: Can be used alongside traditional @Html helpers in the same view

**Razor View Navigation Features**:
- **Action Names**: Ctrl+click on action names to navigate to the corresponding action method
- **Controller Names**: Ctrl+click on controller names to navigate to the controller file
- **Cross-Controller**: When both action and controller are specified, navigates to the target controller
- **Route Values Support**: Works with calls that include route values (anonymous objects)
- **Multiple HTML Helpers**: Supports @Url.Action, @Html.ActionLink, and @Html.BeginForm equally

## Multi-Project Workspace Support

The extension excels at handling workspaces with multiple ASP.NET MVC projects:

```
WorkspaceRoot/
├── Project1/
│   ├── Project1.csproj
│   ├── Controllers/
│   │   └── HomeController.cs
│   └── Views/
│       └── Home/
│           └── Index.cshtml
├── Project2/
│   ├── Project2.csproj
│   ├── Controllers/
│   │   └── ProductController.cs
│   └── Views/
│       └── Product/
│           └── List.cshtml
└── SharedLibrary/
    └── Models/
```

### How Multi-Project Detection Works:

1. **Smart Project Root Detection**: When you Ctrl+click a view name, the extension:
   - Starts from the controller file's location
   - Walks up the directory tree to find MVC project indicators
   - Looks for `.csproj` files, `Views` folders, `Controllers` folders, `Program.cs`, `Startup.cs`, or `wwwroot` folders
   - Identifies the correct project boundary

2. **Area-Aware Navigation**: The extension automatically detects if a controller is in an Area:
   - Recognizes Area path patterns: `Areas/{AreaName}/Controllers/{Controller}.cs`
   - Prioritizes Area-specific view locations: `Areas/{AreaName}/Views/{Controller}/{View}.cshtml`
   - Falls back to Area shared views: `Areas/{AreaName}/Views/Shared/{View}.cshtml`
   - Provides fallback to main shared views when needed

3. **Project-Relative Path Resolution**: Views are searched relative to the detected project root, not the workspace root

4. **Isolated Project Navigation**: Controllers in Project1 will only navigate to views within Project1's structure, preventing cross-project confusion

## Project Structure Support

The extension automatically searches for view files in these locations:

- `Views/{ControllerName}/{ViewName}.cshtml`
- `Views/{ControllerName}/{ViewName}.razor`
- `Areas/{AreaName}/Views/{ControllerName}/{ViewName}.cshtml` (for Area controllers)
- `Areas/{AreaName}/Views/{ControllerName}/{ViewName}.razor` (for Area controllers)
- `Areas/{AreaName}/Views/Shared/{ViewName}.cshtml` (for Area controllers)
- `Areas/{AreaName}/Views/Shared/{ViewName}.razor` (for Area controllers)
- `Areas/*/Views/{ControllerName}/{ViewName}.cshtml` (fallback search)
- `Areas/*/Views/{ControllerName}/{ViewName}.razor` (fallback search)
- `Views/Shared/{ViewName}.cshtml`
- `Views/Shared/{ViewName}.razor`
- `wwwroot/Views/{ControllerName}/{ViewName}.cshtml`
- `src/Views/{ControllerName}/{ViewName}.cshtml`
- `Web/Views/{ControllerName}/{ViewName}.cshtml`

## Areas Support

The extension provides full support for ASP.NET MVC Areas with intelligent path resolution:

### Area Controller Detection
- Automatically detects when a controller is in an Area by analyzing the file path
- Recognizes the pattern: `Areas/{AreaName}/Controllers/{Controller}.cs`

### Area View Resolution Priority
For Area controllers (e.g., `Areas/Admin/Controllers/UsersController.cs`):
1. **Area-specific views**: `Areas/Admin/Views/Users/{ViewName}.cshtml`
2. **Area shared views**: `Areas/Admin/Views/Shared/{ViewName}.cshtml`
3. **Main shared views**: `Views/Shared/{ViewName}.cshtml` (fallback)

### Example Area Structure
```
Project/
├── Areas/
│   ├── Admin/
│   │   ├── Controllers/
│   │   │   └── UsersController.cs
│   │   └── Views/
│   │       ├── Users/
│   │       │   ├── Index.cshtml
│   │       │   └── Details.cshtml
│   │       └── Shared/
│   │           └── _AdminLayout.cshtml
│   └── Catalog/
│       ├── Controllers/
│       │   └── ProductsController.cs
│       └── Views/
│           ├── Products/
│           │   └── Index.cshtml
│           └── Shared/
│               └── _CatalogPartial.cshtml
└── Views/
    └── Shared/
        └── _Layout.cshtml
```

## Requirements

- Visual Studio Code 1.103.0 or higher
- ASP.NET MVC or ASP.NET Core MVC project
- C# language support (C# extension recommended)

## Commands

- `ASP.NET MVC Navigator: Navigate to View` - Manually navigate to a view from the current cursor position
- `ASP.NET MVC Navigator: Navigate to Action Method` - Navigate to a specific action method
- `ASP.NET MVC Navigator: Navigate to Controller Class` - Navigate to a controller class definition

## Development

### Testing

Run the test suite with:
```bash
npm test
```

### Project Structure

- `src/` - Extension source code
- `src/test/` - Official unit tests
- `test-scripts/` - Development/debugging scripts (not part of the main test suite)
- `sample/` - Sample MVC projects for testing

## Known Issues

- Method name detection for parameterless View() calls works with standard method patterns but may not work with very complex method signatures
- Area detection relies on standard ASP.NET MVC folder conventions

## Release Notes

### 0.0.1

Initial release with basic controller-to-view navigation functionality.