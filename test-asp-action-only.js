// Test for asp-action="List" without asp-controller issue
console.log('Testing asp-action without asp-controller...\n');

// Test the specific case from ProductDetails.cshtml
const testTag = '<a asp-action="List" class="btn btn-secondary">Back to List</a>';

console.log('Test tag:', testTag);

// Test the regex that should match this
const anchorActionRegex = /<a[^>]*asp-action\s*=\s*["']([^"']+)["'][^>]*>/g;

const match = anchorActionRegex.exec(testTag);

if (match) {
    console.log('✅ Regex matches!');
    console.log('  Action extracted:', match[1]);
    
    // Test controller and area extraction
    const controllerMatch = testTag.match(/asp-controller\s*=\s*["']([^"']+)["']/);
    const areaMatch = testTag.match(/asp-area\s*=\s*["']([^"']*)["']/);
    
    console.log('  Controller:', controllerMatch ? controllerMatch[1] : 'null');
    console.log('  Area:', areaMatch ? (areaMatch[1] || 'null') : 'null');
    
    // This should call findActionMethod(document.uri, "List")
    console.log('  Should call: findActionMethod(document.uri, "List")');
} else {
    console.log('❌ Regex does NOT match - this is the problem!');
}

console.log('\n' + '='.repeat(50));
console.log('Testing other variations...\n');

const testCases = [
    '<a asp-action="List">Simple</a>',
    '<a asp-action="List" class="btn">With class</a>',
    '<a class="btn" asp-action="List">Class first</a>',
    '<a asp-action="Index" asp-controller="Home">With controller</a>'
];

testCases.forEach((tag, index) => {
    console.log(`Test ${index + 1}: ${tag}`);
    anchorActionRegex.lastIndex = 0; // Reset regex
    const result = anchorActionRegex.exec(tag);
    if (result) {
        console.log(`  ✅ Matches - action: "${result[1]}"`);
    } else {
        console.log('  ❌ No match');
    }
});
