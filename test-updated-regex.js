// Test the updated regex patterns to support both @Html.BeginForm and Html.BeginForm

const HTML_BEGIN_FORM_WITH_ACTION_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*\)/g;
const HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;

// Test cases with both @ and without @
const testCases = [
    '@Html.BeginForm("Index")',
    'Html.BeginForm("Index")',
    '@Html.BeginForm("About", "Home")',
    'Html.BeginForm("About", "Home")',
    '    Html.BeginForm("Index")    ', // with spaces
    '    @Html.BeginForm("Contact", "Home")    ', // with spaces and @
];

console.log('Testing updated @Html.BeginForm patterns:');
testCases.forEach((testCase, index) => {
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
});
