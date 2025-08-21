# ASP.NET MVC Navigator

A Visual Studio Code extension that provides intelligent navigation between ASP.NET MVC controllers, views, and actions, similar to the functionality found in JetBrains Rider and ReSharper.

## Features

- **Ctrl+Click Navigation**: Navigate from controller actions to their corresponding views by Ctrl+clicking on view names in `View()` and `PartialView()` calls
- **RedirectToAction Navigation**: Navigate to action methods by Ctrl+clicking on action names or controller names in `RedirectToAction()` calls
- **Underlined View Names**: View names in `View("ViewName")` and `PartialView("_PartialName")` calls are automatically underlined and made clickable
- **Underlined Action/Controller Names**: Action names and controller names in `RedirectToAction()` calls are automatically underlined and made clickable
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
5. Alternatively, use the command palette and search for "Navigate to View" when your cursor is on a line with a View(), PartialView(), or RedirectToAction() call

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

### RedirectToAction() Patterns

The extension recognizes various patterns of RedirectToAction() calls:

```csharp
return RedirectToAction("ActionName");           // Navigates to ActionName method in same controller
return RedirectToAction("ActionName", "ControllerName");  // Navigates to ActionName method in ControllerNameController
return RedirectToAction("ActionName", "ControllerName", new { id = 1 });  // Both action and controller are clickable
return RedirectToAction("ActionName", new { id = 1, category = "test" });  // Navigates to ActionName method in same controller
RedirectToAction("ActionName")                   // Navigates to ActionName method
RedirectToAction( "ActionName" , "ControllerName" ); // with spaces - Both parts are clickable
```

**RedirectToAction Navigation Features**:
- **Action Names**: Ctrl+click on action names to navigate to the corresponding action method
- **Controller Names**: Ctrl+click on controller names to navigate to the controller file
- **Same Controller**: When only action name is specified, searches within the current controller
- **Cross-Controller**: When both action and controller are specified, navigates to the target controller
- **Route Values Support**: Works with RedirectToAction calls that include route values (anonymous objects)
- **Precise Navigation**: Navigates directly to the action method line, not just the file

**Parameterless View() Calls**: When you use `return View();` without specifying a view name, the extension automatically determines the view name based on the current action method name, following standard ASP.NET MVC conventions.

**PartialView Support**: The extension fully supports `PartialView()` calls, both with explicit names and parameterless calls. Partial views are searched in controller-specific folders first, then in the Shared folder, which is the most common location for partial views.

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

## Known Issues

- Method name detection for parameterless View() calls works with standard method patterns but may not work with very complex method signatures
- Area detection relies on standard ASP.NET MVC folder conventions

## Release Notes

### 0.0.1

Initial release with basic controller-to-view navigation functionality.

---

## Development

To contribute to this extension:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Press F5 to open a new Extension Development Host window
4. Test your changes in the new window

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
