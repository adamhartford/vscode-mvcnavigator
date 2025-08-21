// Test to verify the critical fix for asp-action="List" issue
console.log('🔧 Testing Critical Fix for Tag Helper Navigation...\n');

// Simulate the findActionMethodFromView logic
function simulateControllerNameExtraction(viewPath) {
    console.log(`Extracting controller from view path: ${viewPath}`);
    
    // This mimics the extractControllerNameFromViewPath logic
    const pathParts = viewPath.replace(/\\/g, '/').split('/');
    
    // Find Views folder and get the next folder name
    const viewsIndex = pathParts.findIndex(part => part === 'Views');
    if (viewsIndex !== -1 && viewsIndex + 1 < pathParts.length) {
        const controllerName = pathParts[viewsIndex + 1];
        console.log(`  → Controller extracted: "${controllerName}"`);
        return controllerName;
    }
    
    console.log(`  → No controller found in path`);
    return null;
}

// Test with the actual ProductDetails.cshtml path
const testPaths = [
    'sample/Project2/Views/Product/ProductDetails.cshtml',
    'C:\\Users\\adamh\\projects\\vscode-mvcnavigator\\vscode-mvcnavigator\\sample\\Project2\\Views\\Product\\ProductDetails.cshtml',
    'Views/Product/ProductDetails.cshtml',
    'Areas/Admin/Views/User/Index.cshtml',
    'Views/Home/Index.cshtml'
];

console.log('🧪 Testing Controller Name Extraction:');
testPaths.forEach((path, index) => {
    console.log(`\nTest ${index + 1}:`);
    simulateControllerNameExtraction(path);
});

console.log('\n' + '='.repeat(60));
console.log('📋 Expected Behavior After Fix:');
console.log('');
console.log('1. When opening ProductDetails.cshtml, the extension should:');
console.log('   ✅ Recognize it as a view file (not controller)');
console.log('   ✅ Extract "Product" as the controller name from the path');
console.log('   ✅ Call findActionMethodFromView(viewUri, "List")');
console.log('   ✅ Search for "List" action in ProductController.cs');
console.log('   ✅ Create clickable link if List action is found');
console.log('');
console.log('2. Debug console should show:');
console.log('   [MVC Navigator] Processing file: .../ProductDetails.cshtml');
console.log('   [MVC Navigator] Found anchor tag helper 1: action="List"');
console.log('   [MVC Navigator] Extracted - controller: null, area: null');
console.log('   [MVC Navigator] Action search result: found');
console.log('   [MVC Navigator] Created link for action "List"');
console.log('');
console.log('🎯 Key Fix Applied:');
console.log('Changed from: this.findActionMethod(document.uri, actionName)');
console.log('Changed to:   this.findActionMethodFromView(document.uri, actionName)');
console.log('');
console.log('This ensures that when processing tag helpers in view files,');
console.log('the extension correctly extracts the controller context from');
console.log('the view path instead of trying to use the view URI as a controller URI.');

console.log('\n🔄 Next Steps:');
console.log('1. Reload VS Code extension (F5 or Ctrl+Shift+P → Developer: Reload Window)');
console.log('2. Open ProductDetails.cshtml');
console.log('3. Check Developer Console for debug messages');
console.log('4. Verify "List" is underlined and clickable');
