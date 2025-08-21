// Test the updated regex patterns from the extension
const HTML_PARTIAL_WITH_NAME_REGEX = /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*\)(?!\s*,)/g;
const HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX = /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const HTML_PARTIAL_ASYNC_WITH_NAME_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["']([^"']+)["']\s*\)(?!\s*,)/g;
const HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;

// Test cases from the PartialTest.cshtml file
const testCases = [
    '@Html.Partial("_DemoPartial")',
    '@Html.Partial("ParameterlessPartial")',
    '@Html.Partial("GetNavPartial")',
    '@Html.Partial("_DemoPartial", Model)',
    '@Html.Partial("GetErrorPartial", Model)',
    '@Html.Partial("GetCustomErrorPartial", ViewBag.ErrorData)',
    '@await Html.PartialAsync("_DemoPartial")',
    '@await Html.PartialAsync("ParameterlessPartial")',
    '@await Html.PartialAsync("GetCustomErrorPartial")',
    '@await Html.PartialAsync("_DemoPartial", Model)',
    '@await Html.PartialAsync("GetNavPartial", Model)',
    '@await Html.PartialAsync("GetErrorPartial", new ErrorModel())',
    'Html.Partial("_DemoPartial")',
    'await Html.PartialAsync("ParameterlessPartial", Model)'
];

console.log('Testing regex patterns from PartialTest.cshtml...\n');

testCases.forEach((testCase, index) => {
    console.log(`--- Testing: ${testCase} ---`);
    
    let foundMatch = false;
    
    // Reset regex state
    HTML_PARTIAL_WITH_NAME_REGEX.lastIndex = 0;
    HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX.lastIndex = 0;
    HTML_PARTIAL_ASYNC_WITH_NAME_REGEX.lastIndex = 0;
    HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX.lastIndex = 0;
    
    let match;
    if ((match = HTML_PARTIAL_WITH_NAME_REGEX.exec(testCase)) !== null) {
        console.log(`✓ HTML_PARTIAL_WITH_NAME_REGEX matched: "${match[1]}"`);
        foundMatch = true;
    }
    
    HTML_PARTIAL_WITH_NAME_REGEX.lastIndex = 0;
    if ((match = HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX.exec(testCase)) !== null) {
        console.log(`✓ HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX matched: "${match[1]}"`);
        foundMatch = true;
    }
    
    HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX.lastIndex = 0;
    if ((match = HTML_PARTIAL_ASYNC_WITH_NAME_REGEX.exec(testCase)) !== null) {
        console.log(`✓ HTML_PARTIAL_ASYNC_WITH_NAME_REGEX matched: "${match[1]}"`);
        foundMatch = true;
    }
    
    HTML_PARTIAL_ASYNC_WITH_NAME_REGEX.lastIndex = 0;
    if ((match = HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX.exec(testCase)) !== null) {
        console.log(`✓ HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX matched: "${match[1]}"`);
        foundMatch = true;
    }
    
    if (!foundMatch) {
        console.log('❌ No regex matched this case!');
    }
    
    console.log('');
});
