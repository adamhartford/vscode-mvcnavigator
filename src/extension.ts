// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Regular expressions to match View() calls
const VIEW_CALL_WITH_NAME_REGEX = /\bView\s*\(\s*["']([^"']+)["']\s*\)/g;
const VIEW_CALL_PARAMETERLESS_REGEX = /\bView\s*\(\s*\)/g;

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

        const workspaceRoot = workspaceFolder.uri.fsPath;
        
        // Common MVC view folder patterns
        const possibleViewPaths = [
            // Standard MVC structure
            path.join(workspaceRoot, 'Views', controllerName, `${viewName}.cshtml`),
            path.join(workspaceRoot, 'Views', controllerName, `${viewName}.razor`),
            
            // Areas structure
            path.join(workspaceRoot, 'Areas', '*', 'Views', controllerName, `${viewName}.cshtml`),
            path.join(workspaceRoot, 'Areas', '*', 'Views', controllerName, `${viewName}.razor`),
            
            // Shared views
            path.join(workspaceRoot, 'Views', 'Shared', `${viewName}.cshtml`),
            path.join(workspaceRoot, 'Views', 'Shared', `${viewName}.razor`),
            
            // Web project structure
            path.join(workspaceRoot, 'wwwroot', 'Views', controllerName, `${viewName}.cshtml`),
            
            // Different project structures
            path.join(workspaceRoot, 'src', 'Views', controllerName, `${viewName}.cshtml`),
            path.join(workspaceRoot, 'Web', 'Views', controllerName, `${viewName}.cshtml`),
        ];

        // Check each possible path
        for (const viewPath of possibleViewPaths) {
            if (viewPath.includes('*')) {
                // Handle Areas wildcard
                const basePath = path.dirname(viewPath);
                const pattern = path.basename(viewPath);
                try {
                    const areasPath = path.dirname(basePath);
                    if (fs.existsSync(areasPath)) {
                        const areas = fs.readdirSync(areasPath, { withFileTypes: true })
                            .filter(dirent => dirent.isDirectory())
                            .map(dirent => dirent.name);
                        
                        for (const area of areas) {
                            const areaViewPath = path.join(areasPath, area, 'Views', controllerName, pattern);
                            if (fs.existsSync(areaViewPath)) {
                                return areaViewPath;
                            }
                        }
                    }
                } catch (error) {
                    // Continue to next path
                }
            } else if (fs.existsSync(viewPath)) {
                return viewPath;
            }
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

        vscode.window.showWarningMessage('No View() call found on current line.');
    });

    context.subscriptions.push(disposableLinkProvider, disposableCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
