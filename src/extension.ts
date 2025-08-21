// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Regular expressions to match View() calls
const VIEW_CALL_WITH_NAME_REGEX = /\bView\s*\(\s*["']([^"']+)["']\s*\)/g;
const VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX = /\bView\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g; // View("ViewName", model, ...)
const VIEW_CALL_PARAMETERLESS_REGEX = /\bView\s*\(\s*\)/g;
const VIEW_CALL_WITH_MODEL_REGEX = /\bView\s*\(\s*(?!["'])[^)]+\)/g; // View(model) or View(new Model{...})

// Regular expressions to match PartialView() calls
const PARTIAL_VIEW_CALL_WITH_NAME_REGEX = /\bPartialView\s*\(\s*["']([^"']+)["']\s*\)/g;
const PARTIAL_VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX = /\bPartialView\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g; // PartialView("ViewName", model, ...)
const PARTIAL_VIEW_CALL_PARAMETERLESS_REGEX = /\bPartialView\s*\(\s*\)/g;
const PARTIAL_VIEW_CALL_WITH_MODEL_REGEX = /\bPartialView\s*\(\s*(?!["'])[^)]+\)/g; // PartialView(model) or PartialView(new Model{...})

// Regular expressions to match View() and PartialView() calls with full paths
const VIEW_CALL_WITH_FULL_PATH_REGEX = /\b(View|PartialView)\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*\)/g;
const VIEW_CALL_WITH_FULL_PATH_AND_PARAMS_REGEX = /\b(View|PartialView)\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;

// Regular expressions to match RedirectToAction() calls
const REDIRECT_TO_ACTION_WITH_ACTION_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*\)/g;
const REDIRECT_TO_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
const REDIRECT_TO_ACTION_WITH_PARAMS_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const REDIRECT_TO_ACTION_ANONYMOUS_OBJECT_REGEX = /\bRedirectToAction\s*\(\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;

// Regular expressions to match @Url.Action() calls in Razor views
const URL_ACTION_WITH_ACTION_REGEX = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*\)/g;
const URL_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
const URL_ACTION_WITH_PARAMS_REGEX = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const URL_ACTION_ANONYMOUS_OBJECT_REGEX = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;

// Regular expressions to match @Html.ActionLink() calls in Razor views
const HTML_ACTION_LINK_WITH_ACTION_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*\)/g;
const HTML_ACTION_LINK_WITH_ACTION_AND_CONTROLLER_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
const HTML_ACTION_LINK_WITH_PARAMS_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const HTML_ACTION_LINK_ANONYMOUS_OBJECT_REGEX = /@?Html\.ActionLink\s*\(\s*["'][^"']*["']\s*,\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;

// Regular expressions to match @Html.BeginForm() calls in Razor views
const HTML_BEGIN_FORM_WITH_ACTION_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*\)/g;
const HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
const HTML_BEGIN_FORM_WITH_PARAMS_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const HTML_BEGIN_FORM_ANONYMOUS_OBJECT_REGEX = /@?Html\.BeginForm\s*\(\s*["']([^"']+)["']\s*,\s*(?:new\s*\{[^}]+\}|[^"'][^,)]*)\s*\)/g;

class MvcDocumentLinkProvider implements vscode.DocumentLinkProvider {
    
    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
        const links: vscode.DocumentLink[] = [];
        
        // Process C# files for controller-based navigation
        if (document.languageId === 'csharp') {
            this.processCSharptNavigations(document, links);
        }
        
        // Process Razor/HTML files for @Url.Action navigation
        if (document.languageId === 'razor' || document.languageId === 'html' || 
            document.languageId === 'aspnetcorerazor' ||
            document.fileName.endsWith('.cshtml') || document.fileName.endsWith('.razor')) {
            this.processRazorNavigations(document, links);
        }

        return links;
    }

    private processCSharptNavigations(document: vscode.TextDocument, links: vscode.DocumentLink[]): void {
        const text = document.getText();
        
        // Handle View("ViewName") calls
        this.processViewCallsWithName(document, text, links);
        
        // Handle View("ViewName", model, ...) calls
        this.processViewCallsWithNameAndParams(document, text, links);
        
        // Handle parameterless View() calls
        this.processParameterlessViewCalls(document, text, links);

        // Handle View(model) calls (treated as parameterless for view resolution)
        this.processViewCallsWithModel(document, text, links);

        // Handle PartialView("PartialName") calls
        this.processPartialViewCallsWithName(document, text, links);
        
        // Handle PartialView("PartialName", model, ...) calls
        this.processPartialViewCallsWithNameAndParams(document, text, links);
        
        // Handle parameterless PartialView() calls
        this.processParameterlessPartialViewCalls(document, text, links);

        // Handle PartialView(model) calls (treated as parameterless for view resolution)
        this.processPartialViewCallsWithModel(document, text, links);

        // Handle View() and PartialView() calls with full paths
        this.processViewCallsWithFullPath(document, text, links);
        
        // Handle View() and PartialView() calls with full paths and parameters
        this.processViewCallsWithFullPathAndParams(document, text, links);

        // Handle RedirectToAction("ActionName") calls
        this.processRedirectToActionWithAction(document, text, links);

        // Handle RedirectToAction("ActionName", "ControllerName") calls
        this.processRedirectToActionWithActionAndController(document, text, links);

        // Handle RedirectToAction("ActionName", "ControllerName", routeValues) calls
        this.processRedirectToActionWithParams(document, text, links);

        // Handle RedirectToAction("ActionName", routeValues) calls
        this.processRedirectToActionWithAnonymousObject(document, text, links);
    }

    private processRazorNavigations(document: vscode.TextDocument, links: vscode.DocumentLink[]): void {
        const text = document.getText();
        
        // Handle @Url.Action("ActionName") calls
        this.processUrlActionWithAction(document, text, links);

        // Handle @Url.Action("ActionName", "ControllerName") calls
        this.processUrlActionWithActionAndController(document, text, links);

        // Handle @Url.Action("ActionName", "ControllerName", routeValues) calls
        this.processUrlActionWithParams(document, text, links);

        // Handle @Url.Action("ActionName", routeValues) calls
        this.processUrlActionWithAnonymousObject(document, text, links);

        // Handle @Html.ActionLink("LinkText", "ActionName") calls
        this.processHtmlActionLinkWithAction(document, text, links);

        // Handle @Html.ActionLink("LinkText", "ActionName", "ControllerName") calls
        this.processHtmlActionLinkWithActionAndController(document, text, links);

        // Handle @Html.ActionLink("LinkText", "ActionName", "ControllerName", routeValues) calls
        this.processHtmlActionLinkWithParams(document, text, links);

        // Handle @Html.ActionLink("LinkText", "ActionName", routeValues) calls
        this.processHtmlActionLinkWithAnonymousObject(document, text, links);

        // Handle @Html.BeginForm("ActionName") calls
        this.processHtmlBeginFormWithAction(document, text, links);

        // Handle @Html.BeginForm("ActionName", "ControllerName") calls
        this.processHtmlBeginFormWithActionAndController(document, text, links);

        // Handle @Html.BeginForm("ActionName", "ControllerName", routeValues) calls
        this.processHtmlBeginFormWithParams(document, text, links);

        // Handle @Html.BeginForm("ActionName", routeValues) calls
        this.processHtmlBeginFormWithAnonymousObject(document, text, links);
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

    private processViewCallsWithNameAndParams(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX.lastIndex = 0;

        while ((match = VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX.exec(text)) !== null) {
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

    private processPartialViewCallsWithNameAndParams(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        PARTIAL_VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX.lastIndex = 0;

        while ((match = PARTIAL_VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX.exec(text)) !== null) {
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

    private processViewCallsWithModel(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        VIEW_CALL_WITH_MODEL_REGEX.lastIndex = 0;

        while ((match = VIEW_CALL_WITH_MODEL_REGEX.exec(text)) !== null) {
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
                    link.tooltip = `Navigate to ${actionName}.cshtml (View with model)`;
                    links.push(link);
                }
            }
        }
    }

    private processPartialViewCallsWithModel(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        PARTIAL_VIEW_CALL_WITH_MODEL_REGEX.lastIndex = 0;

        while ((match = PARTIAL_VIEW_CALL_WITH_MODEL_REGEX.exec(text)) !== null) {
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
                    link.tooltip = `Navigate to ${actionName}.cshtml (PartialView with model)`;
                    links.push(link);
                }
            }
        }
    }

    private processViewCallsWithFullPath(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        VIEW_CALL_WITH_FULL_PATH_REGEX.lastIndex = 0;

        while ((match = VIEW_CALL_WITH_FULL_PATH_REGEX.exec(text)) !== null) {
            const viewType = match[1]; // "View" or "PartialView"
            const fullPath = match[2]; // The full path like "~/Areas/MyArea/Views/MyController/_MyPartial.cshtml"
            
            // Find the exact position of the quoted path
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const pathWithQuotes = `${quoteChar}${fullPath}${quoteChar}`;
            const pathStartInMatch = fullMatch.indexOf(pathWithQuotes);
            
            if (pathStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + pathStartInMatch);
                const endPos = document.positionAt(match.index + pathStartInMatch + pathWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const resolvedPath = this.resolveFullViewPath(document.uri, fullPath);
                
                if (resolvedPath) {
                    const link = new vscode.DocumentLink(range, vscode.Uri.file(resolvedPath));
                    link.tooltip = `Navigate to ${path.basename(fullPath)} (${viewType} with full path)`;
                    links.push(link);
                }
            }
        }
    }

    private processViewCallsWithFullPathAndParams(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        VIEW_CALL_WITH_FULL_PATH_AND_PARAMS_REGEX.lastIndex = 0;

        while ((match = VIEW_CALL_WITH_FULL_PATH_AND_PARAMS_REGEX.exec(text)) !== null) {
            const viewType = match[1]; // "View" or "PartialView"
            const fullPath = match[2]; // The full path like "~/Areas/MyArea/Views/MyController/_MyPartial.cshtml"
            
            // Find the exact position of the quoted path
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const pathWithQuotes = `${quoteChar}${fullPath}${quoteChar}`;
            const pathStartInMatch = fullMatch.indexOf(pathWithQuotes);
            
            if (pathStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + pathStartInMatch);
                const endPos = document.positionAt(match.index + pathStartInMatch + pathWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const resolvedPath = this.resolveFullViewPath(document.uri, fullPath);
                
                if (resolvedPath) {
                    const link = new vscode.DocumentLink(range, vscode.Uri.file(resolvedPath));
                    link.tooltip = `Navigate to ${path.basename(fullPath)} (${viewType} with full path and parameters)`;
                    links.push(link);
                }
            }
        }
    }

    private processRedirectToActionWithAction(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        REDIRECT_TO_ACTION_WITH_ACTION_REGEX.lastIndex = 0;

        while ((match = REDIRECT_TO_ACTION_WITH_ACTION_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethod(document.uri, actionName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }

            // const actionName = match[1];
            // const startPos = document.positionAt(match.index + match[0].indexOf(match[1]) - 1); // Include the quote
            // const endPos = document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length + 1); // Include the quote
            
            // const range = new vscode.Range(startPos, endPos);
            // const actionPath = this.findActionMethod(document.uri, actionName);
            
            // if (actionPath) {
            //     const link = new vscode.DocumentLink(range, vscode.Uri.file(actionPath.filePath));
            //     link.tooltip = `Navigate to ${actionName} action method`;
            //     links.push(link);
            // }
        }
    }

    private processRedirectToActionWithActionAndController(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        REDIRECT_TO_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;

        while ((match = REDIRECT_TO_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Create link for action name
            const actionStartPos = document.positionAt(match.index + match[0].indexOf(match[1]) - 1);
            const actionEndPos = document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length + 1);
            const actionRange = new vscode.Range(actionStartPos, actionEndPos);
            
            const actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
            if (actionPath) {
                // Create command URI for precise action navigation
                const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                const actionLink = new vscode.DocumentLink(actionRange, commandUri);
                actionLink.tooltip = `Navigate to ${actionName} action in ${controllerName}Controller (line ${actionPath.lineNumber || '?'})`;
                links.push(actionLink);
            }
            
            // Create link for controller name
            const controllerStartPos = document.positionAt(match.index + match[0].lastIndexOf(match[2]) - 1);
            const controllerEndPos = document.positionAt(match.index + match[0].lastIndexOf(match[2]) + match[2].length + 1);
            const controllerRange = new vscode.Range(controllerStartPos, controllerEndPos);
            
            const controllerPath = this.findControllerFile(document.uri, controllerName);
            if (controllerPath) {
                // Create command URI for controller navigation
                const controllerCommandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToController?${encodeURIComponent(JSON.stringify([controllerPath]))}`);
                const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                controllerLink.tooltip = `Navigate to ${controllerName}Controller class`;
                links.push(controllerLink);
            }
        }
    }

    private processRedirectToActionWithParams(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        REDIRECT_TO_ACTION_WITH_PARAMS_REGEX.lastIndex = 0;

        while ((match = REDIRECT_TO_ACTION_WITH_PARAMS_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Create link for action name
            const actionStartPos = document.positionAt(match.index + match[0].indexOf(match[1]) - 1);
            const actionEndPos = document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length + 1);
            const actionRange = new vscode.Range(actionStartPos, actionEndPos);
            
            const actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
            if (actionPath) {
                // Create command URI for precise action navigation
                const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                const actionLink = new vscode.DocumentLink(actionRange, commandUri);
                actionLink.tooltip = `Navigate to ${actionName} action in ${controllerName}Controller (line ${actionPath.lineNumber || '?'})`;
                links.push(actionLink);
            }
            
            // Create link for controller name
            const controllerStartPos = document.positionAt(match.index + match[0].lastIndexOf(match[2]) - 1);
            const controllerEndPos = document.positionAt(match.index + match[0].lastIndexOf(match[2]) + match[2].length + 1);
            const controllerRange = new vscode.Range(controllerStartPos, controllerEndPos);
            
            const controllerPath = this.findControllerFile(document.uri, controllerName);
            if (controllerPath) {
                // Create command URI for controller navigation
                const controllerCommandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToController?${encodeURIComponent(JSON.stringify([controllerPath]))}`);
                const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                controllerLink.tooltip = `Navigate to ${controllerName}Controller class`;
                links.push(controllerLink);
            }
        }
    }

    private processRedirectToActionWithAnonymousObject(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        REDIRECT_TO_ACTION_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;

        while ((match = REDIRECT_TO_ACTION_ANONYMOUS_OBJECT_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethod(document.uri, actionName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }

            // const actionName = match[1];
            // const startPos = document.positionAt(match.index + match[0].indexOf(match[1]) - 1); // Include the quote
            // const endPos = document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length + 1); // Include the quote
            
            // const range = new vscode.Range(startPos, endPos);
            // const actionPath = this.findActionMethod(document.uri, actionName);
            
            // if (actionPath) {
            //     const link = new vscode.DocumentLink(range, vscode.Uri.file(actionPath.filePath));
            //     link.tooltip = `Navigate to ${actionName} action method`;
            //     links.push(link);
            // }
        }
    }

    private processUrlActionWithAction(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        URL_ACTION_WITH_ACTION_REGEX.lastIndex = 0;

        while ((match = URL_ACTION_WITH_ACTION_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodFromView(document.uri, actionName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    private processUrlActionWithActionAndController(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        URL_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;

        while ((match = URL_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action in ${controllerName}Controller (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
            // Also underline the controller name
            const controllerNameWithQuotes = `${quoteChar}${controllerName}${quoteChar}`;
            const controllerStartInMatch = fullMatch.indexOf(controllerNameWithQuotes);
            if (controllerStartInMatch !== -1) {
                const controllerStartPos = document.positionAt(match.index + controllerStartInMatch);
                const controllerEndPos = document.positionAt(match.index + controllerStartInMatch + controllerNameWithQuotes.length);
                const controllerRange = new vscode.Range(controllerStartPos, controllerEndPos);
                const controllerPath = this.findControllerFile(document.uri, controllerName);
                if (controllerPath) {
                    const classLine = this.findControllerClassLine(controllerPath, controllerName);
                    if (classLine) {
                        const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([controllerPath, classLine]))}`);
                        const controllerLink = new vscode.DocumentLink(controllerRange, commandUri);
                        controllerLink.tooltip = `Navigate to ${controllerName}Controller (class definition)`;
                        links.push(controllerLink);
                    } else {
                        // Create command URI for controller navigation
                        const controllerCommandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToController?${encodeURIComponent(JSON.stringify([controllerPath]))}`);
                        const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                        controllerLink.tooltip = `Navigate to ${controllerName}Controller class`;
                        links.push(controllerLink);
                    }
                }
            }
        }
    }

    private processUrlActionWithParams(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        URL_ACTION_WITH_PARAMS_REGEX.lastIndex = 0;

        while ((match = URL_ACTION_WITH_PARAMS_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action in ${controllerName}Controller (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
            // Also underline the controller name
            const controllerNameWithQuotes = `${quoteChar}${controllerName}${quoteChar}`;
            const controllerStartInMatch = fullMatch.indexOf(controllerNameWithQuotes);
            if (controllerStartInMatch !== -1) {
                const controllerStartPos = document.positionAt(match.index + controllerStartInMatch);
                const controllerEndPos = document.positionAt(match.index + controllerStartInMatch + controllerNameWithQuotes.length);
                const controllerRange = new vscode.Range(controllerStartPos, controllerEndPos);
                const controllerPath = this.findControllerFile(document.uri, controllerName);
                if (controllerPath) {
                    const classLine = this.findControllerClassLine(controllerPath, controllerName);
                    if (classLine) {
                        const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([controllerPath, classLine]))}`);
                        const controllerLink = new vscode.DocumentLink(controllerRange, commandUri);
                        controllerLink.tooltip = `Navigate to ${controllerName}Controller (class definition)`;
                        links.push(controllerLink);
                    } else {
                        // Create command URI for controller navigation
                        const controllerCommandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToController?${encodeURIComponent(JSON.stringify([controllerPath]))}`);
                        const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                        controllerLink.tooltip = `Navigate to ${controllerName}Controller class`;
                        links.push(controllerLink);
                    }
                }
            }
        }
    }

    private processUrlActionWithAnonymousObject(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        URL_ACTION_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;

        while ((match = URL_ACTION_ANONYMOUS_OBJECT_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodFromView(document.uri, actionName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    // @Html.ActionLink processing methods
    private processHtmlActionLinkWithAction(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        HTML_ACTION_LINK_WITH_ACTION_REGEX.lastIndex = 0;

        while ((match = HTML_ACTION_LINK_WITH_ACTION_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            
            // Find the exact position of the quoted action name (second parameter)
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            
            // Find the second quoted string (action name)
            const firstQuoteIndex = fullMatch.indexOf(quoteChar);
            const firstQuoteEndIndex = fullMatch.indexOf(quoteChar, firstQuoteIndex + 1);
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes, firstQuoteEndIndex + 1);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodFromView(document.uri, actionName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    private processHtmlActionLinkWithActionAndController(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        HTML_ACTION_LINK_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;

        while ((match = HTML_ACTION_LINK_WITH_ACTION_AND_CONTROLLER_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Find the exact position of the quoted action name (second parameter)
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            
            // Find the second quoted string (action name)
            const firstQuoteIndex = fullMatch.indexOf(quoteChar);
            const firstQuoteEndIndex = fullMatch.indexOf(quoteChar, firstQuoteIndex + 1);
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes, firstQuoteEndIndex + 1);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action in ${controllerName}Controller (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
            
            // Also underline the controller name (third parameter)
            const controllerNameWithQuotes = `${quoteChar}${controllerName}${quoteChar}`;
            const controllerStartInMatch = fullMatch.indexOf(controllerNameWithQuotes, actionStartInMatch + actionNameWithQuotes.length);
            
            if (controllerStartInMatch !== -1) {
                const controllerStartPos = document.positionAt(match.index + controllerStartInMatch);
                const controllerEndPos = document.positionAt(match.index + controllerStartInMatch + controllerNameWithQuotes.length);
                
                const controllerRange = new vscode.Range(controllerStartPos, controllerEndPos);
                const controllerPath = this.findControllerFile(document.uri, controllerName);
                
                if (controllerPath) {
                    // Create command URI for controller navigation
                    const controllerCommandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToController?${encodeURIComponent(JSON.stringify([controllerPath]))}`);
                    const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                    controllerLink.tooltip = `Navigate to ${controllerName}Controller class`;
                    links.push(controllerLink);
                }
            }
        }
    }

    private processHtmlActionLinkWithParams(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        HTML_ACTION_LINK_WITH_PARAMS_REGEX.lastIndex = 0;

        while ((match = HTML_ACTION_LINK_WITH_PARAMS_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Find the exact position of the quoted action name (second parameter)
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            
            // Find the second quoted string (action name)
            const firstQuoteIndex = fullMatch.indexOf(quoteChar);
            const firstQuoteEndIndex = fullMatch.indexOf(quoteChar, firstQuoteIndex + 1);
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes, firstQuoteEndIndex + 1);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action in ${controllerName}Controller (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
            
            // Also underline the controller name (third parameter)
            const controllerNameWithQuotes = `${quoteChar}${controllerName}${quoteChar}`;
            const controllerStartInMatch = fullMatch.indexOf(controllerNameWithQuotes, actionStartInMatch + actionNameWithQuotes.length);
            
            if (controllerStartInMatch !== -1) {
                const controllerStartPos = document.positionAt(match.index + controllerStartInMatch);
                const controllerEndPos = document.positionAt(match.index + controllerStartInMatch + controllerNameWithQuotes.length);
                
                const controllerRange = new vscode.Range(controllerStartPos, controllerEndPos);
                const controllerPath = this.findControllerFile(document.uri, controllerName);
                
                if (controllerPath) {
                    // Create command URI for controller navigation
                    const controllerCommandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToController?${encodeURIComponent(JSON.stringify([controllerPath]))}`);
                    const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                    controllerLink.tooltip = `Navigate to ${controllerName}Controller class`;
                    links.push(controllerLink);
                }
            }
        }
    }

    private processHtmlActionLinkWithAnonymousObject(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        HTML_ACTION_LINK_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;

        while ((match = HTML_ACTION_LINK_ANONYMOUS_OBJECT_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            
            // Find the exact position of the quoted action name (second parameter)
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            
            // Find the second quoted string (action name)
            const firstQuoteIndex = fullMatch.indexOf(quoteChar);
            const firstQuoteEndIndex = fullMatch.indexOf(quoteChar, firstQuoteIndex + 1);
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes, firstQuoteEndIndex + 1);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodFromView(document.uri, actionName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    // @Html.BeginForm processing methods
    private processHtmlBeginFormWithAction(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        HTML_BEGIN_FORM_WITH_ACTION_REGEX.lastIndex = 0;

        while ((match = HTML_BEGIN_FORM_WITH_ACTION_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodFromView(document.uri, actionName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    private processHtmlBeginFormWithActionAndController(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;

        while ((match = HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action in ${controllerName}Controller (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
            
            // Also underline the controller name
            const controllerNameWithQuotes = `${quoteChar}${controllerName}${quoteChar}`;
            const controllerStartInMatch = fullMatch.indexOf(controllerNameWithQuotes, actionStartInMatch + actionNameWithQuotes.length);
            
            if (controllerStartInMatch !== -1) {
                const controllerStartPos = document.positionAt(match.index + controllerStartInMatch);
                const controllerEndPos = document.positionAt(match.index + controllerStartInMatch + controllerNameWithQuotes.length);
                
                const controllerRange = new vscode.Range(controllerStartPos, controllerEndPos);
                const controllerPath = this.findControllerFile(document.uri, controllerName);
                
                if (controllerPath) {
                    // Create command URI for controller navigation
                    const controllerCommandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToController?${encodeURIComponent(JSON.stringify([controllerPath]))}`);
                    const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                    controllerLink.tooltip = `Navigate to ${controllerName}Controller class`;
                    links.push(controllerLink);
                }
            }
        }
    }

    private processHtmlBeginFormWithParams(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        HTML_BEGIN_FORM_WITH_PARAMS_REGEX.lastIndex = 0;

        while ((match = HTML_BEGIN_FORM_WITH_PARAMS_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action in ${controllerName}Controller (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
            
            // Also underline the controller name
            const controllerNameWithQuotes = `${quoteChar}${controllerName}${quoteChar}`;
            const controllerStartInMatch = fullMatch.indexOf(controllerNameWithQuotes, actionStartInMatch + actionNameWithQuotes.length);
            
            if (controllerStartInMatch !== -1) {
                const controllerStartPos = document.positionAt(match.index + controllerStartInMatch);
                const controllerEndPos = document.positionAt(match.index + controllerStartInMatch + controllerNameWithQuotes.length);
                
                const controllerRange = new vscode.Range(controllerStartPos, controllerEndPos);
                const controllerPath = this.findControllerFile(document.uri, controllerName);
                
                if (controllerPath) {
                    // Create command URI for controller navigation
                    const controllerCommandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToController?${encodeURIComponent(JSON.stringify([controllerPath]))}`);
                    const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                    controllerLink.tooltip = `Navigate to ${controllerName}Controller class`;
                    links.push(controllerLink);
                }
            }
        }
    }

    private processHtmlBeginFormWithAnonymousObject(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        HTML_BEGIN_FORM_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;

        while ((match = HTML_BEGIN_FORM_ANONYMOUS_OBJECT_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodFromView(document.uri, actionName);
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([actionPath.filePath, actionPath.lineNumber]))}`);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
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

    private findActionMethod(controllerUri: vscode.Uri, actionName: string): { filePath: string; lineNumber?: number } | null {
        // For RedirectToAction with just action name, search in the same controller
        const currentControllerPath = controllerUri.fsPath;
        const actionLocation = this.searchActionInFile(currentControllerPath, actionName);
        
        if (actionLocation) {
            return actionLocation;
        }
        
        return null;
    }

    private findActionMethodFromView(viewUri: vscode.Uri, actionName: string): { filePath: string; lineNumber?: number } | null {
        // Extract controller name from view path
        // e.g., "Views/Home/Index.cshtml" -> "Home"
        const viewPath = viewUri.fsPath;
        const controllerName = this.extractControllerNameFromViewPath(viewPath);
        
        if (controllerName) {
            // Find the controller file and search for the action
            return this.findActionMethodInController(viewUri, actionName, controllerName);
        }
        
        return null;
    }

    private extractControllerNameFromViewPath(viewPath: string): string | null {
        // Handle paths like:
        // - "/Views/Home/Index.cshtml" -> "Home"
        // - "/Areas/Admin/Views/Users/Index.cshtml" -> "Users"
        // - "/Project1/Views/Home/About.cshtml" -> "Home"
        
        const normalizedPath = viewPath.replace(/\\/g, '/');
        
        // Check for Areas pattern first
        const areasMatch = normalizedPath.match(/\/Areas\/[^\/]+\/Views\/([^\/]+)\//);
        if (areasMatch) {
            return areasMatch[1];
        }
        
        // Check for standard Views pattern
        const viewsMatch = normalizedPath.match(/\/Views\/([^\/]+)\//);
        if (viewsMatch) {
            return viewsMatch[1];
        }
        
        return null;
    }

    private findActionMethodInController(currentControllerUri: vscode.Uri, actionName: string, controllerName: string): { filePath: string; lineNumber?: number } | null {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentControllerUri);
        if (!workspaceFolder) {
            return null;
        }

        // Find the target controller file
        const targetControllerPath = this.findControllerFile(currentControllerUri, controllerName);
        if (!targetControllerPath) {
            return null;
        }

        // Search for the action method in the target controller
        return this.searchActionInFile(targetControllerPath, actionName);
    }

    private findControllerFile(currentControllerUri: vscode.Uri, controllerName: string): string | null {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentControllerUri);
        if (!workspaceFolder) {
            return null;
        }

        // Find potential MVC project roots
        const projectRoots = this.findMvcProjectRoots(workspaceFolder.uri.fsPath, currentControllerUri.fsPath);
        
        for (const projectRoot of projectRoots) {
            const controllerPath = this.searchControllerInProject(projectRoot, controllerName);
            if (controllerPath) {
                return controllerPath;
            }
        }

        return null;
    }

    private searchControllerInProject(projectRoot: string, controllerName: string): string | null {
        const possibleControllerPaths: string[] = [
            // Standard MVC structure
            path.join(projectRoot, 'Controllers', `${controllerName}Controller.cs`),
            
            // Areas structure
            path.join(projectRoot, 'Areas', '*', 'Controllers', `${controllerName}Controller.cs`),
            
            // Different project structures
            path.join(projectRoot, 'src', 'Controllers', `${controllerName}Controller.cs`),
            path.join(projectRoot, 'Web', 'Controllers', `${controllerName}Controller.cs`),
        ];

        // Check each possible path
        for (const controllerPath of possibleControllerPaths) {
            if (controllerPath.includes('*')) {
                // Handle Areas wildcard
                const result = this.searchControllerInAreas(controllerPath, projectRoot, controllerName);
                if (result) {
                    return result;
                }
            } else if (fs.existsSync(controllerPath)) {
                return controllerPath;
            }
        }

        return null;
    }

    private searchControllerInAreas(controllerPathPattern: string, projectRoot: string, controllerName: string): string | null {
        try {
            const areasPath = path.join(projectRoot, 'Areas');
            if (fs.existsSync(areasPath)) {
                const areas = fs.readdirSync(areasPath, { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => dirent.name);
                
                for (const area of areas) {
                    const areaControllerPath = path.join(areasPath, area, 'Controllers', `${controllerName}Controller.cs`);
                    if (fs.existsSync(areaControllerPath)) {
                        return areaControllerPath;
                    }
                }
            }
        } catch (error) {
            // Continue to next path
        }
        return null;
    }

    private searchActionInFile(filePath: string, actionName: string): { filePath: string; lineNumber?: number } | null {
        try {
            if (!fs.existsSync(filePath)) {
                return null;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Look for action method declarations
            // Pattern matches: public/private/protected IActionResult/ActionResult MethodName(
            const actionRegex = new RegExp(
                `(?:public|private|protected|internal)?\\s*(?:async\\s+)?(?:Task<)?(?:IActionResult|ActionResult|IActionResult<[^>]+>|ActionResult<[^>]+>)>?\\s+${actionName}\\s*\\([^)]*\\)`,
                'i'
            );
            
            for (let i = 0; i < lines.length; i++) {
                if (actionRegex.test(lines[i])) {
                    return {
                        filePath: filePath,
                        lineNumber: i + 1 // 1-based line numbers
                    };
                }
            }
        } catch (error) {
            // Continue searching
        }
        
        return null;
    }

    private resolveFullViewPath(controllerUri: vscode.Uri, fullPath: string): string | null {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(controllerUri);
        if (!workspaceFolder) {
            return null;
        }

        // Convert ASP.NET virtual path to file system path
        // Examples:
        // ~/Areas/MyArea/Views/MyController/_MyPartial.cshtml
        // ~/Views/Shared/_Layout.cshtml
        // ~/Views/Home/Index.cshtml
        
        let relativePath = fullPath;
        
        // Remove the leading ~/ if present
        if (relativePath.startsWith('~/')) {
            relativePath = relativePath.substring(2);
        }
        
        // Find potential MVC project roots
        const projectRoots = this.findMvcProjectRoots(workspaceFolder.uri.fsPath, controllerUri.fsPath);
        
        for (const projectRoot of projectRoots) {
            // Try the path directly under the project root
            const fullFilePath = path.join(projectRoot, relativePath);
            if (fs.existsSync(fullFilePath)) {
                return fullFilePath;
            }
            
            // Also try with different path separators (handle both / and \)
            const normalizedPath = relativePath.replace(/\//g, path.sep);
            const normalizedFullPath = path.join(projectRoot, normalizedPath);
            if (fs.existsSync(normalizedFullPath)) {
                return normalizedFullPath;
            }
        }
        
        return null;
    }

    private findControllerClassLine(filePath: string, controllerName: string): number | undefined {
        try {
            if (!fs.existsSync(filePath)) {
                return undefined;
            }
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const classRegex = new RegExp(`class\\s+${controllerName}Controller\\b`);
            for (let i = 0; i < lines.length; i++) {
                if (classRegex.test(lines[i])) {
                    return i + 1; // 1-based line number
                }
            }
        } catch (error) {}
        return undefined;
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

    // Register custom command for action navigation with line positioning
    const disposableActionCommand = vscode.commands.registerCommand('vscode-mvcnavigator.navigateToAction', async (filePath: string, lineNumber?: number) => {
        try {
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
    const disposableControllerCommand = vscode.commands.registerCommand('vscode-mvcnavigator.navigateToController', async (filePath: string) => {
        try {
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

    context.subscriptions.push(disposableLinkProvider, disposableRazorLinkProvider, disposableCommand, disposableActionCommand, disposableControllerCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
