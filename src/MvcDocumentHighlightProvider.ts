import * as vscode from 'vscode';
import { MvcDocumentLinkProvider } from './MvcDocumentLinkProvider';

export class MvcDocumentHighlightProvider implements vscode.DocumentHighlightProvider {
    private linkProvider: MvcDocumentLinkProvider;

    constructor(linkProvider: MvcDocumentLinkProvider) {
        this.linkProvider = linkProvider;
    }

    private getDebugLoggingEnabled(): boolean {
        const config = vscode.workspace.getConfiguration('mvcNavigator');
        return config.get<boolean>('enableDebugLogging', false);
    }

    private debugLog(message: string, ...args: any[]): void {
        if (this.getDebugLoggingEnabled()) {
            console.log(`[MvcDocumentHighlightProvider] ${message}`, ...args);
        }
    }

    provideDocumentHighlights(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentHighlight[]> {
        // Check if the position is within any of our document links
        const links = this.linkProvider.provideDocumentLinks(document);
        
        for (const link of links) {
            if (link.range.contains(position)) {
                // Return empty array to prevent default document highlighting behavior
                return [];
            }
        }
        
        // Return undefined to allow default behavior for other positions
        return undefined;
    }
}
