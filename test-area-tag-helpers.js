const fs = require('fs');
const path = require('path');

// Read the extension source
const extensionPath = path.join(__dirname, 'src', 'extension.ts');
const extensionContent = fs.readFileSync(extensionPath, 'utf8');

console.log('🔍 Investigating Tag Helper Area Support...\n');

// Test scenario: Tag helpers in area-based views
const areaBasedTests = [
    {
        description: 'Tag helper from Admin area view to Admin area controller',
        viewPath: '/Areas/Admin/Views/Product/Index.cshtml',
        tagHelper: '<a asp-action="Details" asp-controller="Product" asp-area="Admin">Product Details</a>',
        expectedController: 'Areas/Admin/Controllers/ProductController.cs',
        expectedAction: 'Details'
    },
    {
        description: 'Tag helper from main view to Admin area controller',
        viewPath: '/Views/Home/Index.cshtml',
        tagHelper: '<a asp-action="Manage" asp-controller="User" asp-area="Admin">Manage Users</a>',
        expectedController: 'Areas/Admin/Controllers/UserController.cs',
        expectedAction: 'Manage'
    },
    {
        description: 'Tag helper from Admin area view to main area controller',
        viewPath: '/Areas/Admin/Views/Dashboard/Index.cshtml',
        tagHelper: '<a asp-action="Index" asp-controller="Home" asp-area="">Home</a>',
        expectedController: 'Controllers/HomeController.cs',
        expectedAction: 'Index'
    },
    {
        description: 'Form tag helper in area view targeting area controller',
        viewPath: '/Areas/Catalog/Views/Product/Edit.cshtml',
        tagHelper: '<form asp-action="Update" asp-controller="Product" asp-area="Catalog" method="post">',
        expectedController: 'Areas/Catalog/Controllers/ProductController.cs',
        expectedAction: 'Update'
    }
];

// Check if the extension processes .cshtml files in Areas
console.log('📋 Checking document processing scope...');

// Look for how document processing is triggered
const documentLinkPattern = /provideDocumentLinks\(document: vscode\.TextDocument\)/;
const documentLinkMatch = extensionContent.match(documentLinkPattern);

if (documentLinkMatch) {
    console.log('✅ Found provideDocumentLinks method');
    
    // Check what file types are processed
    const razorProcessingPattern = /languageId === ['"]csharp['"]/;
    const razorMatch = extensionContent.match(razorProcessingPattern);
    
    if (razorMatch) {
        console.log('⚠️  ISSUE FOUND: Extension only processes C# files (languageId === "csharp")');
        console.log('   Tag helpers in .cshtml files (languageId === "razor" or "html") may not be processed!');
    } else {
        console.log('✅ Document processing scope looks correct');
    }
} else {
    console.log('❌ Could not find provideDocumentLinks method');
}

// Check if Razor files are registered for document link provider
console.log('\n📄 Checking file type registration...');

const registerPattern = /registerDocumentLinkProvider\([^)]+\)/g;
let match;
let registrations = [];

while ((match = registerPattern.exec(extensionContent)) !== null) {
    registrations.push(match[0]);
}

console.log('Found registrations:');
registrations.forEach((reg, index) => {
    console.log(`  ${index + 1}. ${reg}`);
});

// Check if the extension is registered for .cshtml files
const razorRegistration = extensionContent.includes('razor') || extensionContent.includes('cshtml');
if (razorRegistration) {
    console.log('✅ Extension appears to support Razor files');
} else {
    console.log('⚠️  WARNING: Extension may not be registered for .cshtml/.razor files');
}

console.log('\n🧪 Testing area-based tag helper scenarios...');

// Test the regex patterns with area-based examples
const anchorPattern = /<a[^>]*asp-action\s*=\s*["']([^"']+)["'][^>]*>/g;
const formPattern = /<form[^>]*asp-action\s*=\s*["']([^"']+)["'][^>]*>/g;

areaBasedTests.forEach((test, index) => {
    console.log(`\nTest ${index + 1}: ${test.description}`);
    console.log(`  View: ${test.viewPath}`);
    console.log(`  Tag: ${test.tagHelper}`);
    
    // Reset regex state
    anchorPattern.lastIndex = 0;
    formPattern.lastIndex = 0;
    
    let match;
    let found = false;
    
    if (test.tagHelper.includes('<a ')) {
        if ((match = anchorPattern.exec(test.tagHelper)) !== null) {
            console.log(`  ✅ Action extracted: "${match[1]}"`);
            
            // Check if area is properly extracted
            const areaMatch = test.tagHelper.match(/asp-area\s*=\s*["']([^"']*)["']/);
            const controllerMatch = test.tagHelper.match(/asp-controller\s*=\s*["']([^"']+)["']/);
            
            if (areaMatch) {
                console.log(`  ✅ Area extracted: "${areaMatch[1]}"`);
            }
            if (controllerMatch) {
                console.log(`  ✅ Controller extracted: "${controllerMatch[1]}"`);
            }
            
            found = true;
        }
    }
    
    if (test.tagHelper.includes('<form ')) {
        if ((match = formPattern.exec(test.tagHelper)) !== null) {
            console.log(`  ✅ Form action extracted: "${match[1]}"`);
            found = true;
        }
    }
    
    if (!found) {
        console.log('  ❌ No match found');
    }
});

console.log('\n🔍 Potential Issues Identified:');
console.log('1. Document Link Provider Registration:');
console.log('   - Extension may only be registered for C# files');
console.log('   - Tag helpers in .cshtml files need registration for "razor" language ID');

console.log('\n2. Document Processing Scope:');
console.log('   - processTagHelperNavigations may only run for C# files');
console.log('   - Need to ensure .cshtml files trigger tag helper processing');

console.log('\n3. Area Resolution Context:');
console.log('   - Tag helpers need proper document.uri context for area detection');
console.log('   - Ensure findActionMethodInControllerWithArea gets correct currentControllerUri');

console.log('\n💡 Recommended Fixes:');
console.log('1. Register document link provider for "razor" language ID');
console.log('2. Add tag helper processing to Razor file handling');
console.log('3. Test with actual .cshtml files in Areas structure');
