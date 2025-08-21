# HTML Helpers Navigation Feature

## Overview

This document summarizes the extension of the MVC Navigator to support `@Html.BeginForm` and `@Html.ActionLink` navigation functionality, in addition to the existing `@Url.Action` support.

## Features Added

### 1. @Html.ActionLink Navigation Support

The extension now provides Ctrl+click navigation for all variants of `@Html.ActionLink`:

- `@Html.ActionLink("Link Text", "ActionName")` - Navigate to action in current controller
- `@Html.ActionLink("Link Text", "ActionName", "ControllerName")` - Navigate to action in specified controller
- `@Html.ActionLink("Link Text", "ActionName", "ControllerName", new { id = 1 })` - Navigate with route parameters
- `@Html.ActionLink("Link Text", "ActionName", new { area = "" })` - Navigate with anonymous object parameters

### 2. @Html.BeginForm Navigation Support

The extension now provides Ctrl+click navigation for all variants of `@Html.BeginForm`:

- `@Html.BeginForm("ActionName")` - Navigate to action in current controller
- `@Html.BeginForm("ActionName", "ControllerName")` - Navigate to action in specified controller
- `@Html.BeginForm("ActionName", "ControllerName", new { id = 1 })` - Navigate with route parameters
- `@Html.BeginForm("ActionName", new { area = "" })` - Navigate with anonymous object parameters

### 3. Unified Navigation Experience

All three HTML helper types now provide the same navigation capabilities:

- **Action Name Navigation**: Ctrl+click on action names to navigate to the corresponding action method
- **Controller Name Navigation**: Ctrl+click on controller names to navigate to the controller file
- **Tooltip Support**: Hover tooltips show the target destination
- **Underlined Links**: Visual indication of clickable elements
- **Cross-Controller Support**: Navigate between different controllers
- **Route Parameters**: Support for navigation with route values and anonymous objects

## Implementation Details

### Regular Expressions Added

**@Html.ActionLink patterns:**
```typescript
const HTML_ACTION_LINK_WITH_ACTION_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*\)/g;
const HTML_ACTION_LINK_WITH_ACTION_AND_CONTROLLER_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
const HTML_ACTION_LINK_WITH_PARAMS_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const HTML_ACTION_LINK_ANONYMOUS_OBJECT_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;
```

**@Html.BeginForm patterns:**
```typescript
const HTML_BEGIN_FORM_WITH_ACTION_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*\)/g;
const HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
const HTML_BEGIN_FORM_WITH_PARAMS_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const HTML_BEGIN_FORM_ANONYMOUS_OBJECT_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;
```

**Note**: The `@?` pattern supports both `@Html.BeginForm()` and `Html.BeginForm()` syntax (the latter is commonly used within `@using` blocks).

### Processing Methods Added

**@Html.ActionLink processors:**
- `processHtmlActionLinkWithAction()` - Handles action-only variants
- `processHtmlActionLinkWithActionAndController()` - Handles action + controller variants
- `processHtmlActionLinkWithParams()` - Handles variants with route parameters
- `processHtmlActionLinkWithAnonymousObject()` - Handles variants with anonymous objects

**@Html.BeginForm processors:**
- `processHtmlBeginFormWithAction()` - Handles action-only variants
- `processHtmlBeginFormWithActionAndController()` - Handles action + controller variants
- `processHtmlBeginFormWithParams()` - Handles variants with route parameters
- `processHtmlBeginFormWithAnonymousObject()` - Handles variants with anonymous objects

### Updated Components

1. **Extension.ts**: Added all new regex patterns and processing methods
2. **processRazorNavigations()**: Extended to call all new HTML helper processors
3. **README.md**: Updated with comprehensive documentation of new features
4. **Test Files**: Created `HtmlHelpersTest.cshtml` with comprehensive test cases

### Test Cases Created

The implementation includes comprehensive test cases in `sample/Views/Home/HtmlHelpersTest.cshtml` covering:

- All variants of `@Html.ActionLink` calls
- All variants of `@Html.BeginForm` calls
- Mixed usage scenarios
- Different parameter patterns
- Cross-controller navigation examples

## Integration with Existing Features

The new HTML helper navigation integrates seamlessly with existing functionality:

- Uses the same action method lookup logic as `@Url.Action` and `RedirectToAction`
- Leverages existing controller file discovery mechanisms
- Maintains consistent tooltip and navigation behavior
- Follows the same multi-project workspace support patterns

## Compatibility

The new features are fully backward compatible and do not affect existing functionality:

- All existing `@Url.Action`, `View()`, `PartialView()`, and `RedirectToAction()` navigation continues to work
- No changes to public APIs or extension configuration
- Same file type support (`.cshtml` and `.razor`)
- Same project structure support (standard MVC, Areas, multi-project workspaces)

## Quality Assurance

The implementation has been tested with:

- ✅ Regex pattern validation (all patterns correctly match expected inputs)
- ✅ TypeScript compilation (no errors or warnings)
- ✅ Extension build process (successful compilation)
- ✅ Comprehensive test case coverage
- ✅ Documentation updates

## Summary

The MVC Navigator extension now provides complete navigation support for all major HTML helper methods used in ASP.NET MVC applications:

- `@Url.Action()` ✅ (existing)
- `@Html.ActionLink()` ✅ (new)
- `@Html.BeginForm()` ✅ (new)
- `View()` and `PartialView()` ✅ (existing)
- `RedirectToAction()` ✅ (existing)

**Key Navigation Features:**
- **Action Navigation**: Ctrl+click on action names navigates to the specific action method line
- **Controller Navigation**: Ctrl+click on controller names navigates to the controller class definition line
- **Precise Positioning**: Cursor is positioned at the exact line of the target definition
- **Command-based Navigation**: Uses VS Code command URIs for consistent and reliable navigation behavior

This makes the extension a comprehensive solution for MVC navigation in VS Code, providing functionality similar to what developers expect from JetBrains Rider and ReSharper.
