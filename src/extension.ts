// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as RegexPatterns from './regexPatterns';
import { MvcDefinitionProvider } from './MvcDefinitionProvider';
import { MvcDocumentLinkProvider } from './MvcDocumentLinkProvider';
import { MvcDocumentHighlightProvider } from './MvcDocumentHighlightProvider';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.log('ASP.NET MVC Navigator extension is now active!');

    // Register the document link provider for C# files
    const linkProvider = new MvcDocumentLinkProvider();
    const disposableLinkProvider = vscode.languages.registerDocumentLinkProvider(
        { language: 'csharp' },
        linkProvider
    );

    // Register for Razor files as well
    const disposableRazorLinkProvider = vscode.languages.registerDocumentLinkProvider(
        [
            { language: 'html' }, 
            { language: 'razor' }, 
            { language: 'aspnetcorerazor' },
            { pattern: '**/*.cshtml' },
            { pattern: '**/*.razor' }
        ],
        linkProvider
    );

    // Register definition provider to prevent default Go to Definition behavior on our links
    const definitionProvider = new MvcDefinitionProvider(linkProvider);
    const disposableDefinitionProvider = vscode.languages.registerDefinitionProvider(
        { language: 'csharp' },
        definitionProvider
    );

    // Register definition provider for Razor files as well
    const disposableRazorDefinitionProvider = vscode.languages.registerDefinitionProvider(
        [
            { language: 'html' }, 
            { language: 'razor' }, 
            { language: 'aspnetcorerazor' },
            { pattern: '**/*.cshtml' },
            { pattern: '**/*.razor' }
        ],
        definitionProvider
    );

    // Register document highlight provider to prevent word highlighting on our links
    const highlightProvider = new MvcDocumentHighlightProvider(linkProvider);
    const disposableHighlightProvider = vscode.languages.registerDocumentHighlightProvider(
        [
            { language: 'html' }, 
            { language: 'razor' }, 
            { language: 'aspnetcorerazor' },
            { pattern: '**/*.cshtml' },
            { pattern: '**/*.razor' }
        ],
        highlightProvider
    );

    // Register custom command for action navigation with line positioning
    const disposableActionCommand = vscode.commands.registerCommand('vscode-mvcnavigator.navigateToAction', async (...args: any[]) => {
        try {
            let filePath: string;
            let lineNumber: number | undefined;
            
            // Handle different argument formats
            if (args.length >= 1) {
                const arg = args[0];
                if (typeof arg === 'string') {
                    // Check if it's a link ID or direct path
                    if (linkProvider.pendingNavigations.has(arg)) {
                        const navData = linkProvider.pendingNavigations.get(arg)!;
                        filePath = navData.path;
                        lineNumber = navData.lineNumber;
                        // Clean up the stored navigation
                        linkProvider.pendingNavigations.delete(arg);
                    } else {
                        // Direct path (legacy format)
                        filePath = arg;
                        lineNumber = args[1];
                    }
                } else {
                    throw new Error(`Invalid argument type: ${typeof arg}`);
                }
            } else {
                throw new Error('No arguments provided to navigateToAction command');
            }
            
            if (!filePath || typeof filePath !== 'string') {
                throw new Error(`Invalid filePath parameter: ${filePath} (type: ${typeof filePath})`);
            }
            
            const actionUri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(actionUri);
            
            if (lineNumber) {
                const position = new vscode.Position(lineNumber - 1, 0);
                const range = new vscode.Range(position, position);
                await vscode.window.showTextDocument(document, {
                    selection: range
                });
            } else {
                await vscode.window.showTextDocument(document);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to navigate to action: ${error}`);
        }
    });

    // Register custom command for controller navigation
    const disposableControllerCommand = vscode.commands.registerCommand('vscode-mvcnavigator.navigateToController', async (...args: any[]) => {
        try {
            let filePath: string;
            
            // Handle different argument formats
            if (args.length === 1) {
                const arg = args[0];
                if (typeof arg === 'string') {
                    // Check if it's a link ID or direct path
                    if (linkProvider.pendingNavigations.has(arg)) {
                        const navData = linkProvider.pendingNavigations.get(arg)!;
                        filePath = navData.path;
                        // Clean up the stored navigation
                        linkProvider.pendingNavigations.delete(arg);
                    } else {
                        // Direct path
                        filePath = arg;
                    }
                } else {
                    throw new Error(`Invalid argument type: ${typeof arg}`);
                }
            } else if (args.length > 1) {
                filePath = args[0];
            } else {
                throw new Error('No arguments provided to navigateToController command');
            }
            
            if (!filePath || typeof filePath !== 'string') {
                throw new Error(`Invalid filePath parameter: ${filePath} (type: ${typeof filePath})`);
            }
            
            const controllerUri = vscode.Uri.file(filePath);
            
            // First, read the file content to find the class definition line
            const document = await vscode.workspace.openTextDocument(controllerUri);
            const content = document.getText();
            const lines = content.split('\n');
            
            // Look for class declaration
            const classRegex = /^\s*(?:public|internal|private|protected)?\s*(?:abstract|sealed)?\s*class\s+\w+Controller\s*:/;
            let classPosition = new vscode.Position(0, 0); // Default to top of file
            
            for (let i = 0; i < lines.length; i++) {
                if (classRegex.test(lines[i])) {
                    classPosition = new vscode.Position(i, 0);
                    break;
                }
            }
            
            // Open the document with the cursor positioned at the class definition
            const range = new vscode.Range(classPosition, classPosition);
            await vscode.window.showTextDocument(document, {
                selection: range
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to navigate to controller: ${error}`);
        }
    });

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

        // Look for View() call with explicit name on current line (with or without additional parameters)
        const namedViewMatch = lineText.match(/\bView\s*\(\s*["']([^"']+)["']\s*(?:,\s*[^)]+)?\)/);
        if (namedViewMatch) {
            const viewName = namedViewMatch[1];
            
            // Check if this is a full path (starts with ~/)
            if (viewName.startsWith('~/')) {
                const linkProvider = new MvcDocumentLinkProvider();
                const resolvedPath = (linkProvider as any).resolveFullViewPath(document.uri, viewName);
                
                if (resolvedPath) {
                    const viewUri = vscode.Uri.file(resolvedPath);
                    await vscode.window.showTextDocument(viewUri);
                } else {
                    vscode.window.showWarningMessage(`Could not find view file for full path: ${viewName}`);
                }
            } else {
                // Handle regular view name
                const linkProvider = new MvcDocumentLinkProvider();
                const viewPath = (linkProvider as any).findViewFile(document.uri, viewName);
                
                if (viewPath) {
                    const viewUri = vscode.Uri.file(viewPath);
                    await vscode.window.showTextDocument(viewUri);
                } else {
                    vscode.window.showWarningMessage(`Could not find view file for: ${viewName}`);
                }
            }
            return;
        }

        // Look for PartialView() call with explicit name on current line (with or without additional parameters)
        const namedPartialViewMatch = lineText.match(/\bPartialView\s*\(\s*["']([^"']+)["']\s*(?:,\s*[^)]+)?\)/);
        if (namedPartialViewMatch) {
            const partialViewName = namedPartialViewMatch[1];
            
            // Check if this is a full path (starts with ~/)
            if (partialViewName.startsWith('~/')) {
                const linkProvider = new MvcDocumentLinkProvider();
                const resolvedPath = (linkProvider as any).resolveFullViewPath(document.uri, partialViewName);
                
                if (resolvedPath) {
                    const viewUri = vscode.Uri.file(resolvedPath);
                    await vscode.window.showTextDocument(viewUri);
                } else {
                    vscode.window.showWarningMessage(`Could not find partial view file for full path: ${partialViewName}`);
                }
            } else {
                // Handle regular partial view name
                const linkProvider = new MvcDocumentLinkProvider();
                const viewPath = (linkProvider as any).findPartialViewFile(document.uri, partialViewName);
                
                if (viewPath) {
                    const viewUri = vscode.Uri.file(viewPath);
                    await vscode.window.showTextDocument(viewUri);
                } else {
                    vscode.window.showWarningMessage(`Could not find partial view file for: ${partialViewName}`);
                }
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

        // Look for View() call with model on current line (e.g., View(new ErrorViewModel {...}))
        const viewWithModelMatch = lineText.match(/\bView\s*\(\s*(?!["'])[^)]+\)/);
        if (viewWithModelMatch) {
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
                vscode.window.showWarningMessage('Could not determine action name for View() call with model.');
            }
            return;
        }

        // Look for PartialView() call with model on current line (e.g., PartialView(new Model {...}))
        const partialViewWithModelMatch = lineText.match(/\bPartialView\s*\(\s*(?!["'])[^)]+\)/);
        if (partialViewWithModelMatch) {
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
                vscode.window.showWarningMessage('Could not determine action name for PartialView() call with model.');
            }
            return;
        }

        // Look for RedirectToAction() call with action name only
        const redirectToActionMatch = lineText.match(/\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*\)/);
        if (redirectToActionMatch) {
            const actionName = redirectToActionMatch[1];
            const linkProvider = new MvcDocumentLinkProvider();
            const actionPath = (linkProvider as any).findActionMethod(document.uri, actionName);
            
            if (actionPath) {
                const actionUri = vscode.Uri.file(actionPath.filePath);
                const documentToOpen = await vscode.workspace.openTextDocument(actionUri);
                if (actionPath.lineNumber) {
                    const position = new vscode.Position(actionPath.lineNumber - 1, 0);
                    const range = new vscode.Range(position, position);
                    await vscode.window.showTextDocument(documentToOpen, {
                        selection: range
                    });
                } else {
                    await vscode.window.showTextDocument(documentToOpen);
                }
            } else {
                vscode.window.showWarningMessage(`Could not find action method: ${actionName}`);
            }
            return;
        }

        // Look for RedirectToAction() call with area in route values first (most specific)
        const redirectToActionWithAreaMatch = lineText.match(/\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*new\s*\{[^}]*area\s*=\s*["']([^"']+)["'][^}]*\}\s*\)/);
        if (redirectToActionWithAreaMatch) {
            const actionName = redirectToActionWithAreaMatch[1];
            const controllerName = redirectToActionWithAreaMatch[2];
            const areaName = redirectToActionWithAreaMatch[3];
            const linkProvider = new MvcDocumentLinkProvider();
            const actionPath = (linkProvider as any).findActionMethodInControllerWithArea(document.uri, actionName, controllerName, areaName);
            
            if (actionPath) {
                const actionUri = vscode.Uri.file(actionPath.filePath);
                const documentToOpen = await vscode.workspace.openTextDocument(actionUri);
                if (actionPath.lineNumber) {
                    const position = new vscode.Position(actionPath.lineNumber - 1, 0);
                    const range = new vscode.Range(position, position);
                    await vscode.window.showTextDocument(documentToOpen, {
                        selection: range
                    });
                } else {
                    await vscode.window.showTextDocument(documentToOpen);
                }
            } else {
                vscode.window.showWarningMessage(`Could not find action method: ${actionName} in ${controllerName}Controller (Area: ${areaName})`);
            }
            return;
        }

        // Look for RedirectToAction() call with action and controller names
        const redirectToActionWithControllerMatch = lineText.match(/\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*(?:,\s*[^)]*)?\)/);
        if (redirectToActionWithControllerMatch) {
            const actionName = redirectToActionWithControllerMatch[1];
            const controllerName = redirectToActionWithControllerMatch[2];
            const linkProvider = new MvcDocumentLinkProvider();
            const actionPath = (linkProvider as any).findActionMethodInController(document.uri, actionName, controllerName);
            
            if (actionPath) {
                const actionUri = vscode.Uri.file(actionPath.filePath);
                const documentToOpen = await vscode.workspace.openTextDocument(actionUri);
                if (actionPath.lineNumber) {
                    const position = new vscode.Position(actionPath.lineNumber - 1, 0);
                    const range = new vscode.Range(position, position);
                    await vscode.window.showTextDocument(documentToOpen, {
                        selection: range
                    });
                } else {
                    await vscode.window.showTextDocument(documentToOpen);
                }
            } else {
                vscode.window.showWarningMessage(`Could not find action method: ${actionName} in ${controllerName}Controller`);
            }
            return;
        }

        // Look for RedirectToAction() call with action name and route values (anonymous object)
        const redirectToActionWithRouteMatch = lineText.match(/\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]*\}|[^"'][^,)]*)\s*\)/);
        if (redirectToActionWithRouteMatch) {
            const actionName = redirectToActionWithRouteMatch[1];
            const linkProvider = new MvcDocumentLinkProvider();
            const actionPath = (linkProvider as any).findActionMethod(document.uri, actionName);
            
            if (actionPath) {
                const actionUri = vscode.Uri.file(actionPath.filePath);
                const documentToOpen = await vscode.workspace.openTextDocument(actionUri);
                if (actionPath.lineNumber) {
                    const position = new vscode.Position(actionPath.lineNumber - 1, 0);
                    const range = new vscode.Range(position, position);
                    await vscode.window.showTextDocument(documentToOpen, {
                        selection: range
                    });
                } else {
                    await vscode.window.showTextDocument(documentToOpen);
                }
            } else {
                vscode.window.showWarningMessage(`Could not find action method: ${actionName}`);
            }
            return;
        }

        vscode.window.showWarningMessage('No View(), PartialView(), or RedirectToAction() call found on current line.');
    });

    // Register clear cache command
    const disposableClearCacheCommand = vscode.commands.registerCommand('vscode-mvcnavigator.clearCache', () => {
        linkProvider.clearCache();
        vscode.window.showInformationMessage('MVC Navigator cache cleared successfully.');
    });

    context.subscriptions.push(
        disposableLinkProvider, 
        disposableRazorLinkProvider, 
        disposableDefinitionProvider,
        disposableRazorDefinitionProvider,
        disposableHighlightProvider,
        disposableCommand, 
        disposableActionCommand, 
        disposableControllerCommand,
        disposableClearCacheCommand,
        linkProvider // Add the link provider for proper disposal
    );
}

// This method is called when your extension is deactivated
export function deactivate() {
    // The context.subscriptions will automatically dispose of registered providers
    // including the linkProvider which will call its dispose() method
}


