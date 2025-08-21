// Test file to verify the new HTML helper regex patterns work correctly

// Test @Html.ActionLink patterns
const HTML_ACTION_LINK_WITH_ACTION_REGEX = /@Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*\)/g;
const HTML_ACTION_LINK_WITH_ACTION_AND_CONTROLLER_REGEX = /@Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
const HTML_ACTION_LINK_WITH_PARAMS_REGEX = /@Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const HTML_ACTION_LINK_ANONYMOUS_OBJECT_REGEX = /@Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;

// Test @Html.BeginForm patterns
const HTML_BEGIN_FORM_WITH_ACTION_REGEX = /@Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*\)/g;
const HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX = /@Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
const HTML_BEGIN_FORM_WITH_PARAMS_REGEX = /@Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const HTML_BEGIN_FORM_ANONYMOUS_OBJECT_REGEX = /@Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;

// Test data for @Html.ActionLink
const actionLinkTestCases = [
    '@Html.ActionLink("Home", "Index")',
    '@Html.ActionLink("About", "About", "Home")',
    '@Html.ActionLink("Details", "Details", "Department", new { id = 1 })',
    '@Html.ActionLink("Contact", "Contact", new { area = "" })',
    '    @Html.ActionLink("Link Text", "Index")    ', // with spaces
];

// Test data for @Html.BeginForm
const beginFormTestCases = [
    '@Html.BeginForm("Index")',
    '@Html.BeginForm("About", "Home")',
    '@Html.BeginForm("Details", "Department", new { id = 1 })',
    '@Html.BeginForm("Contact", new { area = "" })',
    '    @Html.BeginForm("Index")    ', // with spaces
];

console.log('Testing @Html.ActionLink patterns:');
actionLinkTestCases.forEach((testCase, index) => {
    console.log(`\nTest case ${index + 1}: ${testCase}`);
    
    // Test with action only
    HTML_ACTION_LINK_WITH_ACTION_REGEX.lastIndex = 0;
    let match = HTML_ACTION_LINK_WITH_ACTION_REGEX.exec(testCase);
    if (match) {
        console.log(`  ACTION_ONLY match: action="${match[1]}"`);
    }
    
    // Test with action and controller
    HTML_ACTION_LINK_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;
    match = HTML_ACTION_LINK_WITH_ACTION_AND_CONTROLLER_REGEX.exec(testCase);
    if (match) {
        console.log(`  ACTION_AND_CONTROLLER match: action="${match[1]}", controller="${match[2]}"`);
    }
    
    // Test with params
    HTML_ACTION_LINK_WITH_PARAMS_REGEX.lastIndex = 0;
    match = HTML_ACTION_LINK_WITH_PARAMS_REGEX.exec(testCase);
    if (match) {
        console.log(`  WITH_PARAMS match: action="${match[1]}", controller="${match[2]}"`);
    }
    
    // Test with anonymous object
    HTML_ACTION_LINK_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;
    match = HTML_ACTION_LINK_ANONYMOUS_OBJECT_REGEX.exec(testCase);
    if (match) {
        console.log(`  ANONYMOUS_OBJECT match: action="${match[1]}"`);
    }
});

console.log('\n\nTesting @Html.BeginForm patterns:');
beginFormTestCases.forEach((testCase, index) => {
    console.log(`\nTest case ${index + 1}: ${testCase}`);
    
    // Test with action only
    HTML_BEGIN_FORM_WITH_ACTION_REGEX.lastIndex = 0;
    let match = HTML_BEGIN_FORM_WITH_ACTION_REGEX.exec(testCase);
    if (match) {
        console.log(`  ACTION_ONLY match: action="${match[1]}"`);
    }
    
    // Test with action and controller
    HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;
    match = HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX.exec(testCase);
    if (match) {
        console.log(`  ACTION_AND_CONTROLLER match: action="${match[1]}", controller="${match[2]}"`);
    }
    
    // Test with params
    HTML_BEGIN_FORM_WITH_PARAMS_REGEX.lastIndex = 0;
    match = HTML_BEGIN_FORM_WITH_PARAMS_REGEX.exec(testCase);
    if (match) {
        console.log(`  WITH_PARAMS match: action="${match[1]}", controller="${match[2]}"`);
    }
    
    // Test with anonymous object
    HTML_BEGIN_FORM_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;
    match = HTML_BEGIN_FORM_ANONYMOUS_OBJECT_REGEX.exec(testCase);
    if (match) {
        console.log(`  ANONYMOUS_OBJECT match: action="${match[1]}"`);
    }
});
