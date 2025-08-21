// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Regular expression to match View() calls
const VIEW_CALL_REGEX = /\bView\s*\(\s*["']([^"']+)["']\s*\)/g;

class MvcDocumentLinkProvider implements vscode.DocumentLinkProvider {
    
    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
        const links: vscode.DocumentLink[] = [];
        
        // Only process C# files
        if (document.languageId !== 'csharp') {
            return links;
        }

        const text = document.getText();
        let match;

        // Reset regex index
        VIEW_CALL_REGEX.lastIndex = 0;

        while ((match = VIEW_CALL_REGEX.exec(text)) !== null) {
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

        return links;
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

        // Look for View() call on current line
        const match = lineText.match(/\bView\s*\(\s*["']([^"']+)["']\s*\)/);
        if (match) {
            const viewName = match[1];
            const linkProvider = new MvcDocumentLinkProvider();
            const viewPath = (linkProvider as any).findViewFile(document.uri, viewName);
            
            if (viewPath) {
                const viewUri = vscode.Uri.file(viewPath);
                await vscode.window.showTextDocument(viewUri);
            } else {
                vscode.window.showWarningMessage(`Could not find view file for: ${viewName}`);
            }
        } else {
            vscode.window.showWarningMessage('No View() call found on current line.');
        }
    });

    context.subscriptions.push(disposableLinkProvider, disposableCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
