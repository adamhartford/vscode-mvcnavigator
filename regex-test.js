const URL_ACTION_WITH_ACTION_REGEX = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*\)/g;

const testTexts = [
    '@Url.Action("Index")',
    '@Url.Action("About")',
    '@Url.Action("Contact")'
];

console.log('Testing regex patterns...');

testTexts.forEach((text, index) => {
    URL_ACTION_WITH_ACTION_REGEX.lastIndex = 0;
    const match = URL_ACTION_WITH_ACTION_REGEX.exec(text);
    console.log(`Test ${index + 1}: "${text}"`);
    console.log(`  Result: ${match ? 'MATCH' : 'NO MATCH'}`);
    if (match) {
        console.log(`  Action: ${match[1]}`);
    }
    console.log('');
});
