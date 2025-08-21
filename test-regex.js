// Test regex patterns for RedirectToAction
const REDIRECT_TO_ACTION_WITH_ACTION_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*\)/g;

const testCases = [
    'return RedirectToAction("Index");',
    'return RedirectToAction( "Index" );',
    'RedirectToAction("About")',
    'return RedirectToAction("Index", "Home");', // This should NOT match the single-param regex
    'return RedirectToAction("Test", new { id = 1 });' // This should NOT match the single-param regex
];

console.log('Testing REDIRECT_TO_ACTION_WITH_ACTION_REGEX:');
testCases.forEach((testCase, index) => {
    REDIRECT_TO_ACTION_WITH_ACTION_REGEX.lastIndex = 0; // Reset regex
    const match = REDIRECT_TO_ACTION_WITH_ACTION_REGEX.exec(testCase);
    console.log(`${index + 1}. "${testCase}"`);
    console.log(`   Match: ${match ? `YES - Action: "${match[1]}"` : 'NO'}`);
    console.log('');
});
