// Test cases for Tag Helper regex patterns
const testCases = [
    // Anchor Tag Helper patterns
    '<a asp-action="Index">Home</a>',
    '<a asp-action="Index" asp-controller="Home">Home</a>',
    '<a asp-action="Index" asp-controller="Home" asp-area="Admin">Admin Home</a>',
    '<a asp-action="Details" asp-controller="Product" asp-route-id="1">Product Details</a>',
    '<a asp-action="Edit" asp-controller="User" asp-area="Management" asp-route-id="5">Edit User</a>',
    
    // Form Tag Helper patterns  
    '<form asp-action="Create">',
    '<form asp-action="Create" asp-controller="Product">',
    '<form asp-action="Update" asp-controller="User" asp-area="Admin">',
    '<form asp-action="Submit" asp-controller="Contact" method="post">',
    
    // Mixed attributes (common in real usage)
    '<a asp-action="Index" class="nav-link" asp-controller="Home">',
    '<form asp-action="Create" asp-controller="Product" method="post" enctype="multipart/form-data">',
    
    // With spaces and different quote styles
    '<a asp-action = "Index" asp-controller = "Home" >',
    "<a asp-action='Index' asp-controller='Home'>",
    
    // Multiline (common in formatted HTML)
    `<a asp-action="Details"
       asp-controller="Product"
       asp-area="Catalog"
       asp-route-id="1">`,
];

console.log('Testing Tag Helper patterns:');
console.log('============================');

// Regex patterns to test
const ANCHOR_TAG_HELPER_ACTION_REGEX = /<a[^>]*asp-action\s*=\s*["']([^"']+)["'][^>]*>/g;
const ANCHOR_TAG_HELPER_CONTROLLER_REGEX = /<a[^>]*asp-controller\s*=\s*["']([^"']+)["'][^>]*>/g;
const ANCHOR_TAG_HELPER_AREA_REGEX = /<a[^>]*asp-area\s*=\s*["']([^"']+)["'][^>]*>/g;

const FORM_TAG_HELPER_ACTION_REGEX = /<form[^>]*asp-action\s*=\s*["']([^"']+)["'][^>]*>/g;
const FORM_TAG_HELPER_CONTROLLER_REGEX = /<form[^>]*asp-controller\s*=\s*["']([^"']+)["'][^>]*>/g;
const FORM_TAG_HELPER_AREA_REGEX = /<form[^>]*asp-area\s*=\s*["']([^"']+)["'][^>]*>/g;

testCases.forEach((testCase, index) => {
    console.log(`\nTest case ${index + 1}: ${testCase.replace(/\s+/g, ' ')}`);
    
    // Test anchor tag helpers
    ANCHOR_TAG_HELPER_ACTION_REGEX.lastIndex = 0;
    const actionMatch = ANCHOR_TAG_HELPER_ACTION_REGEX.exec(testCase);
    if (actionMatch) {
        console.log(`  ✅ Anchor action: "${actionMatch[1]}"`);
    }
    
    ANCHOR_TAG_HELPER_CONTROLLER_REGEX.lastIndex = 0;
    const controllerMatch = ANCHOR_TAG_HELPER_CONTROLLER_REGEX.exec(testCase);
    if (controllerMatch) {
        console.log(`  ✅ Anchor controller: "${controllerMatch[1]}"`);
    }
    
    ANCHOR_TAG_HELPER_AREA_REGEX.lastIndex = 0;
    const areaMatch = ANCHOR_TAG_HELPER_AREA_REGEX.exec(testCase);
    if (areaMatch) {
        console.log(`  ✅ Anchor area: "${areaMatch[1]}"`);
    }
    
    // Test form tag helpers
    FORM_TAG_HELPER_ACTION_REGEX.lastIndex = 0;
    const formActionMatch = FORM_TAG_HELPER_ACTION_REGEX.exec(testCase);
    if (formActionMatch) {
        console.log(`  ✅ Form action: "${formActionMatch[1]}"`);
    }
    
    FORM_TAG_HELPER_CONTROLLER_REGEX.lastIndex = 0;
    const formControllerMatch = FORM_TAG_HELPER_CONTROLLER_REGEX.exec(testCase);
    if (formControllerMatch) {
        console.log(`  ✅ Form controller: "${formControllerMatch[1]}"`);
    }
    
    FORM_TAG_HELPER_AREA_REGEX.lastIndex = 0;
    const formAreaMatch = FORM_TAG_HELPER_AREA_REGEX.exec(testCase);
    if (formAreaMatch) {
        console.log(`  ✅ Form area: "${formAreaMatch[1]}"`);
    }
    
    // Check if no matches found
    if (!actionMatch && !controllerMatch && !areaMatch && !formActionMatch && !formControllerMatch && !formAreaMatch) {
        console.log(`  ❌ No matches found`);
    }
});

console.log('\n============================');
console.log('Tag Helper pattern test completed.');
