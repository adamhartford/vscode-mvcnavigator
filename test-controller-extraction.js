function extractControllerNameFromViewPath(viewPath) {
    const normalizedPath = viewPath.replace(/\\/g, '/');
    
    console.log('Normalized path:', normalizedPath);
    
    // Check for Areas pattern first
    const areasMatch = normalizedPath.match(/\/Areas\/[^\/]+\/Views\/([^\/]+)\//);
    if (areasMatch) {
        console.log('Areas match:', areasMatch[1]);
        return areasMatch[1];
    }
    
    // Check for standard Views pattern
    const viewsMatch = normalizedPath.match(/\/Views\/([^\/]+)\//);
    if (viewsMatch) {
        console.log('Views match:', viewsMatch[1]);
        return viewsMatch[1];
    }
    
    console.log('No match found');
    return null;
}

const testPath = 'c:\\Users\\adamh\\projects\\vscode-mvcnavigator\\vscode-mvcnavigator\\sample\\Views\\Home\\UrlActionTest.cshtml';
console.log('Test path:', testPath);
console.log('Controller name:', extractControllerNameFromViewPath(testPath));
