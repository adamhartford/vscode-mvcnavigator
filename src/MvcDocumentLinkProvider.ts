import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as RegexPatterns from './regexPatterns';

export class MvcDocumentLinkProvider implements vscode.DocumentLinkProvider, vscode.Disposable {
    public pendingNavigations = new Map<string, { type: string; path: string; lineNumber?: number }>();
    private debounceTimers = new Map<string, NodeJS.Timeout>();
    private cachedLinks = new Map<string, { links: vscode.DocumentLink[]; version: number }>();
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    
    constructor() {
        const config = vscode.workspace.getConfiguration('mvcNavigator');
        const enableFileWatcher = config.get<boolean>('enableFileWatcher', true);
        const enableCaching = config.get<boolean>('enableCaching', true);
        
        if (enableCaching && enableFileWatcher) {
            this.setupFileWatcher();
        }
        
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('mvcNavigator.enableFileWatcher')) {
                const newConfig = vscode.workspace.getConfiguration('mvcNavigator');
                const newEnableFileWatcher = newConfig.get<boolean>('enableFileWatcher', false);
                
                if (newEnableFileWatcher && !this.fileWatcher) {
                    this.debugLog('File watcher enabled via configuration change');
                    this.setupFileWatcher();
                } else if (!newEnableFileWatcher && this.fileWatcher) {
                    this.debugLog('File watcher disabled via configuration change');
                    this.fileWatcher.dispose();
                    this.fileWatcher = undefined;
                }
            }
            
            if (event.affectsConfiguration('mvcNavigator.enableCaching')) {
                const newConfig = vscode.workspace.getConfiguration('mvcNavigator');
                const newEnableCaching = newConfig.get<boolean>('enableCaching', true);
                
                if (!newEnableCaching) {
                    this.debugLog('Caching disabled via configuration change - clearing existing cache');
                    this.cachedLinks.clear();

                    if (enableFileWatcher && this.fileWatcher) {
                        this.debugLog('File watcher disabled because caching is disabled');
                        this.fileWatcher.dispose();
                        this.fileWatcher = undefined;
                    }
                } else {
                    this.debugLog('Caching enabled via configuration change');
                }
            }
        });
    }
    
    private getDebugLoggingEnabled(): boolean {
        const config = vscode.workspace.getConfiguration('mvcNavigator');
        return config.get<boolean>('enableDebugLogging', false);
    }
    
    private getCachingEnabled(): boolean {
        const config = vscode.workspace.getConfiguration('mvcNavigator');
        return config.get<boolean>('enableCaching', true);
    }
    
    public clearCache(): void {
        this.cachedLinks.clear();
        this.debugLog('Navigation cache cleared manually');
        
        if (!this.getCachingEnabled()) {
            this.debugLog('Note: Caching is currently disabled in settings');
        }
    }
    
    private setupFileWatcher(): void {
        // Watch for all C# files that might be controllers and all view files
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(
            '**/*.{cs,cshtml,razor}', // Watch all C# and view files
            false, // Don't ignore creates
            false, // Don't ignore changes  
            false  // Don't ignore deletes
        );
        
        // Add throttling to prevent excessive events during builds
        let throttleTimer: NodeJS.Timeout | undefined;
        const throttledHandler = (uri: vscode.Uri) => {
            if (throttleTimer) {
                clearTimeout(throttleTimer);
            }
            throttleTimer = setTimeout(() => {
                this.onFileSystemChange(uri);
            }, 500); // 500ms throttle
        };
        
        // Invalidate caches when MVC files change
        this.fileWatcher.onDidCreate(throttledHandler);
        this.fileWatcher.onDidChange(throttledHandler);
        this.fileWatcher.onDidDelete(throttledHandler);
        
        // Also watch for workspace configuration changes
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.debugLog('Workspace folders changed - clearing all caches');
            this.cachedLinks.clear();
            this.debounceTimers.clear();
        });
        
        this.debugLog('File system watcher enabled for all C# and view files');
    }
    
    private onFileSystemChange(uri: vscode.Uri): void {
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        
        // Check if this is an MVC-related file
        const isMvcFile = this.isMvcRelatedFile(filePath, fileName);
        
        if (isMvcFile) {
            this.debugLog(`File system change detected: ${filePath} - invalidating relevant caches`);
            this.cachedLinks.clear();
            this.clearDebounceTimers();
        }
    }
    
    private isMvcRelatedFile(filePath: string, fileName: string): boolean {
        const lowerPath = filePath.toLowerCase();
        const lowerName = fileName.toLowerCase();

        return lowerName.endsWith('.cshtml') || 
            lowerName.endsWith('.razor') ||
            (lowerName.endsWith('.cs') && (
                lowerPath.includes('controller') || 
                lowerPath.includes('/controllers/') ||
                lowerPath.includes('\\controllers\\')
            ));
    }

    private clearDebounceTimers(): void {
        this.debounceTimers.clear();
    }
    
    public dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.debugLog('File system watcher disposed');
        }
        
        // Clean up timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
        
        // Clear caches to free memory
        this.cachedLinks.clear();
        this.pendingNavigations.clear();
    }
    
    private debugLog(message: string): void {
        if (this.getDebugLoggingEnabled()) {
            console.log(`[MVC Navigator] ${message}`);
        }
    }
    
    // Helper method to create action command URIs with proper parameter handling
    private createActionCommandUri(filePath: string, lineNumber?: number): vscode.Uri {
        const linkId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.pendingNavigations.set(linkId, { 
            type: 'action', 
            path: filePath, 
            lineNumber: lineNumber 
        });
        return vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToAction?${encodeURIComponent(JSON.stringify([linkId]))}`);
    }
    
    // Helper method to create controller command URIs with proper parameter handling
    private createControllerCommandUri(filePath: string): vscode.Uri {
        const linkId = `controller_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.pendingNavigations.set(linkId, { 
            type: 'controller', 
            path: filePath 
        });
        return vscode.Uri.parse(`command:vscode-mvcnavigator.navigateToController?${encodeURIComponent(JSON.stringify([linkId]))}`);
    }
    
    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
        const cachingEnabled = this.getCachingEnabled();
        const documentKey = `${document.uri.toString()}-${document.version}`;
        
        // Debounce rapid document changes
        const debounceKey = document.uri.toString();
        if (this.debounceTimers.has(debounceKey)) {
            clearTimeout(this.debounceTimers.get(debounceKey)!);
        }
        
        // Check cache first (only if caching is enabled)
        if (cachingEnabled) {
            const cached = this.cachedLinks.get(documentKey);
            if (cached && cached.version === document.version) {
                this.debugLog(`Using cached links for ${document.fileName} (${cached.links.length} links)`);
                return cached.links;
            }
        }
        
        const links: vscode.DocumentLink[] = [];
        
        // Process C# files for controller-based navigation
        if (document.languageId === 'csharp') {
            this.processCSharptNavigations(document, links);
        }
        
        // Process Razor/HTML files for @Url.Action navigation
        if (document.languageId === 'razor' || document.languageId === 'html' || 
            document.languageId === 'aspnetcorerazor' ||
            document.fileName.endsWith('.cshtml') || document.fileName.endsWith('.razor')) {
            
            this.debugLog(`Processing file: ${document.fileName}, languageId: ${document.languageId}`);
            
            this.processRazorNavigations(document, links);
            this.processTagHelperNavigations(document, links);
            
            this.debugLog(`Found ${links.length} links in ${document.fileName}`);
        }

        // Cache the results (only if caching is enabled)
        if (cachingEnabled) {
            this.cachedLinks.set(documentKey, { links, version: document.version });
            
            // Clean up old cache entries (keep only last 50)
            if (this.cachedLinks.size > 50) {
                const entries = Array.from(this.cachedLinks.entries());
                const toDelete = entries.slice(0, entries.length - 50);
                toDelete.forEach(([key]) => this.cachedLinks.delete(key));
            }
        }
        
        // Clean up old debounce timers (keep only last 20)
        if (this.debounceTimers.size > 20) {
            const entries = Array.from(this.debounceTimers.entries());
            const toDelete = entries.slice(0, entries.length - 20);
            toDelete.forEach(([key]) => {
                clearTimeout(this.debounceTimers.get(key)!);
                this.debounceTimers.delete(key);
            });
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

        // Handle RedirectToAction with area in route values (FIRST - most specific)
        this.processRedirectToActionWithArea(document, text, links);
        this.processRedirectToActionWithAreaTwoParam(document, text, links);

        // Handle RedirectToAction("ActionName") calls
        this.processRedirectToActionWithAction(document, text, links);

        // Handle RedirectToAction("ActionName", "ControllerName") calls
        this.processRedirectToActionWithActionAndController(document, text, links);

        // Handle RedirectToAction("ActionName", "ControllerName", routeValues) calls (excluding area patterns)
        this.processRedirectToActionWithParams(document, text, links);

        // Handle RedirectToAction("ActionName", routeValues) calls
        this.processRedirectToActionWithAnonymousObject(document, text, links);

        // Handle C# Url.Action() calls in controller code
        this.processCSharpUrlActionWithAction(document, text, links);
        this.processCSharpUrlActionWithActionAndController(document, text, links);
        this.processCSharpUrlActionWithParams(document, text, links);
        this.processCSharpUrlActionWithAnonymousObject(document, text, links);
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
        
        // Handle @Html.Partial with full paths (process specific patterns first)
        this.processHtmlPartialWithFullPathAndModel(document, text, links);
        
        // Handle @Html.Partial("~/path/to/partial.cshtml") calls
        this.processHtmlPartialWithFullPath(document, text, links);
        
        // Handle @Html.Partial("PartialName", model) calls (process specific patterns first)
        this.processHtmlPartialWithNameAndModel(document, text, links);

        // Handle @Html.Partial("PartialName") calls
        this.processHtmlPartialWithName(document, text, links);

        // Handle @await Html.PartialAsync with full paths (process specific patterns first)
        this.processHtmlPartialAsyncWithFullPathAndModel(document, text, links);
        
        // Handle @await Html.PartialAsync("~/path/to/partial.cshtml") calls
        this.processHtmlPartialAsyncWithFullPath(document, text, links);

        // Handle @await Html.PartialAsync("PartialName", model) calls (process specific patterns first)
        this.processHtmlPartialAsyncWithNameAndModel(document, text, links);

        // Handle @await Html.PartialAsync("PartialName") calls
        this.processHtmlPartialAsyncWithName(document, text, links);
    }

    private processTagHelperNavigations(document: vscode.TextDocument, links: vscode.DocumentLink[]): void {
        const text = document.getText();
        
        this.debugLog(`Processing tag helpers in ${document.fileName}`);
        this.debugLog(`Document content length: ${text.length}`);
        
        // Handle <a asp-action="..." asp-controller="..." asp-area="..."> tag helpers
        this.processAnchorTagHelpers(document, text, links);
        
        // Handle <form asp-action="..." asp-controller="..." asp-area="..."> tag helpers
        this.processFormTagHelpers(document, text, links);
        
        // Handle <partial name="..." /> tag helpers
        this.processPartialTagHelpers(document, text, links);
        
        this.debugLog(`Tag helper processing complete for ${document.fileName}`);
    }

    private processViewCallsWithName(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.VIEW_CALL_WITH_NAME_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.VIEW_CALL_WITH_NAME_REGEX.exec(text)) !== null) {
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
        RegexPatterns.VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX.exec(text)) !== null) {
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
        RegexPatterns.VIEW_CALL_PARAMETERLESS_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.VIEW_CALL_PARAMETERLESS_REGEX.exec(text)) !== null) {
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
        RegexPatterns.PARTIAL_VIEW_CALL_WITH_NAME_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.PARTIAL_VIEW_CALL_WITH_NAME_REGEX.exec(text)) !== null) {
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
        RegexPatterns.PARTIAL_VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.PARTIAL_VIEW_CALL_WITH_NAME_AND_PARAMS_REGEX.exec(text)) !== null) {
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
        RegexPatterns.PARTIAL_VIEW_CALL_PARAMETERLESS_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.PARTIAL_VIEW_CALL_PARAMETERLESS_REGEX.exec(text)) !== null) {
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
        RegexPatterns.VIEW_CALL_WITH_MODEL_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.VIEW_CALL_WITH_MODEL_REGEX.exec(text)) !== null) {
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
        RegexPatterns.PARTIAL_VIEW_CALL_WITH_MODEL_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.PARTIAL_VIEW_CALL_WITH_MODEL_REGEX.exec(text)) !== null) {
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
        RegexPatterns.VIEW_CALL_WITH_FULL_PATH_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.VIEW_CALL_WITH_FULL_PATH_REGEX.exec(text)) !== null) {
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
        RegexPatterns.VIEW_CALL_WITH_FULL_PATH_AND_PARAMS_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.VIEW_CALL_WITH_FULL_PATH_AND_PARAMS_REGEX.exec(text)) !== null) {
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
        RegexPatterns.REDIRECT_TO_ACTION_WITH_ACTION_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.REDIRECT_TO_ACTION_WITH_ACTION_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    
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
        RegexPatterns.REDIRECT_TO_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.REDIRECT_TO_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Create link for action name
            const actionStartPos = document.positionAt(match.index + match[0].indexOf(match[1]) - 1);
            const actionEndPos = document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length + 1);
            const actionRange = new vscode.Range(actionStartPos, actionEndPos);
            
            const actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
            if (actionPath) {
                // Create command URI for precise action navigation
                const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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
        RegexPatterns.REDIRECT_TO_ACTION_WITH_PARAMS_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.REDIRECT_TO_ACTION_WITH_PARAMS_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Create link for action name
            const actionStartPos = document.positionAt(match.index + match[0].indexOf(match[1]) - 1);
            const actionEndPos = document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length + 1);
            const actionRange = new vscode.Range(actionStartPos, actionEndPos);
            
            const actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
            if (actionPath) {
                // Create command URI for precise action navigation
                const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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
        RegexPatterns.REDIRECT_TO_ACTION_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.REDIRECT_TO_ACTION_ANONYMOUS_OBJECT_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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

    private processRedirectToActionWithArea(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.REDIRECT_TO_ACTION_WITH_AREA_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.REDIRECT_TO_ACTION_WITH_AREA_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            const areaName = match[3];
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            let quoteChar = fullMatch.includes('"') ? '"' : "'";
            let actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            let actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodInControllerWithArea(document.uri, actionName, controllerName, areaName);
                
                if (actionPath) {
                    // Create command URI for precise navigation to action
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method in ${controllerName}Controller (Area: ${areaName}, line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
            
            // Also handle controller name navigation
            quoteChar = fullMatch.includes('"') ? '"' : "'";
            const controllerNameWithQuotes = `${quoteChar}${controllerName}${quoteChar}`;
            const controllerStartInMatch = fullMatch.lastIndexOf(controllerNameWithQuotes);
            
            if (controllerStartInMatch !== -1) {
                const controllerStartPos = document.positionAt(match.index + controllerStartInMatch);
                const controllerEndPos = document.positionAt(match.index + controllerStartInMatch + controllerNameWithQuotes.length);
                
                const controllerRange = new vscode.Range(controllerStartPos, controllerEndPos);
                const controllerPath = this.findControllerFileInArea(document.uri, controllerName, areaName);
                
                if (controllerPath) {
                    // Create command URI for navigation to controller
                    const controllerCommandUri = this.createControllerCommandUri(controllerPath);
                    const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                    controllerLink.tooltip = `Navigate to ${controllerName}Controller class (Area: ${areaName})`;
                    links.push(controllerLink);
                }
            }
        }
    }

    private processRedirectToActionWithAreaTwoParam(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.REDIRECT_TO_ACTION_WITH_AREA_TWO_PARAM_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.REDIRECT_TO_ACTION_WITH_AREA_TWO_PARAM_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const areaName = match[2];
            
            // Extract controller name from current file
            const currentController = this.extractControllerNameFromPath(document.uri.fsPath);
            if (!currentController) {
                continue;
            }
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            let quoteChar = fullMatch.includes('"') ? '"' : "'";
            let actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            let actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const actionPath = this.findActionMethodInControllerWithArea(document.uri, actionName, currentController, areaName);
                
                if (actionPath) {
                    // Create command URI for precise navigation to action
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method in ${currentController}Controller (Area: ${areaName}, line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    private processUrlActionWithAction(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.URL_ACTION_WITH_ACTION_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.URL_ACTION_WITH_ACTION_REGEX.exec(text)) !== null) {
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
                    // Create command URI using helper method
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    private processUrlActionWithActionAndController(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.URL_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.URL_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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
                        const commandUri = this.createActionCommandUri(controllerPath, classLine);
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
        RegexPatterns.URL_ACTION_WITH_PARAMS_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.URL_ACTION_WITH_PARAMS_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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
                        const commandUri = this.createActionCommandUri(controllerPath, classLine);
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
        RegexPatterns.URL_ACTION_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.URL_ACTION_ANONYMOUS_OBJECT_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    // C# Url.Action processing methods (for controller code)
    private processCSharpUrlActionWithAction(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.CSHARP_URL_ACTION_WITH_ACTION_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.CSHARP_URL_ACTION_WITH_ACTION_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    private processCSharpUrlActionWithActionAndController(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.CSHARP_URL_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.CSHARP_URL_ACTION_WITH_ACTION_AND_CONTROLLER_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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
                    const controllerCommandUri = this.createControllerCommandUri(controllerPath);
                    const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                    controllerLink.tooltip = `Navigate to ${controllerName}Controller class`;
                    links.push(controllerLink);
                }
            }
        }
    }

    private processCSharpUrlActionWithParams(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.CSHARP_URL_ACTION_WITH_PARAMS_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.CSHARP_URL_ACTION_WITH_PARAMS_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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
                    const controllerCommandUri = this.createControllerCommandUri(controllerPath);
                    const controllerLink = new vscode.DocumentLink(controllerRange, controllerCommandUri);
                    controllerLink.tooltip = `Navigate to ${controllerName}Controller class`;
                    links.push(controllerLink);
                }
            }
        }
    }

    private processCSharpUrlActionWithAnonymousObject(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.CSHARP_URL_ACTION_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.CSHARP_URL_ACTION_ANONYMOUS_OBJECT_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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
        RegexPatterns.HTML_ACTION_LINK_WITH_ACTION_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_ACTION_LINK_WITH_ACTION_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    private processHtmlActionLinkWithActionAndController(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.HTML_ACTION_LINK_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_ACTION_LINK_WITH_ACTION_AND_CONTROLLER_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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
        RegexPatterns.HTML_ACTION_LINK_WITH_PARAMS_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_ACTION_LINK_WITH_PARAMS_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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
        RegexPatterns.HTML_ACTION_LINK_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_ACTION_LINK_ANONYMOUS_OBJECT_REGEX.exec(text)) !== null) {
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
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
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
        RegexPatterns.HTML_BEGIN_FORM_WITH_ACTION_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_BEGIN_FORM_WITH_ACTION_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            
            // Extract HTTP method from the full Html.BeginForm call
            const httpMethod = this.extractHttpMethodFromForm(match[0]);
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                
                // Try to find action with specific HTTP method first
                let actionPath = this.findActionMethodFromViewWithHttpMethod(document.uri, actionName, httpMethod);
                
                // Fallback to regular search if no HTTP-specific action found
                if (!actionPath) {
                    actionPath = this.findActionMethodFromView(document.uri, actionName);
                }
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (${httpMethod}) (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    private processHtmlBeginFormWithActionAndController(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_BEGIN_FORM_WITH_ACTION_AND_CONTROLLER_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Extract HTTP method from the full Html.BeginForm call
            const httpMethod = this.extractHttpMethodFromForm(match[0]);
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                
                // Try to find action with specific HTTP method first
                let actionPath = this.findActionMethodInControllerWithHttpMethod(document.uri, actionName, controllerName, httpMethod);
                
                // Fallback to regular search if no HTTP-specific action found
                if (!actionPath) {
                    actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
                }
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action (${httpMethod}) in ${controllerName}Controller (line ${actionPath.lineNumber || '?'})`;
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
        RegexPatterns.HTML_BEGIN_FORM_WITH_PARAMS_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_BEGIN_FORM_WITH_PARAMS_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            const controllerName = match[2];
            
            // Extract HTTP method from the full Html.BeginForm call
            const httpMethod = this.extractHttpMethodFromForm(match[0]);
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                
                // Try to find action with specific HTTP method first
                let actionPath = this.findActionMethodInControllerWithHttpMethod(document.uri, actionName, controllerName, httpMethod);
                
                // Fallback to regular search if no HTTP-specific action found
                if (!actionPath) {
                    actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
                }
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action (${httpMethod}) in ${controllerName}Controller (line ${actionPath.lineNumber || '?'})`;
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
        RegexPatterns.HTML_BEGIN_FORM_ANONYMOUS_OBJECT_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_BEGIN_FORM_ANONYMOUS_OBJECT_REGEX.exec(text)) !== null) {
            const actionName = match[1];
            
            // Extract HTTP method from the full Html.BeginForm call
            const httpMethod = this.extractHttpMethodFromForm(match[0]);
            
            // Find the exact position of the quoted action name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const actionNameWithQuotes = `${quoteChar}${actionName}${quoteChar}`;
            const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
            
            if (actionStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + actionStartInMatch);
                const endPos = document.positionAt(match.index + actionStartInMatch + actionNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                
                // Try to find action with specific HTTP method first
                let actionPath = this.findActionMethodFromViewWithHttpMethod(document.uri, actionName, httpMethod);
                
                // Fallback to regular search if no HTTP-specific action found
                if (!actionPath) {
                    actionPath = this.findActionMethodFromView(document.uri, actionName);
                }
                
                if (actionPath) {
                    // Create command URI for precise navigation
                    const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                    const link = new vscode.DocumentLink(range, commandUri);
                    link.tooltip = `Navigate to ${actionName} action method (${httpMethod}) (line ${actionPath.lineNumber || '?'})`;
                    links.push(link);
                }
            }
        }
    }

    // @Html.Partial processing methods
    private processHtmlPartialWithName(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.HTML_PARTIAL_WITH_NAME_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_PARTIAL_WITH_NAME_REGEX.exec(text)) !== null) {
            const partialViewName = match[1];
            
            // Find the exact position of the quoted partial view name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const partialNameWithQuotes = `${quoteChar}${partialViewName}${quoteChar}`;
            const partialStartInMatch = fullMatch.indexOf(partialNameWithQuotes);
            
            if (partialStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + partialStartInMatch);
                const endPos = document.positionAt(match.index + partialStartInMatch + partialNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const viewPath = this.findPartialViewFromView(document.uri, partialViewName);
                
                if (viewPath) {
                    const link = new vscode.DocumentLink(range, vscode.Uri.file(viewPath));
                    link.tooltip = `Navigate to ${partialViewName}.cshtml`;
                    links.push(link);
                }
            }
        }
    }

    private processHtmlPartialWithNameAndModel(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX.exec(text)) !== null) {
            const partialViewName = match[1];
            
            // Find the exact position of the quoted partial view name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const partialNameWithQuotes = `${quoteChar}${partialViewName}${quoteChar}`;
            const partialStartInMatch = fullMatch.indexOf(partialNameWithQuotes);
            
            if (partialStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + partialStartInMatch);
                const endPos = document.positionAt(match.index + partialStartInMatch + partialNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const viewPath = this.findPartialViewFromView(document.uri, partialViewName);
                
                if (viewPath) {
                    const link = new vscode.DocumentLink(range, vscode.Uri.file(viewPath));
                    link.tooltip = `Navigate to ${partialViewName}.cshtml`;
                    links.push(link);
                }
            }
        }
    }

    // @await Html.PartialAsync processing methods
    private processHtmlPartialAsyncWithName(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.HTML_PARTIAL_ASYNC_WITH_NAME_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_PARTIAL_ASYNC_WITH_NAME_REGEX.exec(text)) !== null) {
            const partialViewName = match[1];
            
            // Find the exact position of the quoted partial view name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const partialNameWithQuotes = `${quoteChar}${partialViewName}${quoteChar}`;
            const partialStartInMatch = fullMatch.indexOf(partialNameWithQuotes);
            
            if (partialStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + partialStartInMatch);
                const endPos = document.positionAt(match.index + partialStartInMatch + partialNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const viewPath = this.findPartialViewFromView(document.uri, partialViewName);
                
                if (viewPath) {
                    const link = new vscode.DocumentLink(range, vscode.Uri.file(viewPath));
                    link.tooltip = `Navigate to ${partialViewName}.cshtml`;
                    links.push(link);
                }
            }
        }
    }

    private processHtmlPartialAsyncWithNameAndModel(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX.exec(text)) !== null) {
            const partialViewName = match[1];
            
            // Find the exact position of the quoted partial view name
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const partialNameWithQuotes = `${quoteChar}${partialViewName}${quoteChar}`;
            const partialStartInMatch = fullMatch.indexOf(partialNameWithQuotes);
            
            if (partialStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + partialStartInMatch);
                const endPos = document.positionAt(match.index + partialStartInMatch + partialNameWithQuotes.length);
                
                const range = new vscode.Range(startPos, endPos);
                const viewPath = this.findPartialViewFromView(document.uri, partialViewName);
                
                if (viewPath) {
                    const link = new vscode.DocumentLink(range, vscode.Uri.file(viewPath));
                    link.tooltip = `Navigate to ${partialViewName}.cshtml`;
                    links.push(link);
                }
            }
        }
    }

    // @Html.Partial with full path processing methods
    private processHtmlPartialWithFullPath(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.HTML_PARTIAL_WITH_FULL_PATH_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_PARTIAL_WITH_FULL_PATH_REGEX.exec(text)) !== null) {
            const fullPath = match[1]; // The full path like "~/Areas/MyArea/Views/MyController/_MyPartial.cshtml"
            
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
                    link.tooltip = `Navigate to ${path.basename(fullPath)} (Html.Partial with full path)`;
                    links.push(link);
                }
            }
        }
    }

    private processHtmlPartialWithFullPathAndModel(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX.exec(text)) !== null) {
            const fullPath = match[1]; // The full path like "~/Areas/MyArea/Views/MyController/_MyPartial.cshtml"
            
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
                    link.tooltip = `Navigate to ${path.basename(fullPath)} (Html.Partial with full path and model)`;
                    links.push(link);
                }
            }
        }
    }

    // @await Html.PartialAsync with full path processing methods
    private processHtmlPartialAsyncWithFullPath(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX.exec(text)) !== null) {
            const fullPath = match[1]; // The full path like "~/Areas/MyArea/Views/MyController/_MyPartial.cshtml"
            
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
                    link.tooltip = `Navigate to ${path.basename(fullPath)} (Html.PartialAsync with full path)`;
                    links.push(link);
                }
            }
        }
    }

    private processHtmlPartialAsyncWithFullPathAndModel(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        let match;
        RegexPatterns.HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX.lastIndex = 0;

        while ((match = RegexPatterns.HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX.exec(text)) !== null) {
            const fullPath = match[1]; // The full path like "~/Areas/MyArea/Views/MyController/_MyPartial.cshtml"
            
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
                    link.tooltip = `Navigate to ${path.basename(fullPath)} (Html.PartialAsync with full path and model)`;
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

    private findPartialViewFromView(viewUri: vscode.Uri, partialViewName: string): string | null {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(viewUri);
        if (!workspaceFolder) {
            return null;
        }

        // Extract controller name from the view file path
        // Path structure: .../Views/{ControllerName}/{ViewName}.cshtml
        // or .../Areas/{AreaName}/Views/{ControllerName}/{ViewName}.cshtml
        const viewPath = viewUri.fsPath;
        const pathParts = viewPath.replace(/\\/g, '/').split('/');
        
        let controllerName = '';
        let areaInfo: { areaName: string; isAreaController: boolean } | null = null;
        
        // Find Views folder and extract controller name
        for (let i = pathParts.length - 1; i >= 0; i--) {
            if (pathParts[i].toLowerCase() === 'views') {
                // Check if this is an area structure
                if (i >= 2 && pathParts[i - 2].toLowerCase() === 'areas') {
                    areaInfo = {
                        areaName: pathParts[i - 1],
                        isAreaController: true
                    };
                }
                
                // Get controller name (folder after Views)
                if (i + 1 < pathParts.length) {
                    controllerName = pathParts[i + 1];
                }
                break;
            }
        }

        // Find potential MVC project roots from the view file path
        const projectRoots = this.findMvcProjectRootsFromView(workspaceFolder.uri.fsPath, viewPath);
        
        for (const projectRoot of projectRoots) {
            const viewPath = this.searchPartialViewInProject(projectRoot, controllerName, partialViewName, areaInfo);
            if (viewPath) {
                return viewPath;
            }
        }

        return null;
    }

    private findMvcProjectRootsFromView(workspaceRoot: string, viewPath: string): string[] {
        const projectRoots: string[] = [];
        
        // Start from the view's directory and walk up to find potential project roots
        let currentDir = path.dirname(viewPath);
        
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

    // Enhanced method that considers HTTP method for form-based navigation
    private findActionMethodFromViewWithHttpMethod(viewUri: vscode.Uri, actionName: string, httpMethod: string): { filePath: string; lineNumber?: number } | null {
        const viewPath = viewUri.fsPath;
        const controllerName = this.extractControllerNameFromViewPath(viewPath);
        
        if (controllerName) {
            return this.findActionMethodInControllerWithHttpMethod(viewUri, actionName, controllerName, httpMethod);
        }
        
        return null;
    }

    private findActionMethodInControllerWithHttpMethod(currentControllerUri: vscode.Uri, actionName: string, controllerName: string, httpMethod: string): { filePath: string; lineNumber?: number } | null {
        const targetControllerPath = this.findControllerFile(currentControllerUri, controllerName);
        if (!targetControllerPath) {
            return null;
        }

        return this.searchActionInFileWithHttpMethod(targetControllerPath, actionName, httpMethod);
    }

    private findActionMethodInControllerWithAreaAndHttpMethod(currentControllerUri: vscode.Uri, actionName: string, controllerName: string, areaName: string, httpMethod: string): { filePath: string; lineNumber?: number } | null {
        const targetControllerPath = this.findControllerFileInArea(currentControllerUri, controllerName, areaName);
        if (!targetControllerPath) {
            return null;
        }

        return this.searchActionInFileWithHttpMethod(targetControllerPath, actionName, httpMethod);
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

    private extractControllerNameFromPath(filePath: string): string | null {
        // Handle controller paths like:
        // - "/Controllers/HomeController.cs" -> "Home"
        // - "/Areas/Admin/Controllers/UsersController.cs" -> "Users"
        // - "/Project1/Controllers/ProductController.cs" -> "Product"
        
        const normalizedPath = filePath.replace(/\\/g, '/');
        
        // Match controller files
        const controllerMatch = normalizedPath.match(/\/Controllers\/([^\/]+)Controller\.cs$/);
        if (controllerMatch) {
            return controllerMatch[1];
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

    // Extract area information from route values in RedirectToAction calls
    private extractAreaFromRouteValues(routeValuesText: string): string | null {
        // Match patterns like: new { area = "Admin" }, new { area = "Catalog", id = 1 }, etc.
        const areaMatch = routeValuesText.match(/area\s*=\s*["']([^"']+)["']/);
        return areaMatch ? areaMatch[1] : null;
    }

    // Find controller in a specific area
    private findControllerFileInArea(currentControllerUri: vscode.Uri, controllerName: string, areaName: string): string | null {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentControllerUri);
        if (!workspaceFolder) {
            console.log('No workspace folder found');
            return null;
        }

        // Find potential MVC project roots
        const projectRoots = this.findMvcProjectRoots(workspaceFolder.uri.fsPath, currentControllerUri.fsPath);
        
        for (const projectRoot of projectRoots) {
            const areaControllerPath = path.join(projectRoot, 'Areas', areaName, 'Controllers', `${controllerName}Controller.cs`);
            if (fs.existsSync(areaControllerPath)) {
                return areaControllerPath;
            }
        }

        return null;
    }

    // Area-aware action method finder
    private findActionMethodInControllerWithArea(currentControllerUri: vscode.Uri, actionName: string, controllerName: string, areaName?: string): { filePath: string; lineNumber?: number } | null {
        let targetControllerPath: string | null = null;

        if (areaName) {
            // First try to find controller in the specific area
            targetControllerPath = this.findControllerFileInArea(currentControllerUri, controllerName, areaName);
        }

        if (!targetControllerPath) {
            // Fall back to general controller search if area-specific search fails
            targetControllerPath = this.findControllerFile(currentControllerUri, controllerName);
        }

        if (!targetControllerPath) {
            return null;
        }

        // Search for the action method in the target controller
        return this.searchActionInFile(targetControllerPath, actionName);
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

    // Enhanced method to search for actions with specific HTTP method preference
    private searchActionInFileWithHttpMethod(filePath: string, actionName: string, httpMethod: string): { filePath: string; lineNumber?: number } | null {
        try {
            if (!fs.existsSync(filePath)) {
                return null;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Look for action method declarations with HTTP method attributes
            const httpMethodRegex = new RegExp(`Http${httpMethod}`, 'i');
            const actionRegex = new RegExp(
                `(?:public|private|protected|internal)?\\s*(?:async\\s+)?(?:Task<)?(?:IActionResult|ActionResult|IActionResult<[^>]+>|ActionResult<[^>]+>)>?\\s+${actionName}\\s*\\([^)]*\\)`,
                'i'
            );
            
            let preferredActionLine = null;
            let fallbackActionLine = null;
            
            for (let i = 0; i < lines.length; i++) {
                if (actionRegex.test(lines[i])) {
                    const actionResult = {
                        filePath: filePath,
                        lineNumber: i + 1
                    };
                    
                    // Check for HTTP method attribute in previous lines (up to 5 lines before)
                    let hasHttpMethodAttribute = false;
                    for (let j = Math.max(0, i - 5); j < i; j++) {
                        if (httpMethodRegex.test(lines[j])) {
                            hasHttpMethodAttribute = true;
                            break;
                        }
                    }
                    
                    if (hasHttpMethodAttribute) {
                        preferredActionLine = actionResult;
                        break; // Found action with matching HTTP method
                    } else if (!fallbackActionLine) {
                        fallbackActionLine = actionResult;
                    }
                }
            }
            
            // Return preferred action if found, otherwise fallback
            return preferredActionLine || fallbackActionLine;
        } catch (error) {
            // Continue searching
        }
        
        return null;
    }

    // Helper method to extract HTTP method from form elements
    private extractHttpMethodFromForm(formElementText: string): string {
        // Check for explicit method attribute in tag helpers and HTML forms
        const methodMatch = formElementText.match(RegexPatterns.FORM_METHOD_REGEX);
        if (methodMatch) {
            return methodMatch[1].toUpperCase();
        }
        
        // Check for FormMethod.Post in Html.BeginForm
        if (RegexPatterns.FORM_METHOD_POST_REGEX.test(formElementText)) {
            return 'POST';
        }
        
        // Check for FormMethod.Get in Html.BeginForm
        if (RegexPatterns.FORM_METHOD_GET_REGEX.test(formElementText)) {
            return 'GET';
        }
        
        // Default assumption: if method is not specified, it's POST for forms
        return 'POST';
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

    private processAnchorTagHelpers(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        // Handle <a asp-action="ActionName" asp-controller="ControllerName" asp-area="AreaName">
        let match;
        
        this.debugLog(`Processing anchor tag helpers...`);
        
        // Reset regex state
        RegexPatterns.ANCHOR_TAG_HELPER_ACTION_REGEX.lastIndex = 0;
        
        let matchCount = 0;
        while ((match = RegexPatterns.ANCHOR_TAG_HELPER_ACTION_REGEX.exec(text)) !== null) {
            matchCount++;
            const fullMatch = match[0];
            const actionName = match[1];
            
            this.debugLog(`Found anchor tag helper ${matchCount}: action="${actionName}"`);
            this.debugLog(`Full match: ${fullMatch}`);
            
            // Extract controller and area from the same tag
            const controllerMatch = fullMatch.match(/asp-controller\s*=\s*["']([^"']+)["']/);
            const areaMatch = fullMatch.match(/asp-area\s*=\s*["']([^"']*)["']/);  // Allow empty string
            
            const controllerName = controllerMatch ? controllerMatch[1] : null;
            const areaName = areaMatch ? (areaMatch[1] || null) : null;  // Treat empty string as null
            
            this.debugLog(`Extracted - controller: ${controllerName}, area: ${areaName}`);
            
            // Create range for the action name (excluding quotes)
            const actionStart = match.index + fullMatch.indexOf(`"${actionName}"`) + 1;
            const actionEnd = actionStart + actionName.length;
            const actionRange = new vscode.Range(
                document.positionAt(actionStart),
                document.positionAt(actionEnd)
            );
            
            // Find the action file using area-aware method
            let actionPath = null;
            if (controllerName && areaName) {
                actionPath = this.findActionMethodInControllerWithArea(document.uri, actionName, controllerName, areaName);
            } else if (controllerName) {
                actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
            } else {
                // When no controller specified, use view context to find the controller
                actionPath = this.findActionMethodFromView(document.uri, actionName);
            }
            
            this.debugLog(`Action search result: ${actionPath ? 'found' : 'not found'}`);
            
            if (actionPath) {
                const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                links.push(new vscode.DocumentLink(actionRange, commandUri));
                this.debugLog(`Created link for action "${actionName}"`);
            } else {
                this.debugLog(`No action found for "${actionName}"`);
            }
            
            // If controller is specified, create link for it too
            if (controllerName) {
                const controllerStart = match.index + fullMatch.indexOf(`"${controllerName}"`) + 1;
                const controllerEnd = controllerStart + controllerName.length;
                const controllerRange = new vscode.Range(
                    document.positionAt(controllerStart),
                    document.positionAt(controllerEnd)
                );
                
                let controllerPath = null;
                if (areaName) {
                    controllerPath = this.findControllerFileInArea(document.uri, controllerName, areaName);
                } else {
                    controllerPath = this.findControllerFile(document.uri, controllerName);
                }
                
                if (controllerPath) {
                    const commandUri = this.createControllerCommandUri(controllerPath);
                    links.push(new vscode.DocumentLink(controllerRange, commandUri));
                }
            }
        }
    }

    private processFormTagHelpers(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        // Handle <form asp-action="ActionName" asp-controller="ControllerName" asp-area="AreaName">
        let match;
        
        // Reset regex state
        RegexPatterns.FORM_TAG_HELPER_ACTION_REGEX.lastIndex = 0;
        
        while ((match = RegexPatterns.FORM_TAG_HELPER_ACTION_REGEX.exec(text)) !== null) {
            const fullMatch = match[0];
            const actionName = match[1];
            
            // Extract controller and area from the same tag
            const controllerMatch = fullMatch.match(/asp-controller\s*=\s*["']([^"']+)["']/);
            const areaMatch = fullMatch.match(/asp-area\s*=\s*["']([^"']*)["']/);  // Allow empty string
            
            const controllerName = controllerMatch ? controllerMatch[1] : null;
            const areaName = areaMatch ? (areaMatch[1] || null) : null;  // Treat empty string as null
            
            // Extract HTTP method from the form tag
            const httpMethod = this.extractHttpMethodFromForm(fullMatch);
            
            // Create range for the action name (excluding quotes)
            const actionStart = match.index + fullMatch.indexOf(`"${actionName}"`) + 1;
            const actionEnd = actionStart + actionName.length;
            const actionRange = new vscode.Range(
                document.positionAt(actionStart),
                document.positionAt(actionEnd)
            );
            
            // Find the action file using area-aware method with HTTP method detection
            let actionPath = null;
            if (controllerName && areaName) {
                // Try with HTTP method first, then fallback
                actionPath = this.findActionMethodInControllerWithAreaAndHttpMethod(document.uri, actionName, controllerName, areaName, httpMethod);
                if (!actionPath) {
                    actionPath = this.findActionMethodInControllerWithArea(document.uri, actionName, controllerName, areaName);
                }
            } else if (controllerName) {
                // Try with HTTP method first, then fallback
                actionPath = this.findActionMethodInControllerWithHttpMethod(document.uri, actionName, controllerName, httpMethod);
                if (!actionPath) {
                    actionPath = this.findActionMethodInController(document.uri, actionName, controllerName);
                }
            } else {
                // When no controller specified, use view context to find the controller
                actionPath = this.findActionMethodFromViewWithHttpMethod(document.uri, actionName, httpMethod);
                if (!actionPath) {
                    actionPath = this.findActionMethodFromView(document.uri, actionName);
                }
            }
            
            if (actionPath) {
                const commandUri = this.createActionCommandUri(actionPath.filePath, actionPath.lineNumber);
                const link = new vscode.DocumentLink(actionRange, commandUri);
                link.tooltip = `Navigate to ${actionName} action (${httpMethod}) (line ${actionPath.lineNumber || '?'})`;
                links.push(link);
            }
            
            // If controller is specified, create link for it too
            if (controllerName) {
                const controllerStart = match.index + fullMatch.indexOf(`"${controllerName}"`) + 1;
                const controllerEnd = controllerStart + controllerName.length;
                const controllerRange = new vscode.Range(
                    document.positionAt(controllerStart),
                    document.positionAt(controllerEnd)
                );
                
                let controllerPath = null;
                if (areaName) {
                    controllerPath = this.findControllerFileInArea(document.uri, controllerName, areaName);
                } else {
                    controllerPath = this.findControllerFile(document.uri, controllerName);
                }
                
                if (controllerPath) {
                    const commandUri = this.createControllerCommandUri(controllerPath);
                    links.push(new vscode.DocumentLink(controllerRange, commandUri));
                }
            }
        }
    }

    private processPartialTagHelpers(document: vscode.TextDocument, text: string, links: vscode.DocumentLink[]): void {
        // Handle <partial name="PartialViewName" />
        let match;
        
        this.debugLog(`Processing partial tag helpers...`);
        
        // First, process full path partial tag helpers (more specific pattern)
        RegexPatterns.PARTIAL_TAG_HELPER_FULL_PATH_REGEX.lastIndex = 0;
        
        while ((match = RegexPatterns.PARTIAL_TAG_HELPER_FULL_PATH_REGEX.exec(text)) !== null) {
            const fullPath = match[1]; // The full path like "~/Views/Shared/_Navigation.cshtml"
            
            // Find the exact position of the quoted path
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const pathWithQuotes = `${quoteChar}${fullPath}${quoteChar}`;
            const pathStartInMatch = fullMatch.indexOf(pathWithQuotes);
            
            if (pathStartInMatch !== -1) {
                const startPos = document.positionAt(match.index + pathStartInMatch);
                const endPos = document.positionAt(match.index + pathStartInMatch + pathWithQuotes.length);
                const range = new vscode.Range(startPos, endPos);
                
                this.debugLog(`Found partial tag helper with full path: "${fullPath}" at line ${startPos.line + 1}`);
                
                const resolvedPath = this.resolveFullViewPath(document.uri, fullPath);
                
                if (resolvedPath) {
                    this.debugLog(`Resolved full path to: ${resolvedPath}`);
                    const link = new vscode.DocumentLink(range, vscode.Uri.file(resolvedPath));
                    link.tooltip = `Navigate to ${path.basename(fullPath)} (partial tag helper with full path)`;
                    links.push(link);
                } else {
                    this.debugLog(`Could not resolve full path: ${fullPath}`);
                }
            }
        }
        
        // Then, process regular partial tag helpers (less specific pattern, to avoid conflicts)
        RegexPatterns.PARTIAL_TAG_HELPER_NAME_REGEX.lastIndex = 0;
        
        while ((match = RegexPatterns.PARTIAL_TAG_HELPER_NAME_REGEX.exec(text)) !== null) {
            const partialViewName = match[1];
            
            // Skip if this looks like a full path (starts with ~/) - already handled above
            if (partialViewName.startsWith('~/')) {
                continue;
            }
            
            const startPos = document.positionAt(match.index + match[0].indexOf(match[1]) - 1); // Include the quote
            const endPos = document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length + 1); // Include the quote
            const range = new vscode.Range(startPos, endPos);
            
            this.debugLog(`Found partial tag helper: name="${partialViewName}" at line ${startPos.line + 1}`);
            
            // Find the partial view file
            const viewPath = this.findPartialViewFile(document.uri, partialViewName);
            if (viewPath) {
                this.debugLog(`Found partial view file: ${viewPath}`);
                const link = new vscode.DocumentLink(range, vscode.Uri.file(viewPath));
                link.tooltip = `Navigate to ${partialViewName}.cshtml`;
                links.push(link);
            } else {
                this.debugLog(`Partial view file not found for: ${partialViewName}`);
            }
        }
        
        this.debugLog(`Partial tag helper processing complete.`);
    }
}
