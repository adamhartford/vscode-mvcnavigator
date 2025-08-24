// Regular expressions for ASP.NET MVC navigation patterns

// Regular expressions to match View() calls
export const VIEW_CALL_WITH_NAME_REGEX = /\bView\s*\(\s*["']([^"']+)["']\s*\)/g;
export const VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX = /\bView\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g; // View("ViewName", model, ...)
export const VIEW_CALL_PARAMETERLESS_REGEX = /\bView\s*\(\s*\)/g;
export const VIEW_CALL_WITH_MODEL_REGEX = /\bView\s*\(\s*(?!["'])[^)]+\)/g; // View(model) or View(new Model{...})

// Regular expressions to match PartialView() calls
export const PARTIAL_VIEW_CALL_WITH_NAME_REGEX = /\bPartialView\s*\(\s*["']([^"']+)["']\s*\)/g;
export const PARTIAL_VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX = /\bPartialView\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g; // PartialView("ViewName", model, ...)
export const PARTIAL_VIEW_CALL_PARAMETERLESS_REGEX = /\bPartialView\s*\(\s*\)/g;
export const PARTIAL_VIEW_CALL_WITH_MODEL_REGEX = /\bPartialView\s*\(\s*(?!["'])[^)]+\)/g; // PartialView(model) or PartialView(new Model{...})

// Regular expressions to match View() and PartialView() calls with full paths
export const VIEW_CALL_WITH_FULL_PATH_REGEX = /\b(View|PartialView)\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*\)/g;
export const VIEW_CALL_WITH_FULL_PATH_AND_PARAMS_REGEX = /\b(View|PartialView)\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;

// Regular expressions to match View() and PartialView() calls with absolute paths (starting with /)
export const VIEW_CALL_WITH_ABSOLUTE_PATH_REGEX = /\b(View|PartialView)\s*\(\s*["'](\/[^"']+\.cshtml?)["']\s*\)/g;
export const VIEW_CALL_WITH_ABSOLUTE_PATH_AND_PARAMS_REGEX = /\b(View|PartialView)\s*\(\s*["'](\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;

// Regular expressions to match RedirectToAction() calls
export const REDIRECT_TO_ACTION_WITH_ACTION_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*\)/g;
export const REDIRECT_TO_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
export const REDIRECT_TO_ACTION_WITH_PARAMS_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*(?:new\s*\{(?![^}]*area\s*=)[^}]*\}|[a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;
export const REDIRECT_TO_ACTION_ANONYMOUS_OBJECT_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*(?:(?!new\s*\{[^}]*area\s*=)new\s*\{[^}]+\}|[a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;
export const REDIRECT_TO_ACTION_WITH_AREA_TWO_PARAM_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*new\s*\{[^}]*area\s*=\s*["']([^"']+)["'][^}]*\}\s*\)/g;

// Regular expressions to match RedirectToAction() calls with area in route values
export const REDIRECT_TO_ACTION_WITH_AREA_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*new\s*\{[^}]*area\s*=\s*["']([^"']+)["'][^}]*\}\s*\)/g;

// Regular expressions to match @Url.Action() calls in Razor views
export const URL_ACTION_WITH_ACTION_REGEX = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*\)/g;
export const URL_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
export const URL_ACTION_WITH_PARAMS_REGEX = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
export const URL_ACTION_ANONYMOUS_OBJECT_REGEX = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;

// Regular expressions to match Url.Action() calls in C# controller code
export const CSHARP_URL_ACTION_WITH_ACTION_REGEX = /\bUrl\.Action\s*\(\s*["']([^"']+)["']\s*\)/g;
export const CSHARP_URL_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX = /\bUrl\.Action\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
export const CSHARP_URL_ACTION_WITH_PARAMS_REGEX = /\bUrl\.Action\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
export const CSHARP_URL_ACTION_ANONYMOUS_OBJECT_REGEX = /\bUrl\.Action\s*\(\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;

// Regular expressions to match @Html.ActionLink() calls in Razor views
export const HTML_ACTION_LINK_WITH_ACTION_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*\)/g;
export const HTML_ACTION_LINK_WITH_ACTION_AND_CONTROLLER_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
export const HTML_ACTION_LINK_WITH_PARAMS_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
export const HTML_ACTION_LINK_ANONYMOUS_OBJECT_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;

// Regular expressions to match @Html.BeginForm() calls in Razor views
export const HTML_BEGIN_FORM_WITH_ACTION_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*\)/g;
export const HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
export const HTML_BEGIN_FORM_WITH_PARAMS_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
export const HTML_BEGIN_FORM_ANONYMOUS_OBJECT_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;

// Regular expressions to match @Html.Partial() calls in Razor views
export const HTML_PARTIAL_WITH_NAME_REGEX = /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*\)(?!\s*,)/g;
export const HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX = /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
export const HTML_PARTIAL_WITH_FULL_PATH_REGEX = /@?Html\.Partial\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*\)/g;
export const HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX = /@?Html\.Partial\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;
export const HTML_PARTIAL_WITH_ABSOLUTE_PATH_REGEX = /@?Html\.Partial\s*\(\s*["'](\/[^"']+\.cshtml?)["']\s*\)/g;
export const HTML_PARTIAL_WITH_ABSOLUTE_PATH_AND_MODEL_REGEX = /@?Html\.Partial\s*\(\s*["'](\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;

// Regular expressions to match @await Html.PartialAsync() calls in Razor views
export const HTML_PARTIAL_ASYNC_WITH_NAME_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["']([^"']+)["']\s*\)(?!\s*,)/g;
export const HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
export const HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*\)/g;
export const HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;
export const HTML_PARTIAL_ASYNC_WITH_ABSOLUTE_PATH_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["'](\/[^"']+\.cshtml?)["']\s*\)/g;
export const HTML_PARTIAL_ASYNC_WITH_ABSOLUTE_PATH_AND_MODEL_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["'](\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;

// Regular expressions to match ASP.NET Core Tag Helpers
export const ANCHOR_TAG_HELPER_ACTION_REGEX = /<a[^>]*asp-action\s*=\s*["']([^"']+)["'][^>]*>/g;
export const ANCHOR_TAG_HELPER_CONTROLLER_REGEX = /<a[^>]*asp-controller\s*=\s*["']([^"']+)["'][^>]*>/g;
export const ANCHOR_TAG_HELPER_AREA_REGEX = /<a[^>]*asp-area\s*=\s*["']([^"']*)["'][^>]*>/g;  // Allow empty string for asp-area=""

export const FORM_TAG_HELPER_ACTION_REGEX = /<form[^>]*asp-action\s*=\s*["']([^"']+)["'][^>]*>/g;
export const FORM_TAG_HELPER_CONTROLLER_REGEX = /<form[^>]*asp-controller\s*=\s*["']([^"']+)["'][^>]*>/g;
export const FORM_TAG_HELPER_AREA_REGEX = /<form[^>]*asp-area\s*=\s*["']([^"']*)["'][^>]*>/g;  // Allow empty string for asp-area=""

// Regular expressions to match Partial Tag Helper
export const PARTIAL_TAG_HELPER_NAME_REGEX = /<partial[^>]*name\s*=\s*["']([^"']+)["'][^>]*>/g;
export const PARTIAL_TAG_HELPER_FULL_PATH_REGEX = /<partial[^>]*name\s*=\s*["'](~\/[^"']+\.cshtml?)["'][^>]*>/g;
export const PARTIAL_TAG_HELPER_ABSOLUTE_PATH_REGEX = /<partial[^>]*name\s*=\s*["'](\/[^"']+\.cshtml?)["'][^>]*>/g;

// Regex to extract HTTP method from form elements
export const FORM_METHOD_REGEX = /\bmethod\s*=\s*["']([^"']+)["']/i;
export const FORM_METHOD_POST_REGEX = /FormMethod\.Post/;
export const FORM_METHOD_GET_REGEX = /FormMethod\.Get/;

// Regular expressions to match View Component calls
export const COMPONENT_INVOKE_ASYNC_WITH_NAME_REGEX = /@?await\s+Component\.InvokeAsync\s*\(\s*["']([^"']+)["']\s*\)/g;
export const COMPONENT_INVOKE_ASYNC_WITH_NAME_AND_PARAMS_REGEX = /@?await\s+Component\.InvokeAsync\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;

// Regular expressions to match View Component tag helpers
export const VIEW_COMPONENT_TAG_HELPER_REGEX = /<vc:([a-zA-Z-]+)[^>]*>/g;

// Regular expressions for ViewComponent() calls in controllers
export const VIEW_COMPONENT_CALL_REGEX = /\bViewComponent\s*\(\s*["']([^"']+)["']\s*\)/g;
export const VIEW_COMPONENT_CALL_WITH_PARAMS_REGEX = /\bViewComponent\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
