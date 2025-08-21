// Test the negative lookahead in WITH_PARAMS regex
const text1 = 'RedirectToAction("Index", "Home", new { area = "Admin" })';
const text2 = 'RedirectToAction("Index", "Home", new { id = 1 })';

const regex = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*(?!new\s*\{[^}]*area\s*=)[^)]*\)/g;

console.log('Testing WITH_PARAMS regex with negative lookahead:');
console.log('');

console.log('Test 1 (should NOT match - has area):');
console.log(`Text: ${text1}`);
const match1 = regex.exec(text1);
console.log(`Match: ${match1 ? 'YES' : 'NO'}`);
if (match1) {
    console.log(`Action: "${match1[1]}", Controller: "${match1[2]}"`);
}
console.log('');

regex.lastIndex = 0; // Reset for next test

console.log('Test 2 (should match - no area):');
console.log(`Text: ${text2}`);
const match2 = regex.exec(text2);
console.log(`Match: ${match2 ? 'YES' : 'NO'}`);
if (match2) {
    console.log(`Action: "${match2[1]}", Controller: "${match2[2]}"`);
}

console.log('');
console.log('Debugging the lookahead:');
const testPart = 'new { area = "Admin" }';
const lookaheadRegex = /^new\s*\{[^}]*area\s*=/;
console.log(`Testing lookahead against: ${testPart}`);
console.log(`Lookahead match: ${lookaheadRegex.test(testPart)}`);
