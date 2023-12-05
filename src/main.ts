import * as vscode from 'vscode';
import { TestHub, testExplorerExtensionId } from 'vscode-test-adapter-api';
import { Log, TestAdapterRegistrar } from 'vscode-test-adapter-util';
import { TestCafeAdapter } from './adapter';
import { SettingsView } from './settingsView';

export async function activate(context: vscode.ExtensionContext) {
	const settingsViewProvider = new SettingsView(context.extensionUri, context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SettingsView.viewType, settingsViewProvider, {
			webviewOptions: {retainContextWhenHidden: true}
		})
	);

	const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];
	const log = new Log('testcafeExplorer', workspaceFolder, 'TestCafe Explorer Log');
	
	context.subscriptions.push(log);

	const testExplorerExtension = vscode.extensions.getExtension<TestHub>(testExplorerExtensionId);
	if (log.enabled) log.info(`Test Explorer ${testExplorerExtension ? '' : 'not '}found`);

	if (testExplorerExtension) {
		const testHub = testExplorerExtension.exports;

		context.subscriptions.push(new TestAdapterRegistrar(
			testHub,
			workspaceFolder => new TestCafeAdapter(workspaceFolder, log, context),
			log
		));
	}
}
