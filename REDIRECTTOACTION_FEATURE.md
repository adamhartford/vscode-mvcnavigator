# RedirectToAction Navigation Feature

## Overview

The ASP.NET MVC Navigator extension now supports intelligent navigation for `RedirectToAction()` calls, allowing developers to quickly navigate between controller actions.

## Supported RedirectToAction Patterns

### 1. Same Controller Navigation
```csharp
return RedirectToAction("ActionName");
```
- **Ctrl+click on "ActionName"** → Navigates to the ActionName method in the same controller
- Example: `RedirectToAction("Index")` → Navigates to the Index action method

### 2. Cross-Controller Navigation
```csharp
return RedirectToAction("ActionName", "ControllerName");
```
- **Ctrl+click on "ActionName"** → Navigates to the ActionName method in ControllerNameController
- **Ctrl+click on "ControllerName"** → Navigates to ControllerNameController.cs file
- Example: `RedirectToAction("Index", "Home")` → Both "Index" and "Home" are clickable

### 3. With Route Values (Same Controller)
```csharp
return RedirectToAction("ActionName", new { id = 1, category = "test" });
```
- **Ctrl+click on "ActionName"** → Navigates to the ActionName method in the same controller
- Route values (anonymous objects) are ignored for navigation purposes

### 4. With Route Values (Cross-Controller)
```csharp
return RedirectToAction("ActionName", "ControllerName", new { id = 5 });
```
- **Ctrl+click on "ActionName"** → Navigates to the ActionName method in ControllerNameController
- **Ctrl+click on "ControllerName"** → Navigates to ControllerNameController.cs file
- Route values (anonymous objects) are ignored for navigation purposes

## How It Works

### Action Method Detection
- The extension searches for action methods using regex patterns that match:
  - `public IActionResult ActionName(`
  - `public ActionResult ActionName(`
  - `public async Task<IActionResult> ActionName(`
  - `public ActionResult<T> ActionName(`
  - Also supports `private`, `protected`, and `internal` access modifiers

### Controller File Discovery
- Searches for controller files in multiple locations:
  - `Controllers/{ControllerName}Controller.cs`
  - `Areas/*/Controllers/{ControllerName}Controller.cs`
  - `src/Controllers/{ControllerName}Controller.cs`
  - `Web/Controllers/{ControllerName}Controller.cs`

### Precise Navigation
- When navigating to action methods, the extension jumps directly to the method declaration line
- When navigating to controllers, it opens the controller file
- Uses VS Code's built-in text editor reveal functionality to center the target line

## Test Examples

See `sample/Controllers/DemoController.cs` for comprehensive examples of all supported RedirectToAction patterns.

## Manual Navigation Command

The extension also supports manual navigation via the Command Palette:
1. Place cursor on a line containing `RedirectToAction(...)`
2. Open Command Palette (Ctrl+Shift+P)
3. Search for "Navigate to View" 
4. Extension will detect and navigate to the appropriate action method

## Integration with Existing Features

This feature seamlessly integrates with the existing View() and PartialView() navigation capabilities, providing a complete MVC navigation solution in VS Code.
