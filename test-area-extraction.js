const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Area Extraction Logic...\n');

// Test scenarios that might be problematic
const testCases = [
    {
        tag: '<a asp-action="Details" asp-controller="Product" asp-area="Admin">Admin Product</a>',
        expected: { action: 'Details', controller: 'Product', area: 'Admin' }
    },
    {
        tag: '<a asp-action="Index" asp-controller="Home" asp-area="">Home</a>',
        expected: { action: 'Index', controller: 'Home', area: '' }
    },
    {
        tag: '<a asp-action="About" asp-controller="Home">About</a>',
        expected: { action: 'About', controller: 'Home', area: null }
    },
    {
        tag: '<form asp-action="Create" asp-controller="User" asp-area="Management" method="post">',
        expected: { action: 'Create', controller: 'User', area: 'Management' }
    },
    {
        tag: '<form asp-action="Login" asp-controller="Account" asp-area="" method="post">',
        expected: { action: 'Login', controller: 'Account', area: '' }
    }
];

// Simulate the extraction logic from the extension
function extractTagHelperAttributes(tagHelper) {
    const actionMatch = tagHelper.match(/asp-action\s*=\s*["']([^"']+)["']/);
    const controllerMatch = tagHelper.match(/asp-controller\s*=\s*["']([^"']+)["']/);
    const areaMatch = tagHelper.match(/asp-area\s*=\s*["']([^"']*)["']/);
    
    return {
        action: actionMatch ? actionMatch[1] : null,
        controller: controllerMatch ? controllerMatch[1] : null,
        area: areaMatch ? areaMatch[1] : null
    };
}

// Test the extraction
testCases.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.tag}`);
    
    const extracted = extractTagHelperAttributes(test.tag);
    
    console.log(`  Expected: action="${test.expected.action}", controller="${test.expected.controller}", area="${test.expected.area}"`);
    console.log(`  Extracted: action="${extracted.action}", controller="${extracted.controller}", area="${extracted.area}"`);
    
    const actionMatch = extracted.action === test.expected.action;
    const controllerMatch = extracted.controller === test.expected.controller;
    const areaMatch = extracted.area === test.expected.area;
    
    if (actionMatch && controllerMatch && areaMatch) {
        console.log('  ✅ PASS');
    } else {
        console.log('  ❌ FAIL');
        if (!actionMatch) console.log(`    Action mismatch: got "${extracted.action}", expected "${test.expected.action}"`);
        if (!controllerMatch) console.log(`    Controller mismatch: got "${extracted.controller}", expected "${test.expected.controller}"`);
        if (!areaMatch) console.log(`    Area mismatch: got "${extracted.area}", expected "${test.expected.area}"`);
    }
    console.log('');
});

// Test the decision logic for which method to call
console.log('🔍 Testing Method Selection Logic...\n');

function simulateMethodSelection(action, controller, area) {
    console.log(`Input: action="${action}", controller="${controller}", area="${area}"`);
    
    if (controller && area) {
        console.log('  → Would call: findActionMethodInControllerWithArea()');
        return 'withArea';
    } else if (controller) {
        console.log('  → Would call: findActionMethodInController()');
        return 'controller';
    } else {
        console.log('  → Would call: findActionMethod()');
        return 'action';
    }
}

testCases.forEach((test, index) => {
    const extracted = extractTagHelperAttributes(test.tag);
    console.log(`Test ${index + 1}:`);
    const method = simulateMethodSelection(extracted.action, extracted.controller, extracted.area);
    
    // Check if empty area string causes issues
    if (extracted.area === '') {
        console.log('  ⚠️  WARNING: Empty area string - should this be treated as null?');
    }
    console.log('');
});

console.log('🔧 Potential Issues Identified:');
console.log('1. Empty area string ("") vs null handling');
console.log('2. Method selection logic for asp-area=""');
console.log('3. Area-aware navigation with empty string parameter');

console.log('\n💡 Suggested Fix:');
console.log('Treat empty area string as null/undefined for method selection:');
console.log('```');
console.log('const areaName = areaMatch ? (areaMatch[1] || null) : null;');
console.log('```');
