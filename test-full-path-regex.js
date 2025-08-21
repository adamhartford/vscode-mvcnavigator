// Test the full path regex patterns for Html.Partial and Html.PartialAsync
const HTML_PARTIAL_WITH_FULL_PATH_REGEX = /@?Html\.Partial\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*\)/g;
const HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX = /@?Html\.Partial\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;
const HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*\)/g;
const HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;

// Test cases for full paths
const fullPathTestCases = [
    // Html.Partial with full paths
    '@Html.Partial("~/Views/Shared/_DemoPartial.cshtml")',
    '@Html.Partial("~/Areas/Admin/Views/Shared/_AdminPartial.cshtml")',
    '@Html.Partial("~/Views/Demo/_SpecificPartial.cshtml", Model)',
    '@Html.Partial("~/Areas/Catalog/Views/Product/_ProductCard.cshtml", Model.Product)',
    
    // Html.PartialAsync with full paths
    '@await Html.PartialAsync("~/Views/Shared/_DemoPartial.cshtml")',
    '@await Html.PartialAsync("~/Areas/Admin/Views/Shared/_AdminPartial.cshtml")',
    '@await Html.PartialAsync("~/Views/Demo/_SpecificPartial.cshtml", Model)',
    '@await Html.PartialAsync("~/Areas/Catalog/Views/Product/_ProductCard.cshtml", Model.Product)',
    
    // Without @ prefix
    'Html.Partial("~/Views/Shared/_DemoPartial.cshtml")',
    'Html.Partial("~/Views/Demo/_SpecificPartial.cshtml", Model)',
    'await Html.PartialAsync("~/Views/Shared/_DemoPartial.cshtml")',
    'await Html.PartialAsync("~/Views/Demo/_SpecificPartial.cshtml", Model)',
    
    // Edge cases
    '@Html.Partial("~/Views/Complex/Path/With/Multiple/Folders/_Partial.cshtml")',
    '@await Html.PartialAsync("~/Areas/MyArea/Views/MyController/_MyPartial.cshtml", new { Id = 1, Name = "Test" })',
];

console.log('Testing Html.Partial and Html.PartialAsync full path regex patterns...\n');

fullPathTestCases.forEach((testCase, index) => {
    console.log(`--- Testing: ${testCase} ---`);
    
    let foundMatch = false;
    
    // Reset regex state
    HTML_PARTIAL_WITH_FULL_PATH_REGEX.lastIndex = 0;
    HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX.lastIndex = 0;
    HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX.lastIndex = 0;
    HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX.lastIndex = 0;
    
    let match;
    if ((match = HTML_PARTIAL_WITH_FULL_PATH_REGEX.exec(testCase)) !== null) {
        console.log(`✓ HTML_PARTIAL_WITH_FULL_PATH_REGEX matched: "${match[1]}"`);
        foundMatch = true;
    }
    
    HTML_PARTIAL_WITH_FULL_PATH_REGEX.lastIndex = 0;
    if ((match = HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX.exec(testCase)) !== null) {
        console.log(`✓ HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX matched: "${match[1]}"`);
        foundMatch = true;
    }
    
    HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX.lastIndex = 0;
    if ((match = HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX.exec(testCase)) !== null) {
        console.log(`✓ HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX matched: "${match[1]}"`);
        foundMatch = true;
    }
    
    HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX.lastIndex = 0;
    if ((match = HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX.exec(testCase)) !== null) {
        console.log(`✓ HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX matched: "${match[1]}"`);
        foundMatch = true;
    }
    
    if (!foundMatch) {
        console.log('❌ No regex matched this case!');
    }
    
    console.log('');
});
