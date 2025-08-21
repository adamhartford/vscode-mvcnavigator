import * as assert from 'assert';
import * as vscode from 'vscode';

suite('MVC Navigator Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all MVC Navigator tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('undefined_publisher.vscode-mvcnavigator'));
	});

	test('Should activate extension', async () => {
		const extension = vscode.extensions.getExtension('undefined_publisher.vscode-mvcnavigator');
		if (extension) {
			await extension.activate();
			assert.ok(extension.isActive);
		}
	});

	test('Should register navigate to view command', async () => {
		const commands = await vscode.commands.getCommands();
		assert.ok(commands.includes('vscode-mvcnavigator.navigateToView'));
	});
});
