// Test cases for verifying regex patterns don't overlap
const testCases = [
    'RedirectToAction("Index")',
    'RedirectToAction("Index", "Home")',
    'RedirectToAction("Index", "Home", new { id = 1 })',
    'RedirectToAction("Index", "Home", new { area = "Admin" })',
    'RedirectToAction("Index", "Home", new { area = "Admin", id = 1 })',
    'RedirectToAction("Test", new { id = 1 })',
    'RedirectToAction("Test", new { area = "Admin" })',
    'RedirectToAction("Index", routeValues)',
];

// Regex patterns (copied from extension.ts)
const REDIRECT_TO_ACTION_WITH_ACTION_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*\)/g;
const REDIRECT_TO_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
const REDIRECT_TO_ACTION_WITH_PARAMS_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*(?:new\s*\{(?![^}]*area\s*=)[^}]*\}|[a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;
const REDIRECT_TO_ACTION_ANONYMOUS_OBJECT_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*(?:(?!new\s*\{[^}]*area\s*=)new\s*\{[^}]+\}|[a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;
const REDIRECT_TO_ACTION_WITH_AREA_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*new\s*\{[^}]*area\s*=\s*["']([^"']+)["'][^}]*\}\s*\)/g;
const REDIRECT_TO_ACTION_WITH_AREA_TWO_PARAM_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*new\s*\{[^}]*area\s*=\s*["']([^"']+)["'][^}]*\}\s*\)/g;

console.log('Testing regex patterns for overlaps:\n');

testCases.forEach((testCase, index) => {
    console.log(`Test case ${index + 1}: ${testCase}`);
    
    const matches = {
        'ACTION_ONLY': REDIRECT_TO_ACTION_WITH_ACTION_REGEX.test(testCase),
        'ACTION_AND_CONTROLLER': REDIRECT_TO_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.test(testCase),
        'WITH_PARAMS': REDIRECT_TO_ACTION_WITH_PARAMS_REGEX.test(testCase),
        'ANONYMOUS_OBJECT': REDIRECT_TO_ACTION_ANONYMOUS_OBJECT_REGEX.test(testCase),
        'WITH_AREA': REDIRECT_TO_ACTION_WITH_AREA_REGEX.test(testCase),
        'WITH_AREA_TWO_PARAM': REDIRECT_TO_ACTION_WITH_AREA_TWO_PARAM_REGEX.test(testCase)
    };
    
    // Reset regex lastIndex for next test
    REDIRECT_TO_ACTION_WITH_ACTION_REGEX.lastIndex = 0;
    REDIRECT_TO_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;
    REDIRECT_TO_ACTION_WITH_PARAMS_REGEX.lastIndex = 0;
    REDIRECT_TO_ACTION_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;
    REDIRECT_TO_ACTION_WITH_AREA_REGEX.lastIndex = 0;
    REDIRECT_TO_ACTION_WITH_AREA_TWO_PARAM_REGEX.lastIndex = 0;
    
    const matchCount = Object.values(matches).filter(Boolean).length;
    const matchingPatterns = Object.entries(matches).filter(([_, matches]) => matches).map(([pattern, _]) => pattern);
    
    console.log(`  Matches: ${matchingPatterns.join(', ') || 'NONE'}`);
    console.log(`  Total matches: ${matchCount}`);
    
    if (matchCount > 1) {
        console.log(`  ⚠️  OVERLAP DETECTED!`);
    } else if (matchCount === 1) {
        console.log(`  ✅ Single match (good)`);
    } else {
        console.log(`  ❌ No matches`);
    }
    
    console.log('');
});
