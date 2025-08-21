# Full Path Navigation Feature

## Overview

The ASP.NET MVC Navigator extension now supports navigation for View() and PartialView() calls that use full paths, allowing developers to navigate directly to view files specified with absolute paths.

## Supported Full Path Patterns

### 1. View() with Full Path
```csharp
return View("~/Views/Home/About.cshtml");
```
- **Ctrl+click on path** → Navigates directly to the specified .cshtml file
- Resolves `~/` relative to the project root

### 2. PartialView() with Full Path
```csharp
return PartialView("~/Views/Shared/_UserInfo.cshtml");
```
- **Ctrl+click on path** → Navigates directly to the specified partial view file
- Works with both controller-specific and shared partial views

### 3. Area-Specific Full Paths
```csharp
return View("~/Areas/Admin/Views/Users/Index.cshtml");
return PartialView("~/Areas/Catalog/Views/Shared/_ProductCard.cshtml");
```
- **Ctrl+click on path** → Navigates to area-specific view files
- Supports the standard Areas folder structure

### 4. Full Path with Parameters
```csharp
return View("~/Views/Home/Index.cshtml", model);
return PartialView("~/Views/Shared/_Comments.cshtml", model);
```
- **Ctrl+click on path** → Navigates to the view file, ignoring the model parameter
- Works with any number of additional parameters

## Path Resolution

### Virtual Path Processing
- Paths starting with `~/` are treated as virtual paths
- The `~/` is resolved relative to the detected MVC project root
- Example: `~/Views/Home/About.cshtml` → `{ProjectRoot}/Views/Home/About.cshtml`

### Multi-Project Support
- Searches across all detected MVC project roots in the workspace
- Uses the same project detection logic as regular view navigation
- Tries multiple project structures and configurations

### File System Compatibility
- Handles both forward slashes (`/`) and backslashes (`\`) in paths
- Automatically converts path separators to match the operating system
- Supports both `.cshtml` and `.razor` file extensions

## Integration with Existing Features

### Mixed Usage
The full path feature works seamlessly alongside existing navigation patterns:

```csharp
public IActionResult TestMixedPaths()
{
    if (condition)
    {
        return View("About");                           // Regular view name
    }
    else
    {
        return View("~/Views/Error/NotFound.cshtml");   // Full path
    }
}
```

### Manual Navigation Command
The existing "Navigate to View" command supports full paths:
1. Place cursor on a line containing `View("~/...")` or `PartialView("~/...")`
2. Open Command Palette (Ctrl+Shift+P)
3. Search for "Navigate to View"
4. Extension detects the full path and navigates directly

## Regex Patterns

The extension uses these new regex patterns to detect full path calls:

- `VIEW_CALL_WITH_FULL_PATH_REGEX`: Matches `View("~/path.cshtml")` and `PartialView("~/path.cshtml")`
- `VIEW_CALL_WITH_FULL_PATH_AND_PARAMS_REGEX`: Matches the same with additional parameters

## Error Handling

### Path Not Found
If a full path cannot be resolved:
- DocumentLink won't be created (no underline/clickable text)
- Manual navigation shows: "Could not find view file for full path: {path}"

### Invalid Paths
- Only paths starting with `~/` are treated as full paths
- Other patterns fall back to existing view resolution logic
- Malformed paths are ignored gracefully

## Examples in Sample Code

See the following test controllers for comprehensive examples:
- `sample/Controllers/FullPathTestController.cs` - Basic full path examples
- `sample/Controllers/PathVariationsController.cs` - Edge cases and variations

## Benefits

1. **Direct Navigation**: No ambiguity about which view file to open
2. **Area Support**: Easy navigation to area-specific views
3. **Complex Structures**: Works with non-standard project layouts
4. **Backward Compatibility**: Doesn't interfere with existing navigation patterns
5. **Developer Productivity**: Faster navigation for explicitly specified view paths
