// Test file for area-aware RedirectToAction navigation
const fs = require('fs');

// Test the new regex pattern
const REDIRECT_TO_ACTION_WITH_AREA_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*new\s*\{[^}]*area\s*=\s*["']([^"']+)["'][^}]*\}\s*\)/g;

// Test cases
const testCases = [
    'return RedirectToAction("Index", "Home", new { area = "Area1" });',
    'return RedirectToAction("Index", "Home", new { area = "Area2" });',
    'return RedirectToAction("Index", "Home", new { area = "Area3" });',
    'return RedirectToAction("Details", "Product", new { area = "Admin", id = 1 });',
    'return RedirectToAction("Create", "User", new { id = 2, area = "Management" });',
    'return RedirectToAction("Edit", "Category", new { area = "Catalog", page = 1, sortBy = "name" });'
];

console.log('Testing area-aware RedirectToAction regex pattern:');
console.log('===============================================');

testCases.forEach((testCase, index) => {
    console.log(`\nTest Case ${index + 1}: ${testCase}`);
    
    REDIRECT_TO_ACTION_WITH_AREA_REGEX.lastIndex = 0; // Reset regex state
    const match = REDIRECT_TO_ACTION_WITH_AREA_REGEX.exec(testCase);
    if (match) {
        console.log(`✅ MATCH FOUND:`);
        console.log(`   Full match: "${match[0]}"`);
        console.log(`   Action: "${match[1]}"`);
        console.log(`   Controller: "${match[2]}"`);
        console.log(`   Area: "${match[3]}"`);
        console.log(`   All groups:`, match);
    } else {
        console.log(`❌ NO MATCH`);
    }
});

console.log('\n===============================================');
console.log('Area-aware RedirectToAction regex test completed.');
