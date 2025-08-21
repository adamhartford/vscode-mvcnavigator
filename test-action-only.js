// Test for action-only tag helpers
console.log('🔍 Testing Action-Only Tag Helper...\n');

const testTag = '<a asp-action="List" class="btn btn-secondary">Back to List</a>';
console.log(`Testing: ${testTag}\n`);

// Test the regex pattern
const ANCHOR_TAG_HELPER_ACTION_REGEX = /<a[^>]*asp-action\s*=\s*["']([^"']+)["'][^>]*>/g;

// Reset regex state
ANCHOR_TAG_HELPER_ACTION_REGEX.lastIndex = 0;

const match = ANCHOR_TAG_HELPER_ACTION_REGEX.exec(testTag);

if (match) {
    console.log('✅ Regex Match Found:');
    console.log(`  Full match: ${match[0]}`);
    console.log(`  Action name: ${match[1]}`);
    
    // Test attribute extraction
    const fullMatch = match[0];
    const controllerMatch = fullMatch.match(/asp-controller\s*=\s*["']([^"']+)["']/);
    const areaMatch = fullMatch.match(/asp-area\s*=\s*["']([^"']*)["']/);
    
    console.log('\n🔍 Attribute Extraction:');
    console.log(`  Controller: ${controllerMatch ? controllerMatch[1] : 'null'}`);
    console.log(`  Area: ${areaMatch ? (areaMatch[1] || null) : 'null'}`);
    
    // Test method selection logic
    const controllerName = controllerMatch ? controllerMatch[1] : null;
    const areaName = areaMatch ? (areaMatch[1] || null) : null;
    
    console.log('\n🎯 Method Selection:');
    if (controllerName && areaName) {
        console.log('  → Would call: findActionMethodInControllerWithArea()');
    } else if (controllerName) {
        console.log('  → Would call: findActionMethodInController()');
    } else {
        console.log('  → Would call: findActionMethod() - This should find "List" in current controller');
    }
    
} else {
    console.log('❌ No regex match found!');
    console.log('This means the action-only tag helper is not being detected.');
}

console.log('\n🔧 Potential Issues:');
console.log('1. Check if the extension is processing .cshtml files correctly');
console.log('2. Verify document.languageId for .cshtml files');
console.log('3. Ensure tag helper processing is called for Razor files');

// Test a few more variations
console.log('\n📋 Testing Variations:');

const variations = [
    '<a asp-action="List">Link</a>',
    '<a class="btn" asp-action="List">Link</a>',
    '<a asp-action="List" class="btn">Link</a>',
    '<a asp-action = "List" class="btn">Link</a>',
];

variations.forEach((tag, index) => {
    ANCHOR_TAG_HELPER_ACTION_REGEX.lastIndex = 0;
    const match = ANCHOR_TAG_HELPER_ACTION_REGEX.exec(tag);
    console.log(`  ${index + 1}. ${tag}`);
    console.log(`     ${match ? '✅ Match' : '❌ No match'}`);
});
