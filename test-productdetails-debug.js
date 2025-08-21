// Test to diagnose why tag helpers aren't working in ProductDetails.cshtml
const fs = require('fs');

console.log('Investigating ProductDetails.cshtml tag helper issue...\n');

// Check if the file exists and what content it has
const filePath = './sample/Project2/Views/Product/ProductDetails.cshtml';

try {
    if (fs.existsSync(filePath)) {
        console.log('✅ File exists:', filePath);
        
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('\n📄 File content preview:');
        console.log('=' .repeat(50));
        
        // Show lines around the problematic tag
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (line.includes('asp-action')) {
                console.log(`Line ${index + 1}: ${line.trim()}`);
                
                // Test our regex on this exact line
                const anchorActionRegex = /<a[^>]*asp-action\s*=\s*["']([^"']+)["'][^>]*>/g;
                const match = anchorActionRegex.exec(line);
                
                if (match) {
                    console.log(`  ✅ Regex matches! Action: "${match[1]}"`);
                } else {
                    console.log(`  ❌ Regex does NOT match this line`);
                }
            }
        });
        
        console.log('=' .repeat(50));
        
        // Check if there are any other asp-action tags in the file
        const allMatches = content.match(/<a[^>]*asp-action[^>]*>/g);
        if (allMatches) {
            console.log(`\n🔍 Found ${allMatches.length} asp-action tag(s) in file:`);
            allMatches.forEach((match, index) => {
                console.log(`  ${index + 1}. ${match}`);
            });
        } else {
            console.log('\n❌ No asp-action tags found in file!');
        }
        
    } else {
        console.log('❌ File does not exist:', filePath);
    }
} catch (error) {
    console.log('❌ Error reading file:', error.message);
}

console.log('\n💡 Potential Issues to Check:');
console.log('1. VS Code might not be recognizing .cshtml as the right language ID');
console.log('2. Document link provider might not be triggering for this specific file');
console.log('3. The extension might need to be reloaded/recompiled');
console.log('4. There might be a scoping issue with the tag helper processing');

console.log('\n🔧 Debug Steps:');
console.log('1. Try reloading the VS Code window (Ctrl+Shift+P -> "Developer: Reload Window")');
console.log('2. Check VS Code status bar for the language mode when ProductDetails.cshtml is open');
console.log('3. Verify extension is active and working for other files');
console.log('4. Check if traditional @Html helpers work in the same file');
