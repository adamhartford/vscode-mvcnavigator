import * as vscode from 'vscode';
import { MvcDocumentLinkProvider } from './MvcDocumentLinkProvider';

export class MvcDefinitionProvider implements vscode.DefinitionProvider {
    private linkProvider: MvcDocumentLinkProvider;

    constructor(linkProvider: MvcDocumentLinkProvider) {
        this.linkProvider = linkProvider;
    }

    provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        // Check if the position is within any of our document links
        const links = this.linkProvider.provideDocumentLinks(document);
        
        for (const link of links) {
            if (link.range.contains(position)) {
                // Return empty array to prevent default Go to Definition behavior
                return [];
            }
        }
        
        // Return undefined to allow default behavior for other positions
        return undefined;
    }
}
