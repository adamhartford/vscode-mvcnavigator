# ASP.NET MVC Navigator

A Visual Studio Code extension that provides intelligent navigation between ASP.NET MVC controllers and views, similar to the functionality found in JetBrains Rider and ReSharper.

## Features

- **Ctrl+Click Navigation**: Navigate from controller actions to their corresponding views by Ctrl+clicking on view names in `View()` and `PartialView()` calls
- **Underlined View Names**: View names in `View("ViewName")` and `PartialView("_PartialName")` calls are automatically underlined and made clickable
- **Parameterless Call Support**: Both `View()` and `PartialView()` calls without parameters automatically resolve to action-named views
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
2. Locate a `View()` or `PartialView()` call with a view name, e.g., `return View("MyView");` or `return PartialView("_MyPartial");`
3. The view name will be automatically underlined
4. Ctrl+click on the view name to navigate to the corresponding `.cshtml` or `.razor` file
5. Alternatively, use the command palette and search for "Navigate to View" when your cursor is on a line with a View() or PartialView() call

## Supported View() Call Patterns

The extension recognizes various patterns of View() and PartialView() calls:

```csharp
return View("ViewName");        // Navigates to ViewName.cshtml
return View("ViewName", model); // Navigates to ViewName.cshtml  
return View();                  // Navigates to {ActionName}.cshtml (follows MVC convention)
View("ViewName")               // Navigates to ViewName.cshtml
return View( "ViewName" );     // with spaces - Navigates to ViewName.cshtml

return PartialView("_PartialName");     // Navigates to _PartialName.cshtml
return PartialView("_PartialName", model); // Navigates to _PartialName.cshtml
return PartialView();                   // Navigates to {ActionName}.cshtml (follows MVC convention)
PartialView("_PartialName")            // Navigates to _PartialName.cshtml
```

**Parameterless View() Calls**: When you use `return View();` without specifying a view name, the extension automatically determines the view name based on the current action method name, following standard ASP.NET MVC conventions.

**PartialView Support**: The extension fully supports `PartialView()` calls, both with explicit names and parameterless calls. Partial views are searched in controller-specific folders first, then in the Shared folder, which is the most common location for partial views.

## Project Structure Support

The extension automatically searches for view files in these locations:

- `Views/{ControllerName}/{ViewName}.cshtml`
- `Views/{ControllerName}/{ViewName}.razor`
- `Areas/*/Views/{ControllerName}/{ViewName}.cshtml`
- `Areas/*/Views/{ControllerName}/{ViewName}.razor`
- `Views/Shared/{ViewName}.cshtml`
- `Views/Shared/{ViewName}.razor`
- `wwwroot/Views/{ControllerName}/{ViewName}.cshtml`
- `src/Views/{ControllerName}/{ViewName}.cshtml`
- `Web/Views/{ControllerName}/{ViewName}.cshtml`

## Requirements

- Visual Studio Code 1.103.0 or higher
- ASP.NET MVC or ASP.NET Core MVC project
- C# language support (C# extension recommended)

## Commands

- `ASP.NET MVC Navigator: Navigate to View` - Manually navigate to a view from the current cursor position

## Known Issues

- Areas support uses wildcard matching which may have performance implications in very large projects
- Method name detection for parameterless View() calls works with standard method patterns but may not work with very complex method signatures

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
