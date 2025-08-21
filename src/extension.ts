// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Regular expressions to match View() calls
const VIEW_CALL_WITH_NAME_REGEX = /\bView\s*\(\s*["']([^"']+)["']\s*\)/g;
const VIEW_CALL_PARAMETERLESS_REGEX = /\bView\s*\(\s*\)/g;

// Regular expressions to match PartialView() calls
const PARTIAL_VIEW_CALL_WITH_NAME_REGEX = /\bPartialView\s*\(\s*["']([^"']+)["']\s*\)/g;
const PARTIAL_VIEW_CALL_PARAMETERLESS_REGEX = /\bPartialView\s*\(\s*\)/g;

class MvcDocumentLinkProvider implements vscode.DocumentLinkProvider {
    
    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
        const links: vscode.DocumentLink[] = [];
        
        // Only process C# files
        if (document.languageId !== 'csharp') {
            return links;
        }

        const text = document.getText();
        
        // Handle View("ViewName") calls
        this.processViewCallsWithName(document, text, links);
        
        // Handle parameterless View() calls
        this.processParameterlessViewCalls(document, text, links);

        // Handle PartialView("PartialName") calls
        this.processPartialViewCallsWithName(document, text, links);
        
        // Handle parameterless PartialView() calls
        this.processParameterlessPartialViewCalls(document, text, links);

        return links;
    }

    private processViewCallsWithName(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        VIEW_CALL_WITH_NAME_REGEX.lastIndex = 0;

        while ((match = VIEW_CALL_WITH_NAME_REGEX.exec(text)) !== null) {
            const viewName = match[1];
            const startPos = document.positionAt(match.index + match[0].indexOf(match[1]) - 1); // Include the quote
            const endPos = document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length + 1); // Include the quote
            
            const range = new vscode.Range(startPos, endPos);
            const viewPath = this.findViewFile(document.uri, viewName);
            
            if (viewPath) {
                const link = new vscode.DocumentLink(range, vscode.Uri.file(viewPath));
                link.tooltip = `Navigate to ${viewName}.cshtml`;
                links.push(link);
            }
        }
    }

    private processParameterlessViewCalls(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        VIEW_CALL_PARAMETERLESS_REGEX.lastIndex = 0;

        while ((match = VIEW_CALL_PARAMETERLESS_REGEX.exec(text)) !== null) {
            const actionName = this.getActionNameFromPosition(document, match.index);
            if (actionName) {
                // Find the "View" text within the match
                const viewWordIndex = match[0].indexOf('View');
                const startPos = document.positionAt(match.index + viewWordIndex);
                const endPos = document.positionAt(match.index + viewWordIndex + 4); // "View" is 4 characters
                
                const range = new vscode.Range(startPos, endPos);
                const viewPath = this.findViewFile(document.uri, actionName);
                
                if (viewPath) {
                    const link = new vscode.DocumentLink(range, vscode.Uri.file(viewPath));
                    link.tooltip = `Navigate to ${actionName}.cshtml`;
                    links.push(link);
                }
            }
        }
    }

    private processPartialViewCallsWithName(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        PARTIAL_VIEW_CALL_WITH_NAME_REGEX.lastIndex = 0;

        while ((match = PARTIAL_VIEW_CALL_WITH_NAME_REGEX.exec(text)) !== null) {
            const partialViewName = match[1];
            const startPos = document.positionAt(match.index + match[0].indexOf(match[1]) - 1); // Include the quote
            const endPos = document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length + 1); // Include the quote
            
            const range = new vscode.Range(startPos, endPos);
            const viewPath = this.findPartialViewFile(document.uri, partialViewName);
            
            if (viewPath) {
                const link = new vscode.DocumentLink(range, vscode.Uri.file(viewPath));
                link.tooltip = `Navigate to ${partialViewName}.cshtml`;
                links.push(link);
            }
        }
    }

    private processParameterlessPartialViewCalls(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        PARTIAL_VIEW_CALL_PARAMETERLESS_REGEX.lastIndex = 0;

        while ((match = PARTIAL_VIEW_CALL_PARAMETERLESS_REGEX.exec(text)) !== null) {
            const actionName = this.getActionNameFromPosition(document, match.index);
            if (actionName) {
                // Find the "PartialView" text within the match
                const partialViewWordIndex = match[0].indexOf('PartialView');
                const startPos = document.positionAt(match.index + partialViewWordIndex);
                const endPos = document.positionAt(match.index + partialViewWordIndex + 11); // "PartialView" is 11 characters
                
                const range = new vscode.Range(startPos, endPos);
                const viewPath = this.findPartialViewFile(document.uri, actionName);
                
                if (viewPath) {
                    const link = new vscode.DocumentLink(range, vscode.Uri.file(viewPath));
                    link.tooltip = `Navigate to ${actionName}.cshtml`;
                    links.push(link);
                }
            }
        }
    }

    private getActionNameFromPosition(document: vscode.TextDocument, position: number): string | null {
        const textUpToPosition = document.getText(new vscode.Range(new vscode.Position(0, 0), document.positionAt(position)));
        
        // Look for the nearest method declaration before this position
        // Pattern matches: public/private/protected IActionResult/ActionResult MethodName(
        const methodRegex = /(?:public|private|protected|internal)?\s*(?:async\s+)?(?:Task<)?(?:IActionResult|ActionResult|IActionResult<[^>]+>|ActionResult<[^>]+>)>?\s+(\w+)\s*\([^)]*\)\s*\{[^}]*$/;
        
        const lines = textUpToPosition.split('\n');
        
        // Search backwards from the current line to find the method declaration
        for (let i = lines.length - 1; i >= 0; i--) {
            const cumulativeText = lines.slice(Math.max(0, i - 5), i + 1).join('\n'); // Look at a few lines of context
            const match = cumulativeText.match(methodRegex);
            if (match) {
                return match[1]; // Return the method name
            }
        }
        
        return null;
    }

    private findViewFile(controllerUri: vscode.Uri, viewName: string): string | null {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(controllerUri);
        if (!workspaceFolder) {
            return null;
        }

        // Extract controller name from file path
        const controllerFileName = path.basename(controllerUri.fsPath, '.cs');
        let controllerName = controllerFileName;
        
        // Remove "Controller" suffix if present
        if (controllerName.endsWith('Controller')) {
            controllerName = controllerName.substring(0, controllerName.length - 'Controller'.length);
        }

        // Detect if this controller is in an Area
        const areaInfo = this.detectAreaFromControllerPath(controllerUri.fsPath);

        // Find potential MVC project roots
        const projectRoots = this.findMvcProjectRoots(workspaceFolder.uri.fsPath, controllerUri.fsPath);
        
        for (const projectRoot of projectRoots) {
            const viewPath = this.searchViewInProject(projectRoot, controllerName, viewName, areaInfo);
            if (viewPath) {
                return viewPath;
            }
        }

        return null;
    }

    private findPartialViewFile(controllerUri: vscode.Uri, partialViewName: string): string | null {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(controllerUri);
        if (!workspaceFolder) {
            return null;
        }

        // Extract controller name from file path
        const controllerFileName = path.basename(controllerUri.fsPath, '.cs');
        let controllerName = controllerFileName;
        
        // Remove "Controller" suffix if present
        if (controllerName.endsWith('Controller')) {
            controllerName = controllerName.substring(0, controllerName.length - 'Controller'.length);
        }

        // Detect if this controller is in an Area
        const areaInfo = this.detectAreaFromControllerPath(controllerUri.fsPath);

        // Find potential MVC project roots
        const projectRoots = this.findMvcProjectRoots(workspaceFolder.uri.fsPath, controllerUri.fsPath);
        
        for (const projectRoot of projectRoots) {
            const viewPath = this.searchPartialViewInProject(projectRoot, controllerName, partialViewName, areaInfo);
            if (viewPath) {
                return viewPath;
            }
        }

        return null;
    }

    private detectAreaFromControllerPath(controllerPath: string): { areaName: string; isAreaController: boolean } | null {
        // Check if the controller is in an Area by examining the path
        // Standard Area path: .../Areas/{AreaName}/Controllers/{Controller}.cs
        const pathParts = controllerPath.replace(/\\/g, '/').split('/');
        
        for (let i = 0; i < pathParts.length - 2; i++) {
            if (pathParts[i].toLowerCase() === 'areas' && pathParts[i + 2].toLowerCase() === 'controllers') {
                return {
                    areaName: pathParts[i + 1],
                    isAreaController: true
                };
            }
        }
        
        return null;
    }

    private findMvcProjectRoots(workspaceRoot: string, controllerPath: string): string[] {
        const projectRoots: string[] = [];
        
        // Start from the controller's directory and walk up to find potential project roots
        let currentDir = path.dirname(controllerPath);
        
        while (currentDir !== workspaceRoot && currentDir !== path.dirname(currentDir)) {
            // Check if this directory looks like an MVC project root
            if (this.isMvcProjectRoot(currentDir)) {
                projectRoots.push(currentDir);
            }
            currentDir = path.dirname(currentDir);
        }
        
        // Also check the workspace root itself
        if (this.isMvcProjectRoot(workspaceRoot)) {
            projectRoots.push(workspaceRoot);
        }
        
        // If no project roots found, fall back to workspace root
        if (projectRoots.length === 0) {
            projectRoots.push(workspaceRoot);
        }
        
        return projectRoots;
    }

    private isMvcProjectRoot(directory: string): boolean {
        try {
            // Check for common MVC project indicators
            const hasViews = fs.existsSync(path.join(directory, 'Views'));
            const hasControllers = fs.existsSync(path.join(directory, 'Controllers'));
            const hasCsproj = fs.readdirSync(directory).some(file => file.endsWith('.csproj'));
            const hasProgram = fs.existsSync(path.join(directory, 'Program.cs'));
            const hasStartup = fs.existsSync(path.join(directory, 'Startup.cs'));
            const hasWwwroot = fs.existsSync(path.join(directory, 'wwwroot'));
            
            // Consider it an MVC project if it has Views folder OR Controllers folder,
            // AND at least one other MVC indicator
            return (hasViews || hasControllers) && (hasCsproj || hasProgram || hasStartup || hasWwwroot);
        } catch (error) {
            return false;
        }
    }

    private searchViewInProject(projectRoot: string, controllerName: string, viewName: string, areaInfo: { areaName: string; isAreaController: boolean } | null = null): string | null {
        let possibleViewPaths: string[] = [];

        if (areaInfo && areaInfo.isAreaController) {
            // If this is an Area controller, prioritize Area-specific paths
            possibleViewPaths = [
                // Area-specific views
                path.join(projectRoot, 'Areas', areaInfo.areaName, 'Views', controllerName, `${viewName}.cshtml`),
                path.join(projectRoot, 'Areas', areaInfo.areaName, 'Views', controllerName, `${viewName}.razor`),
                
                // Area shared views
                path.join(projectRoot, 'Areas', areaInfo.areaName, 'Views', 'Shared', `${viewName}.cshtml`),
                path.join(projectRoot, 'Areas', areaInfo.areaName, 'Views', 'Shared', `${viewName}.razor`),
                
                // Fallback to main shared views
                path.join(projectRoot, 'Views', 'Shared', `${viewName}.cshtml`),
                path.join(projectRoot, 'Views', 'Shared', `${viewName}.razor`),
            ];
        } else {
            // Standard MVC view folder patterns within a specific project
            possibleViewPaths = [
                // Standard MVC structure
                path.join(projectRoot, 'Views', controllerName, `${viewName}.cshtml`),
                path.join(projectRoot, 'Views', controllerName, `${viewName}.razor`),
                
                // Shared views
                path.join(projectRoot, 'Views', 'Shared', `${viewName}.cshtml`),
                path.join(projectRoot, 'Views', 'Shared', `${viewName}.razor`),
                
                // Also search in all Areas as fallback for non-area controllers
                path.join(projectRoot, 'Areas', '*', 'Views', controllerName, `${viewName}.cshtml`),
                path.join(projectRoot, 'Areas', '*', 'Views', controllerName, `${viewName}.razor`),
                path.join(projectRoot, 'Areas', '*', 'Views', 'Shared', `${viewName}.cshtml`),
                path.join(projectRoot, 'Areas', '*', 'Views', 'Shared', `${viewName}.razor`),
                
                // Web project structure
                path.join(projectRoot, 'wwwroot', 'Views', controllerName, `${viewName}.cshtml`),
                
                // Different project structures within the project
                path.join(projectRoot, 'src', 'Views', controllerName, `${viewName}.cshtml`),
                path.join(projectRoot, 'Web', 'Views', controllerName, `${viewName}.cshtml`),
            ];
        }

        // Check each possible path
        for (const viewPath of possibleViewPaths) {
            if (viewPath.includes('*')) {
                // Handle Areas wildcard
                const result = this.searchInAreas(viewPath, projectRoot, controllerName);
                if (result) {
                    return result;
                }
            } else if (fs.existsSync(viewPath)) {
                return viewPath;
            }
        }

        return null;
    }

    private searchPartialViewInProject(projectRoot: string, controllerName: string, partialViewName: string, areaInfo: { areaName: string; isAreaController: boolean } | null = null): string | null {
        let possiblePartialViewPaths: string[] = [];

        if (areaInfo && areaInfo.isAreaController) {
            // If this is an Area controller, prioritize Area-specific paths
            possiblePartialViewPaths = [
                // Area-specific partials in controller folder
                path.join(projectRoot, 'Areas', areaInfo.areaName, 'Views', controllerName, `${partialViewName}.cshtml`),
                path.join(projectRoot, 'Areas', areaInfo.areaName, 'Views', controllerName, `${partialViewName}.razor`),
                
                // Area shared partials (most common for partial views)
                path.join(projectRoot, 'Areas', areaInfo.areaName, 'Views', 'Shared', `${partialViewName}.cshtml`),
                path.join(projectRoot, 'Areas', areaInfo.areaName, 'Views', 'Shared', `${partialViewName}.razor`),
                
                // Fallback to main shared partials
                path.join(projectRoot, 'Views', 'Shared', `${partialViewName}.cshtml`),
                path.join(projectRoot, 'Views', 'Shared', `${partialViewName}.razor`),
                
                // Fallback to main controller-specific partials
                path.join(projectRoot, 'Views', controllerName, `${partialViewName}.cshtml`),
                path.join(projectRoot, 'Views', controllerName, `${partialViewName}.razor`),
            ];
        } else {
            // Common MVC partial view folder patterns within a specific project
            possiblePartialViewPaths = [
                // Controller-specific partials
                path.join(projectRoot, 'Views', controllerName, `${partialViewName}.cshtml`),
                path.join(projectRoot, 'Views', controllerName, `${partialViewName}.razor`),
                
                // Shared partials (most common for partial views)
                path.join(projectRoot, 'Views', 'Shared', `${partialViewName}.cshtml`),
                path.join(projectRoot, 'Views', 'Shared', `${partialViewName}.razor`),
                
                // Areas structure
                path.join(projectRoot, 'Areas', '*', 'Views', controllerName, `${partialViewName}.cshtml`),
                path.join(projectRoot, 'Areas', '*', 'Views', controllerName, `${partialViewName}.razor`),
                path.join(projectRoot, 'Areas', '*', 'Views', 'Shared', `${partialViewName}.cshtml`),
                path.join(projectRoot, 'Areas', '*', 'Views', 'Shared', `${partialViewName}.razor`),
                
                // Different project structures
                path.join(projectRoot, 'src', 'Views', controllerName, `${partialViewName}.cshtml`),
                path.join(projectRoot, 'src', 'Views', 'Shared', `${partialViewName}.cshtml`),
                path.join(projectRoot, 'Web', 'Views', controllerName, `${partialViewName}.cshtml`),
                path.join(projectRoot, 'Web', 'Views', 'Shared', `${partialViewName}.cshtml`),
                
                // wwwroot structure
                path.join(projectRoot, 'wwwroot', 'Views', controllerName, `${partialViewName}.cshtml`),
                path.join(projectRoot, 'wwwroot', 'Views', 'Shared', `${partialViewName}.cshtml`),
            ];
        }

        // Check each possible path
        for (const viewPath of possiblePartialViewPaths) {
            if (viewPath.includes('*')) {
                // Handle Areas wildcard
                const result = this.searchInAreas(viewPath, projectRoot, controllerName);
                if (result) {
                    return result;
                }
            } else if (fs.existsSync(viewPath)) {
                return viewPath;
            }
        }

        return null;
    }

    private searchInAreas(viewPathPattern: string, projectRoot: string, controllerName: string): string | null {
        const basePath = path.dirname(viewPathPattern);
        const pattern = path.basename(viewPathPattern);
        try {
            const areasPath = path.join(projectRoot, 'Areas');
            if (fs.existsSync(areasPath)) {
                const areas = fs.readdirSync(areasPath, { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => dirent.name);
                
                for (const area of areas) {
                    const areaViewPath = path.join(areasPath, area, 'Views', controllerName, pattern);
                    if (fs.existsSync(areaViewPath)) {
                        return areaViewPath;
                    }
                    
                    // Also check Shared folder in areas for partial views
                    if (viewPathPattern.includes('Shared')) {
                        const areaSharedViewPath = path.join(areasPath, area, 'Views', 'Shared', pattern);
                        if (fs.existsSync(areaSharedViewPath)) {
                            return areaSharedViewPath;
                        }
                    }
                }
            }
        } catch (error) {
            // Continue to next path
        }
        return null;
    }
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.log('ASP.NET MVC Navigator extension is now active!');

    // Register the document link provider for C# files
    const linkProvider = new MvcDocumentLinkProvider();
    const disposableLinkProvider = vscode.languages.registerDocumentLinkProvider(
        { language: 'csharp' },
        linkProvider
    );

    // Register command for manual navigation
    const disposableCommand = vscode.commands.registerCommand('vscode-mvcnavigator.navigateToView', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'csharp') {
            vscode.window.showWarningMessage('Please open a C# controller file first.');
            return;
        }

        const position = editor.selection.active;
        const document = editor.document;
        const line = document.lineAt(position.line);
        const lineText = line.text;

        // Look for View() call with explicit name on current line
        const namedViewMatch = lineText.match(/\bView\s*\(\s*["']([^"']+)["']\s*\)/);
        if (namedViewMatch) {
            const viewName = namedViewMatch[1];
            const linkProvider = new MvcDocumentLinkProvider();
            const viewPath = (linkProvider as any).findViewFile(document.uri, viewName);
            
            if (viewPath) {
                const viewUri = vscode.Uri.file(viewPath);
                await vscode.window.showTextDocument(viewUri);
            } else {
                vscode.window.showWarningMessage(`Could not find view file for: ${viewName}`);
            }
            return;
        }

        // Look for PartialView() call with explicit name on current line
        const namedPartialViewMatch = lineText.match(/\bPartialView\s*\(\s*["']([^"']+)["']\s*\)/);
        if (namedPartialViewMatch) {
            const partialViewName = namedPartialViewMatch[1];
            const linkProvider = new MvcDocumentLinkProvider();
            const viewPath = (linkProvider as any).findPartialViewFile(document.uri, partialViewName);
            
            if (viewPath) {
                const viewUri = vscode.Uri.file(viewPath);
                await vscode.window.showTextDocument(viewUri);
            } else {
                vscode.window.showWarningMessage(`Could not find partial view file for: ${partialViewName}`);
            }
            return;
        }

        // Look for parameterless View() call on current line
        const parameterlessViewMatch = lineText.match(/\bView\s*\(\s*\)/);
        if (parameterlessViewMatch) {
            const linkProvider = new MvcDocumentLinkProvider();
            const actionName = (linkProvider as any).getActionNameFromPosition(document, document.offsetAt(position));
            
            if (actionName) {
                const viewPath = (linkProvider as any).findViewFile(document.uri, actionName);
                
                if (viewPath) {
                    const viewUri = vscode.Uri.file(viewPath);
                    await vscode.window.showTextDocument(viewUri);
                } else {
                    vscode.window.showWarningMessage(`Could not find view file for action: ${actionName}`);
                }
            } else {
                vscode.window.showWarningMessage('Could not determine action name for parameterless View() call.');
            }
            return;
        }

        // Look for parameterless PartialView() call on current line
        const parameterlessPartialViewMatch = lineText.match(/\bPartialView\s*\(\s*\)/);
        if (parameterlessPartialViewMatch) {
            const linkProvider = new MvcDocumentLinkProvider();
            const actionName = (linkProvider as any).getActionNameFromPosition(document, document.offsetAt(position));
            
            if (actionName) {
                const viewPath = (linkProvider as any).findPartialViewFile(document.uri, actionName);
                
                if (viewPath) {
                    const viewUri = vscode.Uri.file(viewPath);
                    await vscode.window.showTextDocument(viewUri);
                } else {
                    vscode.window.showWarningMessage(`Could not find partial view file for action: ${actionName}`);
                }
            } else {
                vscode.window.showWarningMessage('Could not determine action name for parameterless PartialView() call.');
            }
            return;
        }

        vscode.window.showWarningMessage('No View() or PartialView() call found on current line.');
    });

    context.subscriptions.push(disposableLinkProvider, disposableCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
